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
    const session = await requireRole(["super_admin", "owner", "hr"]);
    const rows = await db
      .select()
      .from(schema.branches)
      .where(eq(schema.branches.companyId, session.companyId));

    const employees = await db
      .select({ id: schema.employees.id, branchId: schema.employees.branchId })
      .from(schema.employees)
      .where(eq(schema.employees.companyId, session.companyId));

    const items = rows.map((b) => ({
      ...b,
      employeeCount: employees.filter((e) => e.branchId === b.id).length,
    }));

    return ok({ items });
  } catch (e) {
    return handleError(e);
  }
}

const Body = z.object({
  name: z.string(),
  city: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  radiusMeters: z.number().int().positive().default(100),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const body = Body.parse(await req.json());
    const [row] = await db
      .insert(schema.branches)
      .values({ ...body, companyId: session.companyId })
      .returning();
    return ok({ branch: row });
  } catch (e) {
    return handleError(e);
  }
}
