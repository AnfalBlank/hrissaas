/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/auth/audit";
import { ok, handleError } from "@/server/api/respond";
import { calculateThr } from "@/server/payroll/calculator";
import { notify } from "@/server/notifications/dispatch";

const ADMIN_ROLES = ["super_admin", "owner", "hr"];

const Body = z.object({
  period: z.string(), // YYYY-MM
  payDate: z.string().optional(), // YYYY-MM-DD
  holiday: z.string().optional(), // YYYY-MM-DD hari raya (untuk H-7 default)
});

/**
 * Generate THR untuk semua karyawan eligible.
 * - Default `payDate` = H-7 dari hari raya jika ada di tabel holidays bulan tsb.
 *   Jika tidak ada, fallback ke tanggal 7 bulan tersebut (paling lambat 7 hari sebelum lebaran).
 * - Pakai `e.allowance` aktual jika ada, atau component `category=allowance` recurring,
 *   fallback ke baseSalary × allowanceDefaultPct.
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
    const allowanceDefaultPct = settingsRow?.allowanceDefaultPct ?? 0.27;

    // Filter active employees
    const employees = await db
      .select()
      .from(schema.employees)
      .where(
        and(
          eq(schema.employees.companyId, session.companyId),
          eq(schema.employees.status, "active")
        )
      );

    // Tentukan payDate. Prioritas: body.payDate > H-7 dari body.holiday >
    // H-7 dari hari raya religious di bulan period > tanggal 7 bulan tsb.
    let payDate: Date;
    if (body.payDate) {
      payDate = new Date(body.payDate);
    } else if (body.holiday) {
      const h = new Date(body.holiday);
      h.setDate(h.getDate() - 7);
      payDate = h;
    } else {
      // Cari hari raya religious di bulan period
      const allHolidays = await db
        .select()
        .from(schema.holidays)
        .where(eq(schema.holidays.companyId, session.companyId));
      const monthHoliday = allHolidays.find(
        (h) =>
          h.type === "religious" &&
          (h.date.startsWith(body.period) ||
            (h.recurringYearly && h.date.slice(5).startsWith(body.period.slice(5)))) // MM
      );
      if (monthHoliday) {
        const h = new Date(monthHoliday.date);
        // Jika recurring, set ke tahun period
        if (monthHoliday.recurringYearly) {
          const [yy] = body.period.split("-").map(Number);
          h.setFullYear(yy);
        }
        h.setDate(h.getDate() - 7);
        payDate = h;
      } else {
        // Fallback: tanggal 7 bulan tsb
        payDate = new Date(`${body.period}-07`);
      }
    }

    // Pre-load components (untuk allowance recurring)
    const allComponents = await db
      .select()
      .from(schema.payrollComponents)
      .where(eq(schema.payrollComponents.companyId, session.companyId));

    function getAllowanceFor(empId: string, baseSalary: number): number {
      // Cari component category=allowance recurring yang berlaku di period
      const recurring = allComponents.filter(
        (c) =>
          c.employeeId === empId &&
          c.type === "earning" &&
          c.category === "allowance" &&
          c.recurring &&
          (!c.startPeriod || c.startPeriod <= body.period) &&
          (!c.endPeriod || c.endPeriod >= body.period)
      );
      if (recurring.length > 0) return recurring.reduce((s, c) => s + c.amount, 0);
      return Math.round(baseSalary * allowanceDefaultPct);
    }

    const results: any[] = [];
    let processed = 0;
    let totalAmount = 0;

    for (const e of employees) {
      if (!e.joinDate) {
        results.push({
          employeeCode: e.employeeCode,
          fullName: e.fullName,
          eligible: false,
          reason: "joinDate kosong",
          thr: 0,
        });
        continue;
      }
      const allowance = getAllowanceFor(e.id, e.baseSalary ?? 0);
      const calc = calculateThr({
        baseSalary: e.baseSalary ?? 0,
        allowance,
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
            ? `Pro-rata ${calc.monthsOfService} bulan dari masa kerja (target bayar ${payDate.toISOString().slice(0, 10)})`
            : `Penuh 1 bulan upah (target bayar ${payDate.toISOString().slice(0, 10)})`,
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
          link: `/app/payroll?period=${body.period}`,
          whatsapp: true,
        }).catch(() => {});
      }
    }

    await audit({
      companyId: session.companyId,
      userId: session.sub,
      action: "payroll.thr.generate",
      details: {
        period: body.period,
        payDate: payDate.toISOString().slice(0, 10),
        processed,
        totalAmount,
      },
    });

    return ok({
      period: body.period,
      payDate: payDate.toISOString().slice(0, 10),
      processed,
      totalAmount,
      results,
      message: `THR ${body.period} berhasil di-generate untuk ${processed} pegawai eligible. Total Rp ${totalAmount.toLocaleString("id-ID")}.`,
    });
  } catch (e) {
    return handleError(e);
  }
}
