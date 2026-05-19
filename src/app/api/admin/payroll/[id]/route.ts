/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/auth/audit";
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
