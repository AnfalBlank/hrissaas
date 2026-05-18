/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { jwtVerify } from "jose";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";
import { haversine, todayLocalDate, minutesSinceTarget } from "@/server/lib/geo";
import { broadcastFeed, notify } from "@/server/notifications/dispatch";
import { audit } from "@/server/auth/audit";

const QR_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me"
);

const Body = z.object({
  token: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.employeeId) return fail(400, "Bukan akun pegawai");

    const body = Body.parse(await req.json());

    let claims: any;
    try {
      const { payload } = await jwtVerify(body.token, QR_SECRET);
      claims = payload;
    } catch {
      return fail(400, "QR Code kadaluarsa atau tidak valid");
    }

    if (claims.companyId !== session.companyId)
      return fail(403, "QR bukan untuk perusahaan Anda");

    if (claims.lat && claims.lng) {
      const distance = haversine(
        body.latitude,
        body.longitude,
        claims.lat,
        claims.lng
      );
      if (distance > (claims.radius ?? 100)) {
        return fail(
          400,
          `Anda terlalu jauh dari titik QR (${Math.round(distance)}m)`
        );
      }
    }

    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.id, session.employeeId));
    if (!employee) return fail(404, "Pegawai tidak ditemukan");

    const date = todayLocalDate();
    const existing = await db
      .select()
      .from(schema.attendances)
      .where(
        and(
          eq(schema.attendances.employeeId, employee.id),
          eq(schema.attendances.date, date)
        )
      );
    if (existing.length > 0 && existing[0].checkInAt)
      return fail(400, "Anda sudah check-in hari ini");

    // Late detection
    let lateMinutes = 0;
    let status = "present";
    if (employee.shiftId) {
      const [shift] = await db
        .select()
        .from(schema.shifts)
        .where(eq(schema.shifts.id, employee.shiftId));
      if (shift) {
        const diffMin = minutesSinceTarget(shift.startTime);
        if (diffMin > (shift.graceMinutes ?? 5)) {
          lateMinutes = diffMin;
          status = "late";
        }
      }
    }

    const now = new Date();
    let row;
    if (existing.length > 0) {
      [row] = await db
        .update(schema.attendances)
        .set({
          checkInAt: now,
          checkInLat: body.latitude,
          checkInLng: body.longitude,
          checkInMethod: "qr",
          status,
          lateMinutes,
          branchId: claims.branchId,
        })
        .where(eq(schema.attendances.id, existing[0].id))
        .returning();
    } else {
      [row] = await db
        .insert(schema.attendances)
        .values({
          employeeId: employee.id,
          companyId: employee.companyId,
          branchId: claims.branchId,
          date,
          checkInAt: now,
          checkInLat: body.latitude,
          checkInLng: body.longitude,
          checkInMethod: "qr",
          status,
          lateMinutes,
        })
        .returning();
    }

    broadcastFeed(employee.companyId, "attendance:check-in", {
      attendance: row,
      employee: {
        id: employee.id,
        fullName: employee.fullName,
        employeeCode: employee.employeeCode,
      },
      branchId: claims.branchId,
      status,
      lateMinutes,
    });

    audit({
      companyId: employee.companyId,
      userId: session.sub,
      action: "attendance.check_in.qr",
      details: { status, lateMinutes },
    });

    if (status === "late") {
      notify({
        userId: session.sub,
        companyId: employee.companyId,
        title: `Anda terlambat ${lateMinutes} menit`,
        body: "Check-in via QR Code.",
        category: "attendance",
        icon: "warning",
        whatsapp: true,
      }).catch(() => {});
    }

    return ok({ attendance: row, status, lateMinutes });
  } catch (e) {
    return handleError(e);
  }
}
