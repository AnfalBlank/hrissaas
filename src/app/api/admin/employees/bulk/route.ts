/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/auth/audit";
import { ok, fail, handleError } from "@/server/api/respond";
import { hashPassword } from "@/server/auth/password";

const RowSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).default("demo1234"),
  fullName: z.string().min(1),
  employeeCode: z.string().min(1),
  role: z
    .enum(["employee", "supervisor", "hr", "owner"])
    .default("employee"),
  division: z.string().optional(),
  position: z.string().optional(),
  branchId: z.string().optional(),
  shiftId: z.string().optional(),
  baseSalary: z.number().int().nonnegative().default(0),
  ptkpStatus: z
    .enum(["TK/0", "TK/1", "TK/2", "TK/3", "K/0", "K/1", "K/2", "K/3"])
    .default("TK/0"),
  npwp: z.string().optional(),
  jkkClass: z.number().int().min(1).max(5).default(1),
  joinDate: z.string().optional(),
  phone: z.string().optional(),
});

const Body = z.object({
  rows: z.array(z.record(z.string(), z.any())).min(1).max(500),
  defaultPassword: z.string().min(6).default("demo1234"),
  // Format: "csv" (default, rows sudah parsed di client) atau "xlsx" (rows dari client xlsx parser)
  format: z.enum(["csv", "xlsx"]).default("csv"),
});

/**
 * Bulk import pegawai dari array (hasil parse CSV/Excel di client).
 * Per row di-validate dengan RowSchema. Skip baris yang gagal, lanjut yang valid.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["super_admin", "hr"]);
    const body = Body.parse(await req.json());

    const created: any[] = [];
    const errors: { row: number; error: string; data: any }[] = [];

    for (let i = 0; i < body.rows.length; i++) {
      const raw = body.rows[i];
      try {
        // Coerce field numerik
        const coerced = {
          ...raw,
          baseSalary:
            raw.baseSalary !== undefined && raw.baseSalary !== ""
              ? Number(raw.baseSalary)
              : 0,
          jkkClass:
            raw.jkkClass !== undefined && raw.jkkClass !== ""
              ? Number(raw.jkkClass)
              : 1,
          password: raw.password || body.defaultPassword,
        };
        const data = RowSchema.parse(coerced);

        // Cek email/code unique
        const [existingUser] = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, data.email));
        if (existingUser) {
          errors.push({
            row: i + 1,
            error: `Email ${data.email} sudah terdaftar`,
            data: raw,
          });
          continue;
        }
        const [existingCode] = await db
          .select()
          .from(schema.employees)
          .where(eq(schema.employees.employeeCode, data.employeeCode));
        if (existingCode) {
          errors.push({
            row: i + 1,
            error: `Kode pegawai ${data.employeeCode} sudah terpakai`,
            data: raw,
          });
          continue;
        }

        const [user] = await db
          .insert(schema.users)
          .values({
            companyId: session.companyId,
            email: data.email,
            passwordHash: await hashPassword(data.password),
            role: data.role,
          })
          .returning();

        const [employee] = await db
          .insert(schema.employees)
          .values({
            userId: user.id,
            companyId: session.companyId,
            branchId: data.branchId || null,
            shiftId: data.shiftId || null,
            employeeCode: data.employeeCode,
            fullName: data.fullName,
            division: data.division,
            position: data.position,
            phone: data.phone,
            baseSalary: data.baseSalary,
            ptkpStatus: data.ptkpStatus,
            npwp: data.npwp,
            jkkClass: data.jkkClass,
            joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
          })
          .returning();

        created.push({
          row: i + 1,
          employeeCode: employee.employeeCode,
          fullName: employee.fullName,
          email: user.email,
        });
      } catch (e: any) {
        errors.push({
          row: i + 1,
          error: e?.message ?? String(e),
          data: raw,
        });
      }
    }

    audit({
      companyId: session.companyId,
      userId: session.sub,
      action: "employee.bulkImport",
      details: {
        attempted: body.rows.length,
        created: created.length,
        failed: errors.length,
      },
    });

    return ok({
      attempted: body.rows.length,
      createdCount: created.length,
      failedCount: errors.length,
      created,
      errors,
      message: `${created.length} pegawai berhasil ditambah, ${errors.length} gagal.`,
    });
  } catch (e) {
    return handleError(e);
  }
}
