/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { and, desc, eq, gte, lte, or } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { ok, handleError } from "@/server/api/respond";
import { notify } from "@/server/notifications/dispatch";
import {
  calculatePayroll,
  type ExtraComponent,
  type OvertimeEntry,
  type PayrollSettingsInput,
} from "@/server/payroll/calculator";

const ADMIN_ROLES = ["super_admin", "owner", "hr"];

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const url = new URL(req.url);
    const period =
      url.searchParams.get("period") ||
      `${new Date().getFullYear()}-${String(
        new Date().getMonth() + 1
      ).padStart(2, "0")}`;

    const rows = await db
      .select({
        id: schema.payrolls.id,
        period: schema.payrolls.period,
        baseSalary: schema.payrolls.baseSalary,
        allowance: schema.payrolls.allowance,
        overtimePay: schema.payrolls.overtimePay,
        overtimeHours: schema.payrolls.overtimeHours,
        bonus: schema.payrolls.bonus,
        thr: schema.payrolls.thr,
        attendanceDeduction: schema.payrolls.attendanceDeduction,
        lateMinutes: schema.payrolls.lateMinutes,
        bpjsKesehatan: schema.payrolls.bpjsKesehatan,
        bpjsJht: schema.payrolls.bpjsJht,
        bpjsJp: schema.payrolls.bpjsJp,
        bpjsDeduction: schema.payrolls.bpjsDeduction,
        employerBpjs: schema.payrolls.employerBpjs,
        taxDeduction: schema.payrolls.taxDeduction,
        ptkpStatus: schema.payrolls.ptkpStatus,
        netSalary: schema.payrolls.netSalary,
        status: schema.payrolls.status,
        fullName: schema.employees.fullName,
        division: schema.employees.division,
      })
      .from(schema.payrolls)
      .leftJoin(
        schema.employees,
        eq(schema.payrolls.employeeId, schema.employees.id)
      )
      .where(
        and(
          eq(schema.payrolls.companyId, session.companyId),
          eq(schema.payrolls.period, period)
        )
      )
      .orderBy(desc(schema.payrolls.netSalary));

    const totals = rows.reduce(
      (a, r) => ({
        gross:
          a.gross +
          (r.baseSalary || 0) +
          (r.allowance || 0) +
          (r.overtimePay || 0) +
          (r.bonus || 0) +
          (r.thr || 0),
        deduction:
          a.deduction +
          (r.attendanceDeduction || 0) +
          (r.taxDeduction || 0) +
          (r.bpjsDeduction || 0),
        net: a.net + (r.netSalary || 0),
        employerBpjs: a.employerBpjs + (r.employerBpjs || 0),
      }),
      { gross: 0, deduction: 0, net: 0, employerBpjs: 0 }
    );

    return ok({ period, items: rows, totals });
  } catch (e) {
    return handleError(e);
  }
}

