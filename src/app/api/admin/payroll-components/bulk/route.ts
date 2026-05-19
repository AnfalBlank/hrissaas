/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/auth/audit";
import { ok, handleError } from "@/server/api/respond";

const Body = z.object({
  // Filter siapa target. Default: semua active employees.
  scope: z.enum(["all-active", "selected", "by-division"]).default("all-active"),
  employeeIds: z.array(z.string()).optional(),
  division: z.string().optional(),
  // Komponen
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

    // Resolve target employees
    let targets: string[] = [];
    if (body.scope === "selected" && body.employeeIds?.length) {
      const rows = await db
        .select()
        .from(schema.employees)
        .where(
          and(
            eq(schema.employees.companyId, session.companyId),
            inArray(schema.employees.id, body.employeeIds)
          )
        );
      targets = rows.map((r) => r.id);
    } else if (body.scope === "by-division" && body.division) {
      const rows = await db
        .select()
        .from(schema.employees)
        .where(
          and(
            eq(schema.employees.companyId, session.companyId),
            eq(schema.employees.division, body.division),
            eq(schema.employees.status, "active")
          )
        );
      targets = rows.map((r) => r.id);
    } else {
      const rows = await db
        .select()
        .from(schema.employees)
        .where(
          and(
            eq(schema.employees.companyId, session.companyId),
            eq(schema.employees.status, "active")
          )
        );
      targets = rows.map((r) => r.id);
    }

    if (targets.length === 0) return ok({ created: 0, message: "Tidak ada target." });

    const values = targets.map((employeeId) => ({
      employeeId,
      companyId: session.companyId,
      type: body.type,
      category: body.category,
      name: body.name,
      amount: body.amount,
      recurring: body.recurring,
      startPeriod: body.startPeriod,
      endPeriod: body.endPeriod,
      notes: body.notes,
    }));
    await db.insert(schema.payrollComponents).values(values);

    await audit({
      companyId: session.companyId,
      userId: session.sub,
      action: "payroll.component.bulkCreate",
      details: {
        scope: body.scope,
        targets: targets.length,
        type: body.type,
        category: body.category,
        amount: body.amount,
      },
    });

    return ok({
      created: targets.length,
      message: `Komponen ditambahkan ke ${targets.length} pegawai.`,
    });
  } catch (e) {
    return handleError(e);
  }
}
