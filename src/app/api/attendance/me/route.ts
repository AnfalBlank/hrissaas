/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { and, desc, eq, gte } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";
import { todayLocalDate } from "@/server/lib/geo";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.employeeId) return fail(400, "Bukan akun pegawai");

    const url = new URL(req.url);
    const month = url.searchParams.get("month"); // YYYY-MM
    const today = todayLocalDate();

    const filter = month
      ? and(
          eq(schema.attendances.employeeId, session.employeeId),
          gte(schema.attendances.date, `${month}-01`)
        )
      : eq(schema.attendances.employeeId, session.employeeId);

    const rows = await db
      .select()
      .from(schema.attendances)
      .where(filter)
      .orderBy(desc(schema.attendances.date))
      .limit(60);

    const todayRow = rows.find((r) => r.date === today) ?? null;

    return ok({ today: todayRow, history: rows });
  } catch (e) {
    return handleError(e);
  }
}
