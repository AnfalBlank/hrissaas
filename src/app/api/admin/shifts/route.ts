/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { ok, handleError } from "@/server/api/respond";

const ADMIN_ROLES = ["super_admin", "hr"];

export async function GET() {
  try {
    const session = await requireRole(["super_admin", "owner", "hr", "supervisor"]);
    const rows = await db
      .select()
      .from(schema.shifts)
      .where(eq(schema.shifts.companyId, session.companyId));

    const employees = await db
      .select({ id: schema.employees.id, shiftId: schema.employees.shiftId })
      .from(schema.employees)
      .where(eq(schema.employees.companyId, session.companyId));

    const items = rows.map((s) => ({
      ...s,
      employeeCount: employees.filter((e) => e.shiftId === s.id).length,
    }));

    return ok({ items });
  } catch (e) {
    return handleError(e);
  }
}

const Body = z.object({
  name: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  graceMinutes: z.number().int().nonnegative().default(5),
  type: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const body = Body.parse(await req.json());
    const [row] = await db
      .insert(schema.shifts)
      .values({ ...body, companyId: session.companyId })
      .returning();
    return ok({ shift: row });
  } catch (e) {
    return handleError(e);
  }
}
