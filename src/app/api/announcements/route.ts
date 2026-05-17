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
      .from(schema.announcements)
      .where(eq(schema.announcements.companyId, session.companyId))
      .orderBy(desc(schema.announcements.createdAt));
    return ok({ items: rows });
  } catch (e) {
    return handleError(e);
  }
}
