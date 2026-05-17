/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { ok, handleError } from "@/server/api/respond";
import { calculateThr } from "@/server/payroll/calculator";
import { notify } from "@/server/notifications/dispatch";

const ADMIN_ROLES = ["super_admin", "owner", "hr"];

const Body = z.object({
  period: z.string(), // YYYY-MM
  payDate: z.string().optional(), // YYYY-MM-DD, default = period-15
});

/**
 * Generate THR untuk semua karyawan eligible dan tambahkan ke payroll bulan tsb
 * sebagai komponen earning recurring=false (one-off untuk period itu).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["super_admin", "hr"]);
    const body = Body.parse(await req.json());

    const [settingsRow] = await db
      .select()
      .from(schema.payrollSettings)
      .where(eq(schema.payrollSettings.companyId, session.companyId));

    const settingsForCalc = settingsRow
      ? {
          thrFullMonths: settingsRow.thrFullMonths ?? 12,
          thrMinMonths: settingsRow.thrMinMonths ?? 1,
        }
      : {};

    const employees = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.companyId, session.companyId));

    const payDate = body.payDate
      ? new Date(body.payDate)
      : new Date(`${body.period}-15`);

    const results: any[] = [];
    let processed = 0;
    let totalAmount = 0;

    for (const e of employees) {
      if (!e.joinDate) continue;
      const calc = calculateThr({
        baseSalary: e.baseSalary ?? 0,
        allowance: Math.round(
          (e.baseSalary ?? 0) * (settingsRow?.allowanceDefaultPct ?? 0.27)
        ),
        joinDate: new Date(e.joinDate),
        payPeriod: payDate,
        settings: settingsForCalc,
      });

      if (!calc.eligible || calc.thr === 0) {
        results.push({
          employeeCode: e.employeeCode,
          fullName: e.fullName,
          eligible: false,
          monthsOfService: calc.monthsOfService,
          thr: 0,
        });
        continue;
      }

      // Upsert as payroll component
      const existing = await db
        .select()
        .from(schema.payrollComponents)
        .where(
          and(
            eq(schema.payrollComponents.employeeId, e.id),
            eq(schema.payrollComponents.category, "thr"),
            eq(schema.payrollComponents.startPeriod, body.period),
            eq(schema.payrollComponents.endPeriod, body.period)
          )
        );

      if (existing.length > 0) {
        await db
          .update(schema.payrollComponents)
          .set({ amount: calc.thr })
          .where(eq(schema.payrollComponents.id, existing[0].id));
      } else {
        await db.insert(schema.payrollComponents).values({
          employeeId: e.id,
          companyId: session.companyId,
          type: "earning",
          category: "thr",
          name: `THR ${body.period}`,
          amount: calc.thr,
          recurring: false,
          startPeriod: body.period,
          endPeriod: body.period,
          notes: calc.prorata
            ? `Pro-rata ${calc.monthsOfService} bulan dari masa kerja`
            : `Penuh 1 bulan upah`,
        });
      }

      processed++;
      totalAmount += calc.thr;
      results.push({
        employeeCode: e.employeeCode,
        fullName: e.fullName,
        eligible: true,
        monthsOfService: calc.monthsOfService,
        thr: calc.thr,
        prorata: calc.prorata,
      });

      if (e.userId) {
        notify({
          userId: e.userId,
          companyId: session.companyId,
          title: `THR ${body.period} sudah ditetapkan 🎉`,
          body: `Anda akan menerima THR sebesar Rp ${calc.thr.toLocaleString(
            "id-ID"
          )}${calc.prorata ? ` (pro-rata ${calc.monthsOfService} bulan)` : ""}.`,
          category: "payroll",
          icon: "party",
          whatsapp: true,
        }).catch(() => {});
      }
    }

    return ok({
      period: body.period,
      processed,
      totalAmount,
      results,
      message: `THR ${body.period} berhasil di-generate untuk ${processed} pegawai eligible. Total Rp ${totalAmount.toLocaleString("id-ID")}.`,
    });
  } catch (e) {
    return handleError(e);
  }
}
