/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";
import { haversine, todayLocalDate } from "@/server/lib/geo";
import { broadcastFeed } from "@/server/notifications/dispatch";

const Body = z.object({
  latitude: z.number(),
  longitude: z.number(),
  method: z.enum(["face", "qr", "manual"]).default("face"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.employeeId) return fail(400, "Bukan akun pegawai");
    const body = Body.parse(await req.json());

    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.id, session.employeeId));
    if (!employee) return fail(404, "Pegawai tidak ditemukan");

    if (employee.branchId) {
      const [branch] = await db
        .select()
        .from(schema.branches)
        .where(eq(schema.branches.id, employee.branchId));
      if (branch?.latitude && branch?.longitude) {
        const distance = haversine(
          body.latitude,
          body.longitude,
          branch.latitude,
          branch.longitude
        );
        if (distance > (branch.radiusMeters ?? 100)) {
          return fail(400, `Di luar radius kantor (${Math.round(distance)}m)`);
        }
      }
    }

    const date = todayLocalDate();
    const [existing] = await db
      .select()
      .from(schema.attendances)
      .where(
        and(
          eq(schema.attendances.employeeId, employee.id),
          eq(schema.attendances.date, date)
        )
      );

    if (!existing) return fail(400, "Belum check-in hari ini");
    if (existing.checkOutAt) return fail(400, "Sudah check-out hari ini");

    // Overtime calc
    let overtimeMinutes = 0;
    if (employee.shiftId) {
      const [shift] = await db
        .select()
        .from(schema.shifts)
        .where(eq(schema.shifts.id, employee.shiftId));
      if (shift) {
        const [hh, mm] = shift.endTime.split(":").map(Number);
        const target = new Date();
        target.setHours(hh, mm, 0, 0);
        const diff = Math.floor((Date.now() - target.getTime()) / 60000);
        if (diff > 30) overtimeMinutes = diff;
      }
    }

    const [row] = await db
      .update(schema.attendances)
      .set({
        checkOutAt: new Date(),
        checkOutLat: body.latitude,
        checkOutLng: body.longitude,
        checkOutMethod: body.method,
        overtimeMinutes,
      })
      .where(eq(schema.attendances.id, existing.id))
      .returning();

    broadcastFeed(employee.companyId, "attendance:check-out", {
      attendance: row,
      employee: {
        id: employee.id,
        fullName: employee.fullName,
        employeeCode: employee.employeeCode,
      },
      branchId: employee.branchId,
      overtimeMinutes,
    });

    return ok({ attendance: row, overtimeMinutes });
  } catch (e) {
    return handleError(e);
  }
}
