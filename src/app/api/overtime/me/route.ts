/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { and, desc, eq, ne } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";
import { broadcastFeed } from "@/server/notifications/dispatch";

export async function GET() {
  try {
    const session = await requireSession();
    if (!session.employeeId) return fail(400, "Bukan akun pegawai");
    const rows = await db
      .select()
      .from(schema.overtimeRequests)
      .where(eq(schema.overtimeRequests.employeeId, session.employeeId))
      .orderBy(desc(schema.overtimeRequests.createdAt))
      .limit(50);
    return ok({ items: rows });
  } catch (e) {
    return handleError(e);
  }
}

const Body = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:mm"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:mm"),
  description: z.string().optional(),
  isHoliday: z.boolean().optional(),
});

function diffHours(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60; // overnight
  return Math.round(diff / 60);
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.employeeId) return fail(400, "Bukan akun pegawai");
    const body = Body.parse(await req.json());

    // Validasi tanggal
    const date = new Date(body.date);
    if (isNaN(date.getTime())) return fail(400, "Format tanggal tidak valid");

    // Tidak boleh apply OT untuk tanggal lebih dari 14 hari ke belakang atau ke depan
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round(
      (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < -14 || diffDays > 30) {
      return fail(
        400,
        "Tanggal lembur harus dalam rentang 14 hari ke belakang sampai 30 hari ke depan."
      );
    }

    const hours = diffHours(body.startTime, body.endTime);
    if (hours < 1) return fail(400, "Durasi lembur minimal 1 jam");
    if (hours > 14)
      return fail(400, "Durasi lembur maksimal 14 jam dalam satu pengajuan");

    // Cek overlap: tidak boleh ada OT pending/approved di tanggal yang sama
    const existing = await db
      .select()
      .from(schema.overtimeRequests)
      .where(
        and(
          eq(schema.overtimeRequests.employeeId, session.employeeId),
          eq(schema.overtimeRequests.date, body.date),
          ne(schema.overtimeRequests.status, "rejected")
        )
      );
    if (existing.length > 0) {
      return fail(
        400,
        `Sudah ada pengajuan lembur di tanggal ${body.date} (status: ${existing[0].status}, ${existing[0].startTime}-${existing[0].endTime}).`
      );
    }

    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.id, session.employeeId));

    const [row] = await db
      .insert(schema.overtimeRequests)
      .values({
        employeeId: session.employeeId,
        companyId: session.companyId,
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        hours,
        description: body.description,
        isHoliday: body.isHoliday ?? false,
        status: "pending",
      })
      .returning();

    broadcastFeed(session.companyId, "overtime:applied", {
      overtime: row,
      employee: employee
        ? {
            id: employee.id,
            fullName: employee.fullName,
            employeeCode: employee.employeeCode,
          }
        : null,
    });

    return ok({ overtime: row });
  } catch (e) {
    return handleError(e);
  }
}
