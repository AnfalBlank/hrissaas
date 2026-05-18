/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";
import { haversine, todayLocalDate, minutesSinceTarget } from "@/server/lib/geo";
import { broadcastFeed, notify } from "@/server/notifications/dispatch";
import { audit } from "@/server/auth/audit";
import { uploadDataUrl } from "@/server/storage/r2";

const Body = z.object({
  latitude: z.number(),
  longitude: z.number(),
  method: z.enum(["face", "qr", "manual"]).default("face"),
  confidence: z.number().min(0).max(1).optional(),
  photoUrl: z.string().optional(),
  photoDataUrl: z.string().optional(), // raw base64 data URL — stored to R2/fallback
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.employeeId) return fail(400, "Bukan akun pegawai");

    const body = Body.parse(await req.json());

    // Get employee + branch + shift
    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.id, session.employeeId));
    if (!employee) return fail(404, "Pegawai tidak ditemukan");

    let branch = null as typeof schema.branches.$inferSelect | null;
    if (employee.branchId) {
      const [b] = await db
        .select()
        .from(schema.branches)
        .where(eq(schema.branches.id, employee.branchId));
      branch = b ?? null;
    }

    // GPS validation
    if (branch?.latitude && branch?.longitude) {
      const distance = haversine(
        body.latitude,
        body.longitude,
        branch.latitude,
        branch.longitude
      );
      if (distance > (branch.radiusMeters ?? 100)) {
        audit({
          companyId: employee.companyId,
          userId: session.sub,
          action: "attendance.check_in.rejected",
          details: {
            reason: "outside_geofence",
            distance: Math.round(distance),
            branchId: branch.id,
          },
          ip: req.headers.get("x-forwarded-for"),
        });
        return fail(
          400,
          `Anda berada di luar radius kantor (${Math.round(distance)}m)`,
          { distance }
        );
      }
    }

    const date = todayLocalDate();
    // Already checked in today?
    const existing = await db
      .select()
      .from(schema.attendances)
      .where(
        and(
          eq(schema.attendances.employeeId, employee.id),
          eq(schema.attendances.date, date)
        )
      );

    if (existing.length > 0 && existing[0].checkInAt) {
      return fail(400, "Anda sudah check-in hari ini");
    }

    // Determine late
    let lateMinutes = 0;
    let status: string = "present";
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

    // Upload photo to R2 if provided as data URL
    let photoUrl = body.photoUrl;
    if (body.photoDataUrl) {
      try {
        const uploaded = await uploadDataUrl({
          key: `${session.companyId}/selfie/${employee.id}/${date}-in.jpg`,
          dataUrl: body.photoDataUrl,
        });
        photoUrl = uploaded.url;
      } catch (err) {
        console.warn("[check-in] photo upload failed", err);
      }
    }

    let row;
    if (existing.length > 0) {
      [row] = await db
        .update(schema.attendances)
        .set({
          checkInAt: now,
          checkInLat: body.latitude,
          checkInLng: body.longitude,
          checkInMethod: body.method,
          checkInPhotoUrl: photoUrl,
          checkInConfidence: body.confidence,
          status,
          lateMinutes,
        })
        .where(eq(schema.attendances.id, existing[0].id))
        .returning();
    } else {
      [row] = await db
        .insert(schema.attendances)
        .values({
          employeeId: employee.id,
          companyId: employee.companyId,
          branchId: employee.branchId,
          date,
          checkInAt: now,
          checkInLat: body.latitude,
          checkInLng: body.longitude,
          checkInMethod: body.method,
          checkInPhotoUrl: photoUrl,
          checkInConfidence: body.confidence,
          status,
          lateMinutes,
        })
        .returning();
    }

    // Realtime broadcast to admins
    broadcastFeed(employee.companyId, "attendance:check-in", {
      attendance: row,
      employee: {
        id: employee.id,
        fullName: employee.fullName,
        employeeCode: employee.employeeCode,
      },
      branchId: employee.branchId,
      status,
      lateMinutes,
    });

    audit({
      companyId: employee.companyId,
      userId: session.sub,
      action: "attendance.check_in.success",
      details: { status, lateMinutes, method: body.method },
    });

    // Send WhatsApp + push if late
    if (status === "late") {
      notify({
        userId: session.sub,
        companyId: employee.companyId,
        title: `Anda terlambat ${lateMinutes} menit`,
        body: "Mohon segera laporkan ke supervisor jika ada kendala.",
        category: "attendance",
        icon: "warning",
        whatsapp: true,
      }).catch(() => {});
    }

    return ok({ attendance: row, status, lateMinutes, photoUrl });
  } catch (e) {
    return handleError(e);
  }
}
