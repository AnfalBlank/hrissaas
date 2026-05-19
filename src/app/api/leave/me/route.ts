/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { and, desc, eq, gte, lte, ne } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";
import { broadcastFeed } from "@/server/notifications/dispatch";

export async function GET() {
  try {
    const session = await requireSession();
    if (!session.employeeId) return fail(400, "Bukan akun pegawai");

    const year = new Date().getFullYear();
    const [quotas, list] = await Promise.all([
      db
        .select()
        .from(schema.leaveQuotas)
        .where(
          and(
            eq(schema.leaveQuotas.employeeId, session.employeeId),
            eq(schema.leaveQuotas.year, year)
          )
        ),
      db
        .select()
        .from(schema.leaves)
        .where(eq(schema.leaves.employeeId, session.employeeId))
        .orderBy(desc(schema.leaves.createdAt))
        .limit(50),
    ]);

    return ok({ quotas, leaves: list });
  } catch (e) {
    return handleError(e);
  }
}

const Body = z.object({
  type: z.enum(["annual", "sick", "permission", "emergency"]),
  fromDate: z.string(),
  toDate: z.string(),
  reason: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.employeeId) return fail(400, "Bukan akun pegawai");
    const body = Body.parse(await req.json());

    // Validasi tanggal
    const start = new Date(body.fromDate);
    const end = new Date(body.toDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()))
      return fail(400, "Format tanggal tidak valid");
    if (end < start) return fail(400, "Tanggal akhir tidak boleh sebelum tanggal mulai");

    const days = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    // Validasi tidak overlap dengan leave existing (pending/approved)
    const overlapping = await db
      .select()
      .from(schema.leaves)
      .where(
        and(
          eq(schema.leaves.employeeId, session.employeeId),
          ne(schema.leaves.status, "rejected"),
          lte(schema.leaves.fromDate, body.toDate),
          gte(schema.leaves.toDate, body.fromDate)
        )
      );
    if (overlapping.length > 0) {
      return fail(
        400,
        `Sudah ada pengajuan cuti yang overlap di rentang tanggal ini (${overlapping[0].fromDate} → ${overlapping[0].toDate}, status ${overlapping[0].status}).`
      );
    }

    // Validasi quota cukup
    const year = start.getFullYear();
    const [quota] = await db
      .select()
      .from(schema.leaveQuotas)
      .where(
        and(
          eq(schema.leaveQuotas.employeeId, session.employeeId),
          eq(schema.leaveQuotas.type, body.type),
          eq(schema.leaveQuotas.year, year)
        )
      );

    if (quota) {
      const remaining = quota.total - quota.used;
      if (remaining < days) {
        return fail(
          400,
          `Kuota cuti ${body.type} tahun ${year} tidak cukup: tersisa ${remaining} hari, butuh ${days} hari.`
        );
      }
    }

    const [row] = await db
      .insert(schema.leaves)
      .values({
        employeeId: session.employeeId,
        companyId: session.companyId,
        type: body.type,
        fromDate: body.fromDate,
        toDate: body.toDate,
        days,
        reason: body.reason,
        attachmentUrl: body.attachmentUrl,
        status: "pending",
      })
      .returning();

    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.id, session.employeeId));

    broadcastFeed(session.companyId, "leave:applied", {
      leave: row,
      employee: employee
        ? {
            id: employee.id,
            fullName: employee.fullName,
            employeeCode: employee.employeeCode,
          }
        : null,
    });

    return ok({ leave: row });
  } catch (e) {
    return handleError(e);
  }
}
