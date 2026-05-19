/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/auth/audit";
import { ok, handleError } from "@/server/api/respond";

const ADMIN_ROLES = ["super_admin", "owner", "hr"];

export async function GET() {
  try {
    const session = await requireRole(ADMIN_ROLES);
    let [row] = await db
      .select()
      .from(schema.payrollSettings)
      .where(eq(schema.payrollSettings.companyId, session.companyId));

    if (!row) {
      [row] = await db
        .insert(schema.payrollSettings)
        .values({ companyId: session.companyId })
        .returning();
    }
    return ok({ settings: row });
  } catch (e) {
    return handleError(e);
  }
}

const Patch = z.object({
  allowanceDefaultPct: z.number().min(0).max(2).optional(),
  workingHoursPerMonth: z.number().int().positive().optional(),
  lateDeductionCapPct: z.number().min(0).max(1).optional(),
  lateDeductionBase: z.enum(["baseSalary", "monthlyGross"]).optional(),
  otWeekdayFirstRate: z.number().positive().optional(),
  otWeekdayRate: z.number().positive().optional(),
  otHolidayFirst8hRate: z.number().positive().optional(),
  otHoliday9thRate: z.number().positive().optional(),
  otHoliday10thRate: z.number().positive().optional(),
  workDaysPerWeek: z.union([z.literal(5), z.literal(6)]).optional(),
  thrFullMonths: z.number().int().min(1).optional(),
  thrMinMonths: z.number().int().min(0).optional(),
  bpjsKesehatanEnabled: z.boolean().optional(),
  bpjsJhtEnabled: z.boolean().optional(),
  bpjsJpEnabled: z.boolean().optional(),
  taxScheme: z.enum(["gross", "gross-up", "net"]).optional(),
  taxMethod: z.enum(["TER", "ANNUAL"]).optional(),
  defaultJkkClass: z.number().int().min(1).max(5).optional(),
  companyNpwp: z.string().optional(),
  companyTaxAddress: z.string().optional(),
  // Pola gajian
  payrollCycle: z
    .enum(["end_of_month", "start_of_next_month", "custom_cutoff"])
    .optional(),
  cutoffDay: z.number().int().min(0).max(28).optional(),
  payDate: z.number().int().min(1).max(31).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireRole(["super_admin", "hr"]);
    const body = Patch.parse(await req.json());

    let [existing] = await db
      .select()
      .from(schema.payrollSettings)
      .where(eq(schema.payrollSettings.companyId, session.companyId));
    if (!existing) {
      [existing] = await db
        .insert(schema.payrollSettings)
        .values({ companyId: session.companyId, ...body })
        .returning();
    } else {
      [existing] = await db
        .update(schema.payrollSettings)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(schema.payrollSettings.companyId, session.companyId))
        .returning();
    }
    await audit({
      companyId: session.companyId,
      userId: session.sub,
      action: "payroll.settings.update",
      details: { changedKeys: Object.keys(body) },
    });
    return ok({ settings: existing });
  } catch (e) {
    return handleError(e);
  }
}
