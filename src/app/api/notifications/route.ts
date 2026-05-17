/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { ok, handleError } from "@/server/api/respond";

export async function GET() {
  try {
    const session = await requireSession();
    const rows = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, session.sub))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(50);
    return ok({ items: rows });
  } catch (e) {
    return handleError(e);
  }
}
