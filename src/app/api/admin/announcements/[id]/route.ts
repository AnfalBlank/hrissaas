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
  type: z.enum(["banner", "article", "announcement", "promo"]).optional(),
  title: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  imageUrl: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["live", "draft"]).optional(),
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
      .from(schema.announcements)
      .where(eq(schema.announcements.id, params.id));
    if (!existing || existing.companyId !== session.companyId)
      return fail(404, "Konten tidak ditemukan");
    const [row] = await db
      .update(schema.announcements)
      .set(body)
      .where(eq(schema.announcements.id, params.id))
      .returning();
    return ok({ item: row });
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
      .from(schema.announcements)
      .where(eq(schema.announcements.id, params.id));
    if (!existing || existing.companyId !== session.companyId)
      return fail(404, "Konten tidak ditemukan");
    await db
      .delete(schema.announcements)
      .where(eq(schema.announcements.id, params.id));
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
