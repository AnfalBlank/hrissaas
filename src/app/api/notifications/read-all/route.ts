/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { ok, handleError } from "@/server/api/respond";

export async function POST() {
  try {
    const session = await requireSession();
    const result = await db
      .update(schema.notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(schema.notifications.userId, session.sub),
          isNull(schema.notifications.readAt)
        )
      );
    return ok({ updated: true });
  } catch (e) {
    return handleError(e);
  }
}
