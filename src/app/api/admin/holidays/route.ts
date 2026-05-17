/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { ok, handleError } from "@/server/api/respond";

const ADMIN_ROLES = ["super_admin", "owner", "hr"];

export async function GET() {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const rows = await db
      .select()
      .from(schema.holidays)
      .where(eq(schema.holidays.companyId, session.companyId))
      .orderBy(desc(schema.holidays.date));
    return ok({ items: rows });
  } catch (e) {
    return handleError(e);
  }
}

const Body = z.object({
  date: z.string(),
  name: z.string(),
  type: z.enum(["national", "company", "religious"]).default("national"),
  recurringYearly: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["super_admin", "hr"]);
    const body = Body.parse(await req.json());
    const [row] = await db
      .insert(schema.holidays)
      .values({ ...body, companyId: session.companyId })
      .returning();
    return ok({ holiday: row });
  } catch (e) {
    return handleError(e);
  }
}
