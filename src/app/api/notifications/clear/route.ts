/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { and, eq, isNotNull } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { ok, handleError } from "@/server/api/respond";

/**
 * DELETE /api/notifications/clear?scope=read|all
 * - scope=read (default): hapus hanya yang sudah dibaca
 * - scope=all: hapus semua notifikasi user
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireSession();
    const scope = new URL(req.url).searchParams.get("scope") || "read";

    if (scope === "all") {
      await db
        .delete(schema.notifications)
        .where(eq(schema.notifications.userId, session.sub));
    } else {
      await db
        .delete(schema.notifications)
        .where(
          and(
            eq(schema.notifications.userId, session.sub),
            isNotNull(schema.notifications.readAt)
          )
        );
    }
    return ok({ cleared: true, scope });
  } catch (e) {
    return handleError(e);
  }
}
