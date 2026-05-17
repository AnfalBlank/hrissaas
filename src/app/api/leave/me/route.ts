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

    const [quotas, list] = await Promise.all([
      db
        .select()
        .from(schema.leaveQuotas)
        .where(eq(schema.leaveQuotas.employeeId, session.employeeId)),
      db
        .select()
        .from(schema.leaves)
        .where(eq(schema.leaves.employeeId, session.employeeId))
        .orderBy(desc(schema.leaves.createdAt))
        .limit(50),
    ]);

    return ok({ quotas, leaves: list });
  } catch (e) {
    return handleError(e);
  }
}

const Body = z.object({
  type: z.enum(["annual", "sick", "permission", "emergency"]),
  fromDate: z.string(),
  toDate: z.string(),
  reason: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.employeeId) return fail(400, "Bukan akun pegawai");
    const body = Body.parse(await req.json());

    const start = new Date(body.fromDate);
    const end = new Date(body.toDate);
    const days = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    const [row] = await db
      .insert(schema.leaves)
      .values({
        employeeId: session.employeeId,
        companyId: session.companyId,
        type: body.type,
        fromDate: body.fromDate,
        toDate: body.toDate,
        days,
        reason: body.reason,
        attachmentUrl: body.attachmentUrl,
        status: "pending",
      })
      .returning();

    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.id, session.employeeId));

    broadcastFeed(session.companyId, "leave:applied", {
      leave: row,
      employee: employee
        ? {
            id: employee.id,
            fullName: employee.fullName,
            employeeCode: employee.employeeCode,
          }
        : null,
    });

    return ok({ leave: row });
  } catch (e) {
    return handleError(e);
  }
}
