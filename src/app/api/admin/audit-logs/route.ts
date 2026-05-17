/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { ok, handleError } from "@/server/api/respond";

const ADMIN_ROLES = ["super_admin", "owner", "hr"];

export async function GET() {
  try {
    const session = await requireRole(ADMIN_ROLES);

    const logs = await db
      .select({
        id: schema.auditLogs.id,
        action: schema.auditLogs.action,
        details: schema.auditLogs.details,
        ip: schema.auditLogs.ip,
        userAgent: schema.auditLogs.userAgent,
        createdAt: schema.auditLogs.createdAt,
        userEmail: schema.users.email,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
      .where(eq(schema.auditLogs.companyId, session.companyId))
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(50);

    const [{ totalToday }] = await db
      .select({
        totalToday: sql<number>`count(*)`,
      })
      .from(schema.auditLogs)
      .where(
        sql`${schema.auditLogs.companyId} = ${session.companyId} AND ${schema.auditLogs.createdAt} >= unixepoch('now', 'start of day') * 1000`
      );

    return ok({ items: logs, totalToday });
  } catch (e) {
    return handleError(e);
  }
}
