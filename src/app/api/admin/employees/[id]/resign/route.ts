/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/auth/audit";
import { ok, fail, handleError } from "@/server/api/respond";

const Body = z.object({
  resignDate: z.string(), // YYYY-MM-DD
  reason: z.string().optional(),
  deactivateUser: z.boolean().default(true),
});

/**
 * Soft-resign pegawai:
 * - Set employee.status = 'inactive'
 * - Set employee.resignDate
 * - Optional: set users.active = false (lock login)
 *
 * Tetap mempertahankan history (attendance, payroll, dll).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(["super_admin", "hr"]);
    const body = Body.parse(await req.json());

    const [existing] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.id, params.id));
    if (!existing || existing.companyId !== session.companyId)
      return fail(404, "Pegawai tidak ditemukan");
    if (existing.status === "inactive")
      return fail(400, "Pegawai sudah berstatus inactive");

    const resignDate = new Date(body.resignDate);
    if (isNaN(resignDate.getTime())) return fail(400, "Format tanggal tidak valid");

    const [updated] = await db
      .update(schema.employees)
      .set({
        status: "inactive",
        resignDate,
      })
      .where(eq(schema.employees.id, params.id))
      .returning();

    if (body.deactivateUser) {
      await db
        .update(schema.users)
        .set({ active: false })
        .where(eq(schema.users.id, existing.userId));
    }

    audit({
      companyId: session.companyId,
      userId: session.sub,
      action: "employee.resign",
      details: {
        employeeId: params.id,
        employeeCode: existing.employeeCode,
        resignDate: body.resignDate,
        reason: body.reason,
        deactivatedUser: body.deactivateUser,
      },
    });

    return ok({
      employee: updated,
      message: `${existing.fullName} berhasil di-set resign per ${body.resignDate}.`,
    });
  } catch (e) {
    return handleError(e);
  }
}
