/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
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
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
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
    const hours = diffHours(body.startTime, body.endTime);

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
