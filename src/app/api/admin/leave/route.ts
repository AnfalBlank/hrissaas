/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/auth/audit";
import { ok, fail, handleError } from "@/server/api/respond";
import { broadcastFeed, notify } from "@/server/notifications/dispatch";

const ADMIN_ROLES = ["super_admin", "owner", "hr", "supervisor"];

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    const filters = [eq(schema.leaves.companyId, session.companyId)];
    if (status) filters.push(eq(schema.leaves.status, status));

    const rows = await db
      .select({
        id: schema.leaves.id,
        type: schema.leaves.type,
        fromDate: schema.leaves.fromDate,
        toDate: schema.leaves.toDate,
        days: schema.leaves.days,
        reason: schema.leaves.reason,
        status: schema.leaves.status,
        createdAt: schema.leaves.createdAt,
        employeeId: schema.employees.id,
        fullName: schema.employees.fullName,
        position: schema.employees.position,
      })
      .from(schema.leaves)
      .leftJoin(
        schema.employees,
        eq(schema.leaves.employeeId, schema.employees.id)
      )
      .where(and(...filters))
      .orderBy(desc(schema.leaves.createdAt))
      .limit(100);

    const summary = {
      pending: rows.filter((r) => r.status === "pending").length,
      approved: rows.filter((r) => r.status === "approved").length,
      rejected: rows.filter((r) => r.status === "rejected").length,
      total: rows.length,
    };

    return ok({ items: rows, summary });
  } catch (e) {
    return handleError(e);
  }
}

const PatchBody = z.object({
  id: z.string(),
  status: z.enum(["approved", "rejected"]),
  note: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const body = PatchBody.parse(await req.json());

    const [existing] = await db
      .select()
      .from(schema.leaves)
      .where(eq(schema.leaves.id, body.id));
    if (!existing) return fail(404, "Pengajuan tidak ditemukan");
    if (existing.companyId !== session.companyId) return fail(403, "Forbidden");

    const wasApproved = existing.status === "approved";
    const willBeApproved = body.status === "approved";
    const year = new Date(existing.fromDate).getFullYear();

    // Validasi quota saat approve (kalau belum approve sebelumnya)
    if (willBeApproved && !wasApproved) {
      const [quota] = await db
        .select()
        .from(schema.leaveQuotas)
        .where(
          and(
            eq(schema.leaveQuotas.employeeId, existing.employeeId),
            eq(schema.leaveQuotas.type, existing.type),
            eq(schema.leaveQuotas.year, year)
          )
        );
      if (quota) {
        const remaining = quota.total - quota.used;
        if (remaining < existing.days) {
          return fail(
            400,
            `Tidak bisa approve: kuota ${existing.type} tahun ${year} tersisa ${remaining} hari, dibutuhkan ${existing.days} hari.`
          );
        }
      }
    }

    const [row] = await db
      .update(schema.leaves)
      .set({
        status: body.status,
        approverId: session.sub,
        approverNote: body.note,
        approvedAt: new Date(),
      })
      .where(eq(schema.leaves.id, body.id))
      .returning();

    // Auto-update kuota
    // - approve baru: decrement used += days
    // - approved → rejected: restore used -= days
    if (!wasApproved && willBeApproved) {
      await db
        .update(schema.leaveQuotas)
        .set({ used: sql`${schema.leaveQuotas.used} + ${existing.days}` })
        .where(
          and(
            eq(schema.leaveQuotas.employeeId, existing.employeeId),
            eq(schema.leaveQuotas.type, existing.type),
            eq(schema.leaveQuotas.year, year)
          )
        );
    } else if (wasApproved && !willBeApproved) {
      await db
        .update(schema.leaveQuotas)
        .set({
          used: sql`MAX(0, ${schema.leaveQuotas.used} - ${existing.days})`,
        })
        .where(
          and(
            eq(schema.leaveQuotas.employeeId, existing.employeeId),
            eq(schema.leaveQuotas.type, existing.type),
            eq(schema.leaveQuotas.year, year)
          )
        );
    }

    audit({
      companyId: session.companyId,
      userId: session.sub,
      action: `leave.${body.status}`,
      details: {
        leaveId: row.id,
        employeeId: row.employeeId,
        type: row.type,
        days: row.days,
        fromDate: row.fromDate,
        toDate: row.toDate,
      },
    });

    // Notify the employee whose leave was decided
    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.id, row.employeeId));

    if (employee?.userId) {
      notify({
        userId: employee.userId,
        companyId: session.companyId,
        title:
          body.status === "approved"
            ? "Pengajuan cuti disetujui ✅"
            : "Pengajuan cuti ditolak",
        body: `${row.fromDate} → ${row.toDate} (${row.days} hari)${body.note ? `\nCatatan: ${body.note}` : ""}`,
        category: "leave",
        icon: body.status === "approved" ? "check" : "cross",
        link: "/app/leave",
        whatsapp: true,
      }).catch(() => {});
    }

    broadcastFeed(session.companyId, "leave:decided", {
      leave: row,
      employeeId: row.employeeId,
      status: body.status,
    });

    return ok({ leave: row });
  } catch (e) {
    return handleError(e);
  }
}
