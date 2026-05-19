/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { ok, handleError } from "@/server/api/respond";
import { todayLocalDate } from "@/server/lib/geo";

const ADMIN_ROLES = ["super_admin", "owner", "hr", "supervisor"];

export async function GET() {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const today = todayLocalDate();

    const [branches, employees] = await Promise.all([
      db
        .select()
        .from(schema.branches)
        .where(eq(schema.branches.companyId, session.companyId)),
      db
        .select()
        .from(schema.employees)
        .where(
          and(
            eq(schema.employees.companyId, session.companyId),
            eq(schema.employees.status, "active")
          )
        ),
    ]);

    const live = await db
      .select({
        id: schema.attendances.id,
        status: schema.attendances.status,
        lat: schema.attendances.checkInLat,
        lng: schema.attendances.checkInLng,
        checkInAt: schema.attendances.checkInAt,
        method: schema.attendances.checkInMethod,
        lateMinutes: schema.attendances.lateMinutes,
        empId: schema.employees.id,
        name: schema.employees.fullName,
        branchName: schema.branches.name,
        branchId: schema.attendances.branchId,
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
          eq(schema.attendances.date, today)
        )
      )
      .orderBy(desc(schema.attendances.checkInAt))
      .limit(100);

    const branchesOut = branches.map((b) => ({
      id: b.id,
      name: b.name,
      city: b.city ?? undefined,
      latitude: b.latitude!,
      longitude: b.longitude!,
      radiusMeters: b.radiusMeters ?? 100,
      employees: employees.filter((e) => e.branchId === b.id).length,
    }));

    const employeesOut = live
      .filter((r) => r.lat != null && r.lng != null && r.name)
      .map((r) => ({
        id: r.id,
        name: r.name!,
        branchName: r.branchName ?? undefined,
        status: r.status,
        lat: r.lat!,
        lng: r.lng!,
      }));

    const stats = {
      present: live.filter((r) => r.status === "present").length,
      late: live.filter((r) => r.status === "late").length,
      total: live.length,
    };

    return ok({ branches: branchesOut, employees: employeesOut, stats, feed: live.slice(0, 12) });
  } catch (e) {
    return handleError(e);
  }
}
