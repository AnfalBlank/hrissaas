/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { and, desc, eq, like, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { ok, handleError } from "@/server/api/respond";

const ADMIN_ROLES = ["super_admin", "owner", "hr"];

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(
      200,
      Math.max(10, parseInt(url.searchParams.get("limit") || "50", 10))
    );
    const action = url.searchParams.get("action"); // exact or prefix with .*
    const userEmail = url.searchParams.get("user");
    const offset = (page - 1) * limit;

    const filters: SQL[] = [eq(schema.auditLogs.companyId, session.companyId)];
    if (action) {
      // action filter: pakai LIKE jika berisi *
      if (action.includes("*")) {
        filters.push(like(schema.auditLogs.action, action.replace(/\*/g, "%")));
      } else {
        filters.push(eq(schema.auditLogs.action, action));
      }
    }
    if (userEmail) {
      filters.push(like(schema.users.email, `%${userEmail}%`));
    }

    const baseQuery = db
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
      .where(and(...filters));

    const logs = await baseQuery
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
      .where(and(...filters));

    const [{ totalToday }] = await db
      .select({
        totalToday: sql<number>`count(*)`,
      })
      .from(schema.auditLogs)
      .where(
        sql`${schema.auditLogs.companyId} = ${session.companyId} AND ${schema.auditLogs.createdAt} >= unixepoch('now', 'start of day') * 1000`
      );

    // Distinct actions untuk dropdown filter
    const distinctActions = await db
      .selectDistinct({ action: schema.auditLogs.action })
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.companyId, session.companyId))
      .limit(100);

    return ok({
      items: logs,
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
      totalToday: Number(totalToday),
      actions: distinctActions.map((a) => a.action).sort(),
    });
  } catch (e) {
    return handleError(e);
  }
}
