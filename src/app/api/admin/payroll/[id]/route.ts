/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq, gte, lte } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/auth/audit";
import { logRevision, calcDiff } from "@/server/payroll/revisions";
import { ok, fail, handleError } from "@/server/api/respond";
import { notify } from "@/server/notifications/dispatch";

const Patch = z.object({
  status: z.enum(["draft", "approved", "paid", "cancelled"]).optional(),
  paymentMethod: z.enum(["transfer", "cash", "other"]).optional(),
  paymentReference: z.string().optional(),
  paidAt: z.string().optional(), // ISO
  notes: z.string().optional(),
  bonus: z.number().int().nonnegative().optional(),
  thr: z.number().int().nonnegative().optional(),
  attendanceDeduction: z.number().int().nonnegative().optional(),
});

/**
 * GET /api/admin/payroll/[id]
 * Verifikasi detail payroll — breakdown lengkap untuk review sebelum approve.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(["super_admin", "owner", "hr"]);
    const [payroll] = await db
      .select()
      .from(schema.payrolls)
      .where(eq(schema.payrolls.id, params.id));
    if (!payroll || payroll.companyId !== session.companyId)
      return fail(404, "Payroll tidak ditemukan");

    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.id, payroll.employeeId));

    // Ambil komponen payroll yang digunakan untuk periode ini
    const components = await db
      .select()
      .from(schema.payrollComponents)
      .where(eq(schema.payrollComponents.employeeId, payroll.employeeId));
    const activeComponents = components.filter((c) => {
      if (c.startPeriod && c.startPeriod > payroll.period) return false;
      if (c.endPeriod && c.endPeriod < payroll.period) return false;
      if (!c.recurring && c.startPeriod && c.startPeriod !== payroll.period)
        return false;
      return true;
    });

    // Ambil data absensi bulan tersebut
    const [settingsRow] = await db
      .select()
      .from(schema.payrollSettings)
      .where(eq(schema.payrollSettings.companyId, session.companyId));

    const cycle = (settingsRow?.payrollCycle as string) ?? "end_of_month";
    const cutoffDay = settingsRow?.cutoffDay ?? 0;
    const [y, m] = payroll.period.split("-").map(Number);

    let attStart: string;
    let attEnd: string;
    if (cycle === "custom_cutoff" && cutoffDay > 0) {
      const prevMonth = m === 1 ? 12 : m - 1;
      const prevYear = m === 1 ? y - 1 : y;
      attStart = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(cutoffDay + 1).padStart(2, "0")}`;
      attEnd = `${y}-${String(m).padStart(2, "0")}-${String(cutoffDay).padStart(2, "0")}`;
    } else {
      attStart = `${payroll.period}-01`;
      const d = new Date(y, m, 0);
      attEnd = `${y}-${String(m).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    const attendances = await db
      .select()
      .from(schema.attendances)
      .where(
        and(
          eq(schema.attendances.employeeId, payroll.employeeId),
          gte(schema.attendances.date, attStart),
          lte(schema.attendances.date, attEnd)
        )
      );

    const attendanceSummary = {
      totalDays: attendances.length,
      present: attendances.filter((a) => a.status === "present").length,
      late: attendances.filter((a) => a.status === "late").length,
      totalLateMinutes: attendances.reduce(
        (s, a) => s + (a.lateMinutes ?? 0),
        0
      ),
      totalOvertimeMinutes: attendances.reduce(
        (s, a) => s + (a.overtimeMinutes ?? 0),
        0
      ),
      range: { from: attStart, to: attEnd },
    };

    // Breakdown
    const breakdown = {
      baseSalary: payroll.baseSalary,
      allowance: payroll.allowance,
      overtimePay: payroll.overtimePay,
      overtimeHours: payroll.overtimeHours,
      bonus: payroll.bonus,
      thr: payroll.thr,
      grossTotal:
        (payroll.baseSalary || 0) +
        (payroll.allowance || 0) +
        (payroll.overtimePay || 0) +
        (payroll.bonus || 0) +
        (payroll.thr || 0),
      bpjsKesehatan: payroll.bpjsKesehatan,
      bpjsJht: payroll.bpjsJht,
      bpjsJp: payroll.bpjsJp,
      bpjsTotal: payroll.bpjsDeduction,
      taxDeduction: payroll.taxDeduction,
      attendanceDeduction: payroll.attendanceDeduction,
      lateMinutes: payroll.lateMinutes,
      totalDeduction:
        (payroll.bpjsDeduction || 0) +
        (payroll.taxDeduction || 0) +
        (payroll.attendanceDeduction || 0),
      netSalary: payroll.netSalary,
      employerBpjs: payroll.employerBpjs,
      ptkpStatus: payroll.ptkpStatus,
    };

    return ok({
      payroll,
      employee: employee
        ? {
            id: employee.id,
            fullName: employee.fullName,
            employeeCode: employee.employeeCode,
            division: employee.division,
            position: employee.position,
            baseSalary: employee.baseSalary,
            ptkpStatus: employee.ptkpStatus,
            npwp: employee.npwp,
            jkkClass: employee.jkkClass,
            bankName: employee.bankName,
            bankAccount: employee.bankAccount,
            joinDate: employee.joinDate,
          }
        : null,
      breakdown,
      attendanceSummary,
      activeComponents,
      settings: {
        cycle,
        cutoffDay,
        payDate: settingsRow?.payDate ?? 25,
        taxMethod: settingsRow?.taxMethod ?? "TER",
      },
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(["super_admin", "hr"]);
    const body = Patch.parse(await req.json());

    const [existing] = await db
      .select()
      .from(schema.payrolls)
      .where(eq(schema.payrolls.id, params.id));
    if (!existing || existing.companyId !== session.companyId)
      return fail(404, "Payroll tidak ditemukan");

    const update: Record<string, any> = {};
    if (body.status) {
      update.status = body.status;
      if (body.status === "approved") {
        if (existing.status !== "draft")
          return fail(400, "Hanya payroll draft yang bisa di-approve");
        update.approvedById = session.sub;
        update.approvedAt = new Date();
      }
      if (body.status === "paid") {
        if (existing.status !== "approved")
          return fail(400, "Approve dulu sebelum mark sebagai paid");
        update.paidAt = body.paidAt ? new Date(body.paidAt) : new Date();
      }
    }
    if (body.paymentMethod) update.paymentMethod = body.paymentMethod;
    if (body.paymentReference) update.paymentReference = body.paymentReference;
    if (body.notes !== undefined) update.notes = body.notes;
    // Hanya draft yang bisa di-edit angkanya
    if (existing.status === "draft") {
      if (body.bonus !== undefined) update.bonus = body.bonus;
      if (body.thr !== undefined) update.thr = body.thr;
      if (body.attendanceDeduction !== undefined)
        update.attendanceDeduction = body.attendanceDeduction;
      // Recompute net jika ada perubahan
      const baseSalary = existing.baseSalary || 0;
      const allowance = existing.allowance || 0;
      const overtimePay = existing.overtimePay || 0;
      const bonus = update.bonus ?? existing.bonus ?? 0;
      const thr = update.thr ?? existing.thr ?? 0;
      const attendance =
        update.attendanceDeduction ?? existing.attendanceDeduction ?? 0;
      const tax = existing.taxDeduction ?? 0;
      const bpjs = existing.bpjsDeduction ?? 0;
      update.netSalary =
        baseSalary +
        allowance +
        overtimePay +
        bonus +
        thr -
        attendance -
        tax -
        bpjs;
    }

    const [updated] = await db
      .update(schema.payrolls)
      .set(update)
      .where(eq(schema.payrolls.id, params.id))
      .returning();

    // Log revision dengan snapshot+diff (best-effort)
    const action: "approve" | "paid" | "cancel" | "update" =
      body.status === "approved"
        ? "approve"
        : body.status === "paid"
          ? "paid"
          : body.status === "cancelled"
            ? "cancel"
            : "update";
    logRevision({
      payrollId: params.id,
      companyId: session.companyId,
      revisedById: session.sub,
      action,
      snapshot: existing,
      diff: calcDiff(existing, updated),
      notes: body.notes,
    }).catch(() => {});

    await audit({
      companyId: session.companyId,
      userId: session.sub,
      action: `payroll.${body.status ?? "update"}`,
      details: {
        payrollId: params.id,
        period: existing.period,
        prevStatus: existing.status,
        newStatus: update.status ?? existing.status,
      },
    });

    // Notify employee jika dipaid
    if (body.status === "paid" && existing.employeeId) {
      const [emp] = await db
        .select()
        .from(schema.employees)
        .where(eq(schema.employees.id, existing.employeeId));
      if (emp?.userId) {
        notify({
          userId: emp.userId,
          companyId: session.companyId,
          title: `Gaji ${existing.period} telah ditransfer`,
          body: `Take Home: Rp ${(updated.netSalary || 0).toLocaleString("id-ID")} via ${body.paymentMethod ?? "transfer"}.`,
          category: "payroll",
          icon: "payroll",
          link: `/app/payroll?period=${existing.period}`,
          whatsapp: true,
        }).catch(() => {});
      }
    }

    return ok({ payroll: updated });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(["super_admin", "hr"]);
    const [existing] = await db
      .select()
      .from(schema.payrolls)
      .where(eq(schema.payrolls.id, params.id));
    if (!existing || existing.companyId !== session.companyId)
      return fail(404, "Payroll tidak ditemukan");
    if (existing.status === "paid")
      return fail(400, "Payroll yang sudah dibayar tidak bisa dihapus");

    // Log dulu sebelum delete (FK cascade akan hapus revisions juga, jadi simpan di audit log)
    logRevision({
      payrollId: params.id,
      companyId: session.companyId,
      revisedById: session.sub,
      action: "delete",
      snapshot: existing,
      notes: "Payroll dihapus",
    }).catch(() => {});

    await db
      .delete(schema.payrolls)
      .where(eq(schema.payrolls.id, params.id));

    await audit({
      companyId: session.companyId,
      userId: session.sub,
      action: "payroll.delete",
      details: { payrollId: params.id, period: existing.period },
    });

    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
