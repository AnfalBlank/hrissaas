/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/auth/audit";
import { ok, fail, handleError } from "@/server/api/respond";

const ADMIN_ROLES = ["super_admin", "hr"];

const Patch = z.object({
  name: z.string().min(1).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  graceMinutes: z.number().int().nonnegative().optional(),
  type: z.string().optional(),
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
      .from(schema.shifts)
      .where(eq(schema.shifts.id, params.id));
    if (!existing || existing.companyId !== session.companyId)
      return fail(404, "Shift tidak ditemukan");
    const [row] = await db
      .update(schema.shifts)
      .set(body)
      .where(eq(schema.shifts.id, params.id))
      .returning();
    audit({
      companyId: session.companyId,
      userId: session.sub,
      action: "shift.update",
      details: { shiftId: params.id, changedKeys: Object.keys(body) },
    });
    return ok({ shift: row });
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
      .from(schema.shifts)
      .where(eq(schema.shifts.id, params.id));
    if (!existing || existing.companyId !== session.companyId)
      return fail(404, "Shift tidak ditemukan");

    // Cek pegawai aktif memakai shift ini
    const inUse = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.shiftId, params.id));
    if (inUse.length > 0) {
      return fail(
        400,
        `Shift masih dipakai oleh ${inUse.length} pegawai. Pindahkan dulu sebelum hapus.`
      );
    }

    await db.delete(schema.shifts).where(eq(schema.shifts.id, params.id));
    audit({
      companyId: session.companyId,
      userId: session.sub,
      action: "shift.delete",
      details: { shiftId: params.id, name: existing.name },
    });
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
