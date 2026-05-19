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
import { uploadDataUrl } from "@/server/storage/r2";

const Body = z.object({
  latitude: z.number(),
  longitude: z.number(),
  method: z.enum(["face", "qr", "manual"]).default("face"),
  photoUrl: z.string().optional(),
  photoDataUrl: z.string().optional(),
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
          return fail(
            400,
            `Anda berada ${Math.round(distance)}m dari kantor "${branch.name}" (radius ${branch.radiusMeters ?? 100}m).`
          );
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
        const diff = minutesSinceTarget(shift.endTime);
        if (diff > 30) overtimeMinutes = diff;
      }
    }

    // Upload selfie check-out
    let photoUrl = body.photoUrl;
    if (body.photoDataUrl) {
      try {
        const uploaded = await uploadDataUrl({
          key: `${session.companyId}/selfie/${employee.id}/${date}-out.jpg`,
          dataUrl: body.photoDataUrl,
        });
        photoUrl = uploaded.url;
      } catch (err) {
        console.warn("[check-out] photo upload failed", err);
      }
    }

    const checkOutTime = new Date();
    const [row] = await db
      .update(schema.attendances)
      .set({
        checkOutAt: checkOutTime,
        checkOutLat: body.latitude,
        checkOutLng: body.longitude,
        checkOutMethod: body.method,
        checkOutPhotoUrl: photoUrl,
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

    // Hitung total jam kerja hari ini
    if (existing.checkInAt) {
      const ms = checkOutTime.getTime() - existing.checkInAt.getTime();
      const totalMinutes = Math.round(ms / 60_000);
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      const summary = `${hours}j ${mins}m${overtimeMinutes > 0 ? ` (lembur ${Math.round(overtimeMinutes / 60 * 10) / 10}j)` : ""}`;

      notify({
        userId: session.sub,
        companyId: employee.companyId,
        title: "Check-out berhasil",
        body: `Total jam kerja hari ini: ${summary}. Selamat istirahat!`,
        category: "attendance",
        icon: "check",
        link: "/app/history",
      }).catch(() => {});
    }

    return ok({ attendance: row, overtimeMinutes, photoUrl });
  } catch (e) {
    return handleError(e);
  }
}
