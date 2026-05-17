/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { ok, handleError } from "@/server/api/respond";
import { todayLocalDate } from "@/server/lib/geo";

const ADMIN_ROLES = ["super_admin", "owner", "hr", "supervisor"];

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const url = new URL(req.url);
    const date = url.searchParams.get("date") || todayLocalDate();

    const rows = await db
      .select({
        id: schema.attendances.id,
        date: schema.attendances.date,
        status: schema.attendances.status,
        checkInAt: schema.attendances.checkInAt,
        checkOutAt: schema.attendances.checkOutAt,
        method: schema.attendances.checkInMethod,
        lateMinutes: schema.attendances.lateMinutes,
        employeeId: schema.employees.id,
        employeeCode: schema.employees.employeeCode,
        fullName: schema.employees.fullName,
        division: schema.employees.division,
        position: schema.employees.position,
        branchName: schema.branches.name,
      })
      .from(schema.attendances)
      .leftJoin(
        schema.employees,
        eq(schema.attendances.employeeId, schema.employees.id)
      )
      .leftJoin(
        schema.branches,
        eq(schema.attendances.branchId, schema.branches.id)
      )
      .where(
        and(
          eq(schema.attendances.companyId, session.companyId),
          eq(schema.attendances.date, date)
        )
      )
      .orderBy(desc(schema.attendances.checkInAt))
      .limit(200);

    const summary = {
      present: rows.filter((r) => r.status === "present").length,
      late: rows.filter((r) => r.status === "late").length,
      leave: rows.filter((r) => r.status === "leave").length,
      sick: rows.filter((r) => r.status === "sick").length,
      alpha: rows.filter((r) => r.status === "alpha").length,
    };

    return ok({ items: rows, summary, date });
  } catch (e) {
    return handleError(e);
  }
}
