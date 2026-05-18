/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { and, eq, ne } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { ok, handleError } from "@/server/api/respond";

/**
 * Daftar employee di company yang sama untuk dipilih sebagai contact chat.
 */
export async function GET() {
  try {
    const session = await requireSession();
    const rows = await db
      .select({
        userId: schema.users.id,
        email: schema.users.email,
        role: schema.users.role,
        fullName: schema.employees.fullName,
        avatarUrl: schema.employees.avatarUrl,
        position: schema.employees.position,
        division: schema.employees.division,
      })
      .from(schema.users)
      .leftJoin(schema.employees, eq(schema.users.id, schema.employees.userId))
      .where(
        and(
          eq(schema.users.companyId, session.companyId),
          ne(schema.users.id, session.sub)
        )
      );
    return ok({ items: rows });
  } catch (e) {
    return handleError(e);
  }
}
