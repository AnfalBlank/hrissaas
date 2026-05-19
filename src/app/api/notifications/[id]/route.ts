/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const [existing] = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.id, params.id));
    if (!existing || existing.userId !== session.sub)
      return fail(404, "Notifikasi tidak ditemukan");
    const [row] = await db
      .update(schema.notifications)
      .set({ readAt: new Date() })
      .where(eq(schema.notifications.id, params.id))
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
    const session = await requireSession();
    const [existing] = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.id, params.id));
    if (!existing || existing.userId !== session.sub)
      return fail(404, "Notifikasi tidak ditemukan");
    await db
      .delete(schema.notifications)
      .where(eq(schema.notifications.id, params.id));
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
