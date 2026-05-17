/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { ok, handleError } from "@/server/api/respond";
import { todayLocalDate } from "@/server/lib/geo";

const ADMIN_ROLES = ["super_admin", "owner", "hr"];

export async function GET() {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const today = todayLocalDate();

    const [totalEmployees] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.employees)
      .where(eq(schema.employees.companyId, session.companyId));

    const todayAttendances = await db
      .select()
      .from(schema.attendances)
      .where(
        and(
          eq(schema.attendances.companyId, session.companyId),
          eq(schema.attendances.date, today)
        )
      );

    const present = todayAttendances.filter((a) => a.status === "present").length;
    const late = todayAttendances.filter((a) => a.status === "late").length;
    const sick = todayAttendances.filter((a) => a.status === "sick").length;
    const onLeave = todayAttendances.filter((a) => a.status === "leave").length;

    // Last 7 days bar
    const days: { day: string; date: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        day: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][d.getDay()],
        date: d.toISOString().slice(0, 10),
      });
    }
    const sinceDate = days[0].date;
    const recent = await db
      .select()
      .from(schema.attendances)
      .where(
        and(
          eq(schema.attendances.companyId, session.companyId),
          gte(schema.attendances.date, sinceDate)
        )
      );
    const chart = days.map((d) => {
      const rows = recent.filter((r) => r.date === d.date);
      return {
        day: d.day,
        hadir: rows.filter((r) => r.status === "present").length,
        telat: rows.filter((r) => r.status === "late").length,
        cuti: rows.filter((r) => r.status === "leave").length,
      };
    });

    // Division distribution
    const employees = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.companyId, session.companyId));
    const divisionMap = new Map<string, number>();
    employees.forEach((e) => {
      const k = e.division || "Lainnya";
      divisionMap.set(k, (divisionMap.get(k) ?? 0) + 1);
    });
    const divisions = Array.from(divisionMap, ([name, v]) => ({ name, v }));

    // Branches
    const branches = await db
      .select()
      .from(schema.branches)
      .where(eq(schema.branches.companyId, session.companyId));
    const branchStats = branches.map((b) => {
      const total = employees.filter((e) => e.branchId === b.id).length;
      const todayB = todayAttendances.filter((a) => a.branchId === b.id);
      const presentB = todayB.filter(
        (a) => a.status === "present" || a.status === "late"
      ).length;
      return {
        id: b.id,
        name: b.name,
        city: b.city,
        employees: total,
        percent: total ? Math.round((presentB / total) * 100) : 0,
      };
    });

    // Live feed
    const feed = await db
      .select({
        id: schema.attendances.id,
        status: schema.attendances.status,
        method: schema.attendances.checkInMethod,
        checkInAt: schema.attendances.checkInAt,
        date: schema.attendances.date,
        employeeName: schema.employees.fullName,
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
      .where(eq(schema.attendances.companyId, session.companyId))
      .orderBy(desc(schema.attendances.checkInAt))
      .limit(8);

    return ok({
      stats: {
        totalEmployees: totalEmployees.count,
        present,
        late,
        sick,
        onLeave,
      },
      chart,
      divisions,
      branches: branchStats,
      feed,
    });
  } catch (e) {
    return handleError(e);
  }
}
