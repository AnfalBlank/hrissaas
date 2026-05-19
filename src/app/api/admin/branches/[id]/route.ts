/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/auth/audit";
import { ok, fail, handleError } from "@/server/api/respond";

const ADMIN_ROLES = ["super_admin", "hr"];

const Patch = z.object({
  name: z.string().min(1).optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusMeters: z.number().int().positive().max(100_000).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const body = Patch.parse(await req.json());
    const [existing] = await db
      .select()
      .from(schema.branches)
      .where(eq(schema.branches.id, params.id));
    if (!existing || existing.companyId !== session.companyId)
      return fail(404, "Cabang tidak ditemukan");
    const [row] = await db
      .update(schema.branches)
      .set(body)
      .where(eq(schema.branches.id, params.id))
      .returning();
    audit({
      companyId: session.companyId,
      userId: session.sub,
      action: "branch.update",
      details: { branchId: params.id, changedKeys: Object.keys(body) },
    });
    return ok({ branch: row });
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
      .from(schema.branches)
      .where(eq(schema.branches.id, params.id));
    if (!existing || existing.companyId !== session.companyId)
      return fail(404, "Cabang tidak ditemukan");

    // Cek pegawai aktif di cabang ini
    const employeeCount = await db
      .select()
      .from(schema.employees)
      .where(
        and(
          eq(schema.employees.branchId, params.id),
          eq(schema.employees.status, "active")
        )
      );
    if (employeeCount.length > 0) {
      return fail(
        400,
        `Cabang masih punya ${employeeCount.length} pegawai aktif. Pindahkan dulu sebelum hapus.`
      );
    }

    await db.delete(schema.branches).where(eq(schema.branches.id, params.id));
    audit({
      companyId: session.companyId,
      userId: session.sub,
      action: "branch.delete",
      details: { branchId: params.id, name: existing.name },
    });
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
