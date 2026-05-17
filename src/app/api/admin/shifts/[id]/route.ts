/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";

const ADMIN_ROLES = ["super_admin", "hr"];

const Patch = z.object({
  name: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
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
    await db.delete(schema.shifts).where(eq(schema.shifts.id, params.id));
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
