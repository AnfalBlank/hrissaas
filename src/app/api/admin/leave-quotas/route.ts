/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";

const ADMIN_ROLES = ["super_admin", "owner", "hr"];

/**
 * GET — all leave quotas across employees, with filter by employee/year.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const url = new URL(req.url);
    const employeeId = url.searchParams.get("employeeId");
    const year = parseInt(
      url.searchParams.get("year") || `${new Date().getFullYear()}`,
      10
    );

    const filters = [eq(schema.leaveQuotas.year, year)];
    if (employeeId)
      filters.push(eq(schema.leaveQuotas.employeeId, employeeId));

    const rows = await db
      .select({
        id: schema.leaveQuotas.id,
        employeeId: schema.leaveQuotas.employeeId,
        type: schema.leaveQuotas.type,
        total: schema.leaveQuotas.total,
        used: schema.leaveQuotas.used,
        year: schema.leaveQuotas.year,
        fullName: schema.employees.fullName,
        employeeCode: schema.employees.employeeCode,
        companyId: schema.employees.companyId,
      })
      .from(schema.leaveQuotas)
      .innerJoin(
        schema.employees,
        eq(schema.leaveQuotas.employeeId, schema.employees.id)
      )
      .where(and(...filters));

    // Filter to current company
    const filtered = rows.filter((r) => r.companyId === session.companyId);

    // Group per employee
    const byEmployee = new Map<string, any>();
    for (const r of filtered) {
      if (!byEmployee.has(r.employeeId)) {
        byEmployee.set(r.employeeId, {
          employeeId: r.employeeId,
          fullName: r.fullName,
          employeeCode: r.employeeCode,
          quotas: {} as Record<string, any>,
        });
      }
      byEmployee.get(r.employeeId).quotas[r.type] = {
        id: r.id,
        total: r.total,
        used: r.used,
      };
    }

    return ok({
      year,
      items: Array.from(byEmployee.values()),
    });
  } catch (e) {
    return handleError(e);
  }
}

/**
 * PATCH — update kuota satu pegawai untuk satu type.
 */
const PatchBody = z.object({
  employeeId: z.string(),
  type: z.enum(["annual", "sick", "permission", "emergency"]),
  total: z.number().int().nonnegative(),
  used: z.number().int().nonnegative().optional(),
  year: z.number().int().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const body = PatchBody.parse(await req.json());
    const year = body.year ?? new Date().getFullYear();

    // Verify employee in company
    const [emp] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.id, body.employeeId));
    if (!emp || emp.companyId !== session.companyId)
      return fail(404, "Pegawai tidak ditemukan");

    // Upsert
    const [existing] = await db
      .select()
      .from(schema.leaveQuotas)
      .where(
        and(
          eq(schema.leaveQuotas.employeeId, body.employeeId),
          eq(schema.leaveQuotas.type, body.type),
          eq(schema.leaveQuotas.year, year)
        )
      );

    if (existing) {
      const [row] = await db
        .update(schema.leaveQuotas)
        .set({
          total: body.total,
          used: body.used ?? existing.used,
        })
        .where(eq(schema.leaveQuotas.id, existing.id))
        .returning();
      return ok({ quota: row, action: "updated" });
    } else {
      const [row] = await db
        .insert(schema.leaveQuotas)
        .values({
          employeeId: body.employeeId,
          type: body.type,
          total: body.total,
          used: body.used ?? 0,
          year,
        })
        .returning();
      return ok({ quota: row, action: "created" });
    }
  } catch (e) {
    return handleError(e);
  }
}

/**
 * POST — bulk reset quotas untuk semua pegawai dengan default values.
 */
const BulkBody = z.object({
  year: z.number().int(),
  defaults: z.object({
    annual: z.number().int().nonnegative(),
    sick: z.number().int().nonnegative(),
    permission: z.number().int().nonnegative(),
    emergency: z.number().int().nonnegative(),
  }),
  resetUsed: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["super_admin", "hr"]);
    const body = BulkBody.parse(await req.json());

    const employees = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.companyId, session.companyId));

    let upserts = 0;
    for (const e of employees) {
      for (const type of ["annual", "sick", "permission", "emergency"] as const) {
        const total = body.defaults[type];
        const [existing] = await db
          .select()
          .from(schema.leaveQuotas)
          .where(
            and(
              eq(schema.leaveQuotas.employeeId, e.id),
              eq(schema.leaveQuotas.type, type),
              eq(schema.leaveQuotas.year, body.year)
            )
          );

        if (existing) {
          await db
            .update(schema.leaveQuotas)
            .set({
              total,
              used: body.resetUsed ? 0 : existing.used,
            })
            .where(eq(schema.leaveQuotas.id, existing.id));
        } else {
          await db.insert(schema.leaveQuotas).values({
            employeeId: e.id,
            type,
            total,
            used: 0,
            year: body.year,
          });
        }
        upserts++;
      }
    }

    return ok({
      message: `${upserts} kuota cuti diupdate untuk ${employees.length} pegawai (tahun ${body.year}).`,
      employeesProcessed: employees.length,
    });
  } catch (e) {
    return handleError(e);
  }
}
