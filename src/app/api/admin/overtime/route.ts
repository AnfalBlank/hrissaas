/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
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

    const filters = [eq(schema.overtimeRequests.companyId, session.companyId)];
    if (status) filters.push(eq(schema.overtimeRequests.status, status));

    const rows = await db
      .select({
        id: schema.overtimeRequests.id,
        date: schema.overtimeRequests.date,
        startTime: schema.overtimeRequests.startTime,
        endTime: schema.overtimeRequests.endTime,
        hours: schema.overtimeRequests.hours,
        description: schema.overtimeRequests.description,
        status: schema.overtimeRequests.status,
        createdAt: schema.overtimeRequests.createdAt,
        employeeId: schema.employees.id,
        fullName: schema.employees.fullName,
        position: schema.employees.position,
        employeeCode: schema.employees.employeeCode,
      })
      .from(schema.overtimeRequests)
      .leftJoin(
        schema.employees,
        eq(schema.overtimeRequests.employeeId, schema.employees.id)
      )
      .where(and(...filters))
      .orderBy(desc(schema.overtimeRequests.createdAt))
      .limit(100);

    const summary = {
      pending: rows.filter((r) => r.status === "pending").length,
      approved: rows.filter((r) => r.status === "approved").length,
      rejected: rows.filter((r) => r.status === "rejected").length,
      totalHours: rows
        .filter((r) => r.status === "approved")
        .reduce((s, r) => s + (r.hours || 0), 0),
    };

    return ok({ items: rows, summary });
  } catch (e) {
    return handleError(e);
  }
}

const Patch = z.object({
  id: z.string(),
  status: z.enum(["approved", "rejected"]),
  note: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const body = Patch.parse(await req.json());

    const [existing] = await db
      .select()
      .from(schema.overtimeRequests)
      .where(eq(schema.overtimeRequests.id, body.id));
    if (!existing || existing.companyId !== session.companyId)
      return fail(404, "Pengajuan tidak ditemukan");

    const [row] = await db
      .update(schema.overtimeRequests)
      .set({
        status: body.status,
        approverId: session.sub,
        approverNote: body.note,
        approvedAt: new Date(),
      })
      .where(eq(schema.overtimeRequests.id, body.id))
      .returning();

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
            ? "Pengajuan lembur disetujui ✅"
            : "Pengajuan lembur ditolak",
        body: `${row.date} · ${row.startTime}-${row.endTime} (${row.hours}j)${body.note ? `\nCatatan: ${body.note}` : ""}`,
        category: "attendance",
        icon: body.status === "approved" ? "check" : "cross",
        link: "/app/overtime",
        whatsapp: true,
      }).catch(() => {});
    }

    broadcastFeed(session.companyId, "overtime:decided", {
      overtime: row,
      status: body.status,
    });

    audit({
      companyId: session.companyId,
      userId: session.sub,
      action: `overtime.${body.status}`,
      details: {
        overtimeId: row.id,
        employeeId: row.employeeId,
        date: row.date,
        hours: row.hours,
      },
    });

    return ok({ overtime: row });
  } catch (e) {
    return handleError(e);
  }
}
