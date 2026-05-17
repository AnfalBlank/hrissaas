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
  city: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radiusMeters: z.number().int().positive().optional(),
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
    await db.delete(schema.branches).where(eq(schema.branches.id, params.id));
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
