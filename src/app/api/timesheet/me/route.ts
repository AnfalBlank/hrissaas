/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";

/**
 * Timesheet aggregator: derives daily/weekly working hours from
 * attendances + overtime entries.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.employeeId) return fail(400, "Bukan akun pegawai");
    const url = new URL(req.url);
    const month =
      url.searchParams.get("month") ||
      `${new Date().getFullYear()}-${String(
        new Date().getMonth() + 1
      ).padStart(2, "0")}`;

    const rows = await db
      .select()
      .from(schema.attendances)
      .where(
        and(
          eq(schema.attendances.employeeId, session.employeeId),
          gte(schema.attendances.date, `${month}-01`),
          lte(schema.attendances.date, `${month}-31`)
        )
      )
      .orderBy(desc(schema.attendances.date));

    const overtimes = await db
      .select()
      .from(schema.overtimeRequests)
      .where(
        and(
          eq(schema.overtimeRequests.employeeId, session.employeeId),
          gte(schema.overtimeRequests.date, `${month}-01`),
          lte(schema.overtimeRequests.date, `${month}-31`)
        )
      );

    const items = rows.map((a) => {
      let workedMinutes = 0;
      if (a.checkInAt && a.checkOutAt) {
        workedMinutes = Math.max(
          0,
          Math.round(
            (new Date(a.checkOutAt).getTime() -
              new Date(a.checkInAt).getTime()) /
              60000
          )
        );
      }
      const ot = overtimes
        .filter((o) => o.date === a.date && o.status === "approved")
        .reduce((s, o) => s + (o.hours || 0) * 60, 0);
      return {
        date: a.date,
        status: a.status,
        checkInAt: a.checkInAt,
        checkOutAt: a.checkOutAt,
        lateMinutes: a.lateMinutes ?? 0,
        workedMinutes,
        overtimeMinutes: (a.overtimeMinutes ?? 0) + ot,
      };
    });

    const summary = items.reduce(
      (s, r) => ({
        days: s.days + (r.workedMinutes > 0 ? 1 : 0),
        totalMinutes: s.totalMinutes + r.workedMinutes,
        overtimeMinutes: s.overtimeMinutes + r.overtimeMinutes,
        lateMinutes: s.lateMinutes + r.lateMinutes,
      }),
      { days: 0, totalMinutes: 0, overtimeMinutes: 0, lateMinutes: 0 }
    );

    return ok({ month, items, summary });
  } catch (e) {
    return handleError(e);
  }
}