const Generate = z.object({ period: z.string() });

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["super_admin", "hr"]);
    const { period } = Generate.parse(await req.json());

    // Load company-wide settings + holidays
    const [settingsRow] = await db
      .select()
      .from(schema.payrollSettings)
      .where(eq(schema.payrollSettings.companyId, session.companyId));
    const settings: PayrollSettingsInput = settingsRow
      ? {
          workingHoursPerMonth: settingsRow.workingHoursPerMonth ?? 173,
          allowanceDefaultPct: settingsRow.allowanceDefaultPct ?? 0.27,
          lateDeductionCapPct: settingsRow.lateDeductionCapPct ?? 0.1,
          otWeekdayFirstRate: settingsRow.otWeekdayFirstRate ?? 1.5,
          otWeekdayRate: settingsRow.otWeekdayRate ?? 2.0,
          otHolidayFirst8hRate: settingsRow.otHolidayFirst8hRate ?? 2.0,
          otHoliday9thRate: settingsRow.otHoliday9thRate ?? 3.0,
          otHoliday10thRate: settingsRow.otHoliday10thRate ?? 4.0,
          thrFullMonths: settingsRow.thrFullMonths ?? 12,
          thrMinMonths: settingsRow.thrMinMonths ?? 1,
          bpjsKesehatanEnabled: settingsRow.bpjsKesehatanEnabled ?? true,
          bpjsJhtEnabled: settingsRow.bpjsJhtEnabled ?? true,
          bpjsJpEnabled: settingsRow.bpjsJpEnabled ?? true,
          taxScheme: settingsRow.taxScheme ?? "gross",
          defaultJkkClass: settingsRow.defaultJkkClass ?? 1,
        }
      : {};

    const employees = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.companyId, session.companyId));

    const monthStart = `${period}-01`;
    const monthEnd = `${period}-31`;

    const attendances = await db
      .select()
      .from(schema.attendances)
      .where(
        and(
          eq(schema.attendances.companyId, session.companyId),
          gte(schema.attendances.date, monthStart),
          lte(schema.attendances.date, monthEnd)
        )
      );

    const approvedOvertimes = await db
      .select()
      .from(schema.overtimeRequests)
      .where(
        and(
          eq(schema.overtimeRequests.companyId, session.companyId),
          eq(schema.overtimeRequests.status, "approved"),
          gte(schema.overtimeRequests.date, monthStart),
          lte(schema.overtimeRequests.date, monthEnd)
        )
      );

    // Holidays for this month
    const holidayRows = await db
      .select()
      .from(schema.holidays)
      .where(eq(schema.holidays.companyId, session.companyId));
    const holidaySet = new Set(holidayRows.map((h) => h.date));
    const recurringHolidayMmDd = new Set(
      holidayRows
        .filter((h) => h.recurringYearly)
        .map((h) => h.date.slice(5)) // MM-DD
    );

    const isHolidayDate = (date: string) => {
      if (holidaySet.has(date)) return true;
      if (recurringHolidayMmDd.has(date.slice(5))) return true;
      // Sunday
      const d = new Date(date);
      return d.getDay() === 0;
    };

    // Per-employee components for this period
    const allComponents = await db
      .select()
      .from(schema.payrollComponents)
      .where(eq(schema.payrollComponents.companyId, session.companyId));

    function getComponentsFor(empId: string): {
      earnings: ExtraComponent[];
      deductions: ExtraComponent[];
    } {
      const earnings: ExtraComponent[] = [];
      const deductions: ExtraComponent[] = [];
      for (const c of allComponents) {
        if (c.employeeId !== empId) continue;
        // Period filter
        if (c.startPeriod && c.startPeriod > period) continue;
        if (c.endPeriod && c.endPeriod < period) continue;
        // For non-recurring, must match exact period
        if (!c.recurring && c.startPeriod && c.startPeriod !== period) continue;
        const item: ExtraComponent = {
          type: c.type as any,
          category: c.category,
          name: c.name,
          amount: c.amount,
        };
        if (c.type === "earning") earnings.push(item);
        else deductions.push(item);
      }
      return { earnings, deductions };
    }

    let created = 0;
    const notifyTargets: { userId: string; net: number }[] = [];

    for (const e of employees) {
      const empAtt = attendances.filter((a) => a.employeeId === e.id);
      const totalLateMinutes = empAtt.reduce(
        (s, a) => s + (a.lateMinutes ?? 0),
        0
      );

      // Build overtime entries — combine attendance overtime + approved requests
      const overtimeEntries: OvertimeEntry[] = [];
      // From attendance.overtimeMinutes (post check-out): treat as weekday by default
      const otFromAttMin = empAtt.reduce(
        (s, a) => s + (a.overtimeMinutes ?? 0),
        0
      );
      if (otFromAttMin > 0) {
        overtimeEntries.push({
          hours: otFromAttMin / 60,
          isHoliday: false,
        });
      }
      // From approved overtime requests — use isHoliday flag OR auto from holiday calendar
      for (const o of approvedOvertimes) {
        if (o.employeeId !== e.id) continue;
        const hol = o.isHoliday ?? isHolidayDate(o.date);
        overtimeEntries.push({ hours: o.hours || 0, isHoliday: hol });
      }

      const { earnings, deductions } = getComponentsFor(e.id);
      const thrAmount = earnings
        .filter((c) => c.category === "thr")
        .reduce((s, c) => s + c.amount, 0);
      const bonusAmount = earnings
        .filter((c) => c.category === "bonus")
        .reduce((s, c) => s + c.amount, 0);
      const otherEarnings = earnings.filter(
        (c) => c.category !== "thr" && c.category !== "bonus"
      );

      const calc = calculatePayroll({
        baseSalary: e.baseSalary ?? 0,
        ptkpStatus: e.ptkpStatus ?? "TK/0",
        jkkClass: e.jkkClass ?? settings.defaultJkkClass ?? 1,
        overtimeEntries,
        totalLateMinutes,
        hasNpwp: !!e.npwp,
        thr: thrAmount,
        bonus: bonusAmount,
        extraEarnings: otherEarnings,
        extraDeductions: deductions,
        settings,
      });

      const payrollData = {
        baseSalary: calc.baseSalary,
        allowance: calc.allowance,
        overtimePay: calc.overtimePay,
        overtimeHours: Math.round(calc.overtimeHours),
        bonus: calc.bonus,
        thr: calc.thr,
        attendanceDeduction: calc.attendanceDeduction,
        lateMinutes: totalLateMinutes,
        bpjsKesehatan: calc.bpjsKesehatan,
        bpjsJht: calc.bpjsJht,
        bpjsJp: calc.bpjsJp,
        bpjsDeduction: calc.bpjsTotal,
        employerBpjs: calc.employerBpjsTotal,
        taxDeduction: calc.taxDeduction,
        ptkpStatus: calc.ptkpStatus,
        netSalary: calc.netSalary,
        status: "draft",
      };

      const existing = await db
        .select()
        .from(schema.payrolls)
        .where(
          and(
            eq(schema.payrolls.employeeId, e.id),
            eq(schema.payrolls.period, period)
          )
        );
      if (existing.length > 0) {
        await db
          .update(schema.payrolls)
          .set(payrollData)
          .where(eq(schema.payrolls.id, existing[0].id));
      } else {
        await db.insert(schema.payrolls).values({
          ...payrollData,
          employeeId: e.id,
          companyId: session.companyId,
          period,
        });
        created++;
      }
      if (e.userId) notifyTargets.push({ userId: e.userId, net: calc.netSalary });
    }

    Promise.all(
      notifyTargets.map((t) =>
        notify({
          userId: t.userId,
          companyId: session.companyId,
          title: `Slip gaji ${period} sudah tersedia`,
          body: `Take Home Pay: Rp ${t.net.toLocaleString("id-ID")}.`,
          category: "payroll",
          icon: "payroll",
          whatsapp: true,
        }).catch(() => {})
      )
    ).catch(() => {});

    return ok({
      period,
      employeesProcessed: employees.length,
      created,
      message:
        "Payroll digenerate dengan PPh21, BPJS, lembur (weekday & holiday), THR, komponen tambahan, dan potongan telat sesuai regulasi.",
    });
  } catch (e) {
    return handleError(e);
  }
}
