/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { handleError } from "@/server/api/respond";
import { buildPdfTable, fmtCurrency } from "@/server/exports/pdf";
import { buildExcel } from "@/server/exports/excel";

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
    const format = (url.searchParams.get("format") || "pdf").toLowerCase();

    const rows = await db
      .select({
        id: schema.payrolls.id,
        period: schema.payrolls.period,
        baseSalary: schema.payrolls.baseSalary,
        allowance: schema.payrolls.allowance,
        overtimePay: schema.payrolls.overtimePay,
        bonus: schema.payrolls.bonus,
        attendanceDeduction: schema.payrolls.attendanceDeduction,
        taxDeduction: schema.payrolls.taxDeduction,
        bpjsDeduction: schema.payrolls.bpjsDeduction,
        netSalary: schema.payrolls.netSalary,
        status: schema.payrolls.status,
        employeeCode: schema.employees.employeeCode,
        fullName: schema.employees.fullName,
        division: schema.employees.division,
        bankName: schema.employees.bankName,
        bankAccount: schema.employees.bankAccount,
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
        baseSalary: (a.baseSalary || 0) + (r.baseSalary || 0),
        allowance: (a.allowance || 0) + (r.allowance || 0),
        overtimePay: (a.overtimePay || 0) + (r.overtimePay || 0),
        bonus: (a.bonus || 0) + (r.bonus || 0),
        deductions:
          (a.deductions || 0) +
          (r.attendanceDeduction || 0) +
          (r.taxDeduction || 0) +
          (r.bpjsDeduction || 0),
        netSalary: (a.netSalary || 0) + (r.netSalary || 0),
      }),
      {} as Record<string, number>
    );

    const flatRows = rows.map((r) => ({
      ...r,
      totalDeduction:
        (r.attendanceDeduction || 0) +
        (r.taxDeduction || 0) +
        (r.bpjsDeduction || 0),
      bankInfo: r.bankName ? `${r.bankName} ${r.bankAccount ?? ""}` : "-",
    }));

    const filename = `payroll-${period}`;

    if (format === "xlsx" || format === "excel") {
      const buf = await buildExcel({
        sheet: `Payroll ${period}`,
        title: `Laporan Payroll ${period}`,
        subtitle: `Total ${rows.length} pegawai · Take Home: Rp ${(totals.netSalary || 0).toLocaleString("id-ID")}`,
        columns: [
          { header: "Kode", key: "employeeCode", width: 14 },
          { header: "Nama", key: "fullName", width: 28 },
          { header: "Divisi", key: "division", width: 16 },
          { header: "Bank", key: "bankInfo", width: 22 },
          { header: "Gaji Pokok", key: "baseSalary", width: 16, format: "currency" },
          { header: "Tunjangan", key: "allowance", width: 16, format: "currency" },
          { header: "Lembur", key: "overtimePay", width: 16, format: "currency" },
          { header: "Bonus", key: "bonus", width: 14, format: "currency" },
          { header: "Pot. Absensi", key: "attendanceDeduction", width: 16, format: "currency" },
          { header: "Pajak", key: "taxDeduction", width: 14, format: "currency" },
          { header: "BPJS", key: "bpjsDeduction", width: 14, format: "currency" },
          { header: "Take Home", key: "netSalary", width: 18, format: "currency" },
          { header: "Status", key: "status", width: 12 },
        ],
        rows: flatRows,
        totals: {
          baseSalary: totals.baseSalary,
          allowance: totals.allowance,
          overtimePay: totals.overtimePay,
          bonus: totals.bonus,
          netSalary: totals.netSalary,
        },
      });
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      });
    }

    // PDF
    const buf = await buildPdfTable({
      title: "Laporan Payroll",
      subtitle: `Periode ${period}`,
      meta: {
        Pegawai: String(rows.length),
        "Take Home": fmtCurrency(totals.netSalary || 0),
        Potongan: fmtCurrency(totals.deductions || 0),
      },
      columns: [
        { header: "Nama", key: "fullName", width: 130 },
        { header: "Divisi", key: "division", width: 70 },
        {
          header: "Pokok",
          key: "baseSalary",
          width: 80,
          align: "right",
          format: fmtCurrency,
        },
        {
          header: "Lembur",
          key: "overtimePay",
          width: 70,
          align: "right",
          format: fmtCurrency,
        },
        {
          header: "Potongan",
          key: "totalDeduction",
          width: 80,
          align: "right",
          format: fmtCurrency,
        },
        {
          header: "Take Home",
          key: "netSalary",
          width: 85,
          align: "right",
          format: fmtCurrency,
        },
      ],
      rows: flatRows,
      totals: {
        baseSalary: totals.baseSalary,
        overtimePay: totals.overtimePay,
        totalDeduction: totals.deductions,
        netSalary: totals.netSalary,
      },
    });

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
