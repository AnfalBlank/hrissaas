/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { and, desc, eq, like, or } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { ok, handleError } from "@/server/api/respond";
import { hashPassword } from "@/server/auth/password";

const ADMIN_ROLES = ["super_admin", "owner", "hr"];

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const url = new URL(req.url);
    const q = url.searchParams.get("q");

    const filters = [eq(schema.employees.companyId, session.companyId)];
    if (q) {
      filters.push(
        or(
          like(schema.employees.fullName, `%${q}%`),
          like(schema.employees.employeeCode, `%${q}%`),
          like(schema.employees.position, `%${q}%`)
        )!
      );
    }

    const rows = await db
      .select({
        id: schema.employees.id,
        employeeCode: schema.employees.employeeCode,
        fullName: schema.employees.fullName,
        position: schema.employees.position,
        division: schema.employees.division,
        status: schema.employees.status,
        avatarUrl: schema.employees.avatarUrl,
        branchName: schema.branches.name,
        userEmail: schema.users.email,
        userRole: schema.users.role,
      })
      .from(schema.employees)
      .leftJoin(
        schema.branches,
        eq(schema.employees.branchId, schema.branches.id)
      )
      .leftJoin(schema.users, eq(schema.employees.userId, schema.users.id))
      .where(and(...filters))
      .orderBy(desc(schema.employees.createdAt))
      .limit(100);

    return ok({ items: rows });
  } catch (e) {
    return handleError(e);
  }
}

const CreateBody = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string(),
  employeeCode: z.string(),
  role: z.enum(["employee", "supervisor", "hr", "owner"]).default("employee"),
  division: z.string().optional(),
  position: z.string().optional(),
  branchId: z.string().optional(),
  shiftId: z.string().optional(),
  baseSalary: z.number().int().nonnegative().default(0),
  ptkpStatus: z
    .enum(["TK/0", "TK/1", "TK/2", "TK/3", "K/0", "K/1", "K/2", "K/3"])
    .default("TK/0"),
  npwp: z.string().optional(),
  maritalStatus: z
    .enum(["single", "married", "widowed", "divorced"])
    .optional(),
  jkkClass: z.number().int().min(1).max(5).default(1),
  joinDate: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["super_admin", "hr"]);
    const body = CreateBody.parse(await req.json());

    const [user] = await db
      .insert(schema.users)
      .values({
        companyId: session.companyId,
        email: body.email,
        passwordHash: await hashPassword(body.password),
        role: body.role,
      })
      .returning();

    const [employee] = await db
      .insert(schema.employees)
      .values({
        userId: user.id,
        companyId: session.companyId,
        branchId: body.branchId,
        shiftId: body.shiftId,
        employeeCode: body.employeeCode,
        fullName: body.fullName,
        division: body.division,
        position: body.position,
        baseSalary: body.baseSalary,
        ptkpStatus: body.ptkpStatus,
        npwp: body.npwp,
        maritalStatus: body.maritalStatus,
        jkkClass: body.jkkClass,
        joinDate: body.joinDate ? new Date(body.joinDate) : new Date(),
        phone: body.phone,
      })
      .returning();

    return ok({ user, employee });
  } catch (e) {
    return handleError(e);
  }
}
