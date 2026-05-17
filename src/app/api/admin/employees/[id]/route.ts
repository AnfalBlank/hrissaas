/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";

const ADMIN_ROLES = ["super_admin", "hr"];

const Patch = z.object({
  fullName: z.string().optional(),
  position: z.string().optional(),
  division: z.string().optional(),
  phone: z.string().optional(),
  branchId: z.string().nullable().optional(),
  shiftId: z.string().nullable().optional(),
  baseSalary: z.number().int().nonnegative().optional(),
  status: z.enum(["active", "leave", "inactive"]).optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  role: z.enum(["employee", "supervisor", "hr", "owner"]).optional(),
  ptkpStatus: z
    .enum(["TK/0", "TK/1", "TK/2", "TK/3", "K/0", "K/1", "K/2", "K/3"])
    .optional(),
  npwp: z.string().optional(),
  maritalStatus: z
    .enum(["single", "married", "widowed", "divorced"])
    .optional(),
  jkkClass: z.number().int().min(1).max(5).optional(),
  joinDate: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(["super_admin", "owner", "hr", "supervisor"]);
    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(
        and(
          eq(schema.employees.id, params.id),
          eq(schema.employees.companyId, session.companyId)
        )
      );
    if (!employee) return fail(404, "Pegawai tidak ditemukan");
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, employee.userId));
    return ok({ employee, user });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const body = Patch.parse(await req.json());

    const [existing] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.id, params.id));
    if (!existing || existing.companyId !== session.companyId)
      return fail(404, "Pegawai tidak ditemukan");

    const { role, joinDate, ...empPatch } = body;
    const updateData: any = { ...empPatch };
    if (joinDate !== undefined) {
      updateData.joinDate = joinDate ? new Date(joinDate) : null;
    }
    const [employee] = await db
      .update(schema.employees)
      .set(updateData)
      .where(eq(schema.employees.id, params.id))
      .returning();

    if (role) {
      await db
        .update(schema.users)
        .set({ role })
        .where(eq(schema.users.id, existing.userId));
    }

    return ok({ employee });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const [existing] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.id, params.id));
    if (!existing || existing.companyId !== session.companyId)
      return fail(404, "Pegawai tidak ditemukan");

    // Cascade via FK + soft handle: delete user removes employee row too
    await db.delete(schema.users).where(eq(schema.users.id, existing.userId));
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
