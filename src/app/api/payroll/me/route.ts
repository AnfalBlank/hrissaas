/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { ok, fail, handleError } from "@/server/api/respond";
import { calculatePayroll } from "@/server/payroll/calculator";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.employeeId) return fail(400, "Bukan akun pegawai");
    const url = new URL(req.url);
    const period = url.searchParams.get("period");

    const rows = await db
      .select()
      .from(schema.payrolls)
      .where(eq(schema.payrolls.employeeId, session.employeeId))
      .orderBy(desc(schema.payrolls.period));

    const current = period
      ? rows.find((r) => r.period === period) ?? null
      : rows[0] ?? null;

    if (!current) {
      // Preview berdasarkan profil pegawai (bukan slip resmi).
      const [employee] = await db
        .select()
        .from(schema.employees)
        .where(eq(schema.employees.id, session.employeeId));
      const [settings] = await db
        .select()
        .from(schema.payrollSettings)
        .where(eq(schema.payrollSettings.companyId, session.companyId));

      const calc = calculatePayroll({
        baseSalary: employee?.baseSalary ?? 0,
        ptkpStatus: employee?.ptkpStatus ?? "TK/0",
        jkkClass: employee?.jkkClass ?? 1,
        hasNpwp: !!employee?.npwp,
        overtimeEntries: [],
        totalLateMinutes: 0,
        settings: settings
          ? {
              workingHoursPerMonth: settings.workingHoursPerMonth ?? 173,
              allowanceDefaultPct: settings.allowanceDefaultPct ?? 0.27,
              taxMethod:
                (settings.taxMethod as "TER" | "ANNUAL" | undefined) ?? "TER",
            }
          : {},
      });

      const today = new Date();
      const period2 = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}`;

      return ok({
        current: {
          period: period2,
          baseSalary: calc.baseSalary,
          allowance: calc.allowance,
          overtimePay: calc.overtimePay,
          overtimeHours: calc.overtimeHours,
          bonus: calc.bonus,
          attendanceDeduction: calc.attendanceDeduction,
          bpjsKesehatan: calc.bpjsKesehatan,
          bpjsJht: calc.bpjsJht,
          bpjsJp: calc.bpjsJp,
          bpjsDeduction: calc.bpjsTotal,
          taxDeduction: calc.taxDeduction,
          ptkpStatus: calc.ptkpStatus,
          thr: 0,
          netSalary: calc.netSalary,
          status: "preview",
        },
        history: rows,
        preview: true,
      });
    }

    return ok({ current, history: rows, preview: false });
  } catch (e) {
    return handleError(e);
  }
}
