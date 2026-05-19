/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/auth/audit";
import { ok, handleError } from "@/server/api/respond";

const ADMIN_ROLES = ["super_admin", "owner", "hr"];

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const url = new URL(req.url);
    const employeeId = url.searchParams.get("employeeId");

    const filters = [eq(schema.payrollComponents.companyId, session.companyId)];
    if (employeeId)
      filters.push(eq(schema.payrollComponents.employeeId, employeeId));

    const rows = await db
      .select({
        id: schema.payrollComponents.id,
        employeeId: schema.payrollComponents.employeeId,
        type: schema.payrollComponents.type,
        category: schema.payrollComponents.category,
        name: schema.payrollComponents.name,
        amount: schema.payrollComponents.amount,
        recurring: schema.payrollComponents.recurring,
        startPeriod: schema.payrollComponents.startPeriod,
        endPeriod: schema.payrollComponents.endPeriod,
        notes: schema.payrollComponents.notes,
        createdAt: schema.payrollComponents.createdAt,
        employeeName: schema.employees.fullName,
        employeeCode: schema.employees.employeeCode,
      })
      .from(schema.payrollComponents)
      .leftJoin(
        schema.employees,
        eq(schema.payrollComponents.employeeId, schema.employees.id)
      )
      .where(and(...filters))
      .orderBy(desc(schema.payrollComponents.createdAt));
    return ok({ items: rows });
  } catch (e) {
    return handleError(e);
  }
}

const Body = z.object({
  employeeId: z.string(),
  type: z.enum(["earning", "deduction"]),
  category: z.string(),
  name: z.string(),
  amount: z.number().int(),
  recurring: z.boolean().default(false),
  startPeriod: z.string().optional(),
  endPeriod: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["super_admin", "hr"]);
    const body = Body.parse(await req.json());
    const [row] = await db
      .insert(schema.payrollComponents)
      .values({ ...body, companyId: session.companyId })
      .returning();
    await audit({
      companyId: session.companyId,
      userId: session.sub,
      action: "payroll.component.create",
      details: {
        componentId: row.id,
        employeeId: body.employeeId,
        type: body.type,
        category: body.category,
        amount: body.amount,
      },
    });
    return ok({ component: row });
  } catch (e) {
    return handleError(e);
  }
}
