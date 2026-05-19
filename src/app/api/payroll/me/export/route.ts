/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { fail, handleError } from "@/server/api/respond";
import PDFDocument from "pdfkit";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.employeeId) return fail(400, "Bukan akun pegawai");
    const url = new URL(req.url);
    const period = url.searchParams.get("period");

    let payroll: any = null;
    if (period) {
      const rows = await db
        .select()
        .from(schema.payrolls)
        .where(
          and(
            eq(schema.payrolls.employeeId, session.employeeId),
            eq(schema.payrolls.period, period)
          )
        );
      payroll = rows[0] ?? null;
    } else {
      const rows = await db
        .select()
        .from(schema.payrolls)
        .where(eq(schema.payrolls.employeeId, session.employeeId))
        .orderBy(desc(schema.payrolls.period))
        .limit(1);
      payroll = rows[0] ?? null;
    }

    if (!payroll) {
      return fail(
        404,
        period
          ? `Slip gaji ${period} belum digenerate.`
          : "Belum ada slip gaji yang digenerate."
      );
    }

    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.id, session.employeeId));
    const [company] = await db
      .select()
      .from(schema.companies)
      .where(eq(schema.companies.id, session.companyId));
    const [settings] = await db
      .select()
      .from(schema.payrollSettings)
      .where(eq(schema.payrollSettings.companyId, session.companyId));

    const buf = await renderPayslip({
      company: company?.name ?? "Perusahaan",
      companyNpwp: settings?.companyNpwp ?? null,
      companyAddress: settings?.companyTaxAddress ?? null,
      employee,
      payroll,
    });

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="slip-gaji-${employee?.employeeCode ?? "emp"}-${payroll.period}.pdf"`,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}

function renderPayslip(opts: {
  company: string;
  companyNpwp: string | null;
  companyAddress: string | null;
  employee: any;
  payroll: any;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 40, left: 50, right: 50 },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const fmt = (n: number) => `Rp ${(n ?? 0).toLocaleString("id-ID")}`;

    // Header band
    doc.rect(0, 0, doc.page.width, 110).fill("#3A5CFF");
    doc
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(20)
      .text(opts.company, 50, 28);
    if (opts.companyNpwp) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#DAE6FF")
        .text(`NPWP: ${opts.companyNpwp}`, 50, 52);
    }
    if (opts.companyAddress) {
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#DAE6FF")
        .text(opts.companyAddress, 50, opts.companyNpwp ? 64 : 52, {
          width: doc.page.width - 240,
        });
    }
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("white")
      .text("SLIP GAJI KARYAWAN", 50, 86);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#DAE6FF")
      .text(`Periode ${opts.payroll.period}`, doc.page.width - 200, 30, {
        width: 150,
        align: "right",
      });
    if (opts.payroll.status) {
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(
          opts.payroll.status.toUpperCase(),
          doc.page.width - 200,
          48,
          { width: 150, align: "right" }
        );
    }

    doc.fillColor("#0F121B").y = 130;

    // Employee info box
    const boxTop = doc.y;
    doc.roundedRect(50, boxTop, doc.page.width - 100, 90, 12).fill("#F7F7FB");
    doc.fillColor("#1B1F2C");
    const left = 65;
    const right = doc.page.width / 2 + 10;
    const colKv = (x: number, y: number, label: string, value: string) => {
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#8A93AD")
        .text(label.toUpperCase(), x, y);
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#1B1F2C")
        .text(value, x, y + 11);
    };
    colKv(left, boxTop + 12, "Nama", opts.employee?.fullName ?? "-");
    colKv(left, boxTop + 50, "Kode Pegawai", opts.employee?.employeeCode ?? "-");
    colKv(right, boxTop + 12, "Divisi", opts.employee?.division ?? "-");
    colKv(
      right,
      boxTop + 50,
      "PTKP / NPWP",
      `${opts.payroll.ptkpStatus ?? "-"}${opts.employee?.npwp ? " · NPWP" : " · non-NPWP"}`
    );

    doc.y = boxTop + 110;

    // Two columns: Earnings | Deductions
    const colTop = doc.y;
    const colW = (doc.page.width - 100 - 20) / 2;
    const earnX = 50;
    const dedX = 50 + colW + 20;

    doc
      .rect(earnX, colTop, colW, 26)
      .fill("#22C55E")
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("PENDAPATAN", earnX + 12, colTop + 8);

    const earnings: [string, number][] = [
      ["Gaji Pokok", opts.payroll.baseSalary || 0],
      ["Tunjangan", opts.payroll.allowance || 0],
      [
        `Lembur${opts.payroll.overtimeHours ? ` (${opts.payroll.overtimeHours}j)` : ""}`,
        opts.payroll.overtimePay || 0,
      ],
      ["Bonus", opts.payroll.bonus || 0],
      ["THR", opts.payroll.thr || 0],
    ].filter(([, v]) => v > 0) as [string, number][];

    let ey = colTop + 30;
    let totalEarn = 0;
    for (const [k, v] of earnings) {
      doc
        .fillColor("#1B1F2C")
        .font("Helvetica")
        .fontSize(10)
        .text(k, earnX + 12, ey)
        .font("Helvetica-Bold")
        .text(fmt(v), earnX + 12, ey, { width: colW - 24, align: "right" });
      totalEarn += v;
      ey += 22;
    }
    doc
      .moveTo(earnX + 12, ey + 4)
      .lineTo(earnX + colW - 12, ey + 4)
      .strokeColor("#DDE1EC")
      .stroke();
    ey += 12;
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#22C55E")
      .text("Total", earnX + 12, ey)
      .text(fmt(totalEarn), earnX + 12, ey, {
        width: colW - 24,
        align: "right",
      });

    doc
      .rect(dedX, colTop, colW, 26)
      .fill("#EF4444")
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("POTONGAN", dedX + 12, colTop + 8);

    const deductions: [string, number][] = [
      ["BPJS Kesehatan (1%)", opts.payroll.bpjsKesehatan || 0],
      ["BPJS JHT (2%)", opts.payroll.bpjsJht || 0],
      ["BPJS JP (1%)", opts.payroll.bpjsJp || 0],
      [
        `PPh 21${opts.payroll.ptkpStatus ? ` · ${opts.payroll.ptkpStatus}` : ""}`,
        opts.payroll.taxDeduction || 0,
      ],
      ["Potongan Telat", opts.payroll.attendanceDeduction || 0],
    ].filter(([, v]) => v > 0) as [string, number][];

    let dy = colTop + 30;
    let totalDed = 0;
    for (const [k, v] of deductions) {
      doc
        .fillColor("#1B1F2C")
        .font("Helvetica")
        .fontSize(10)
        .text(k, dedX + 12, dy)
        .font("Helvetica-Bold")
        .text(fmt(v), dedX + 12, dy, { width: colW - 24, align: "right" });
      totalDed += v;
      dy += 22;
    }
    doc
      .moveTo(dedX + 12, dy + 4)
      .lineTo(dedX + colW - 12, dy + 4)
      .strokeColor("#DDE1EC")
      .stroke();
    dy += 12;
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#EF4444")
      .text("Total", dedX + 12, dy)
      .text(fmt(totalDed), dedX + 12, dy, {
        width: colW - 24,
        align: "right",
      });

    doc.y = Math.max(ey, dy) + 50;

    // Take home pay big box
    const thpY = doc.y;
    doc.roundedRect(50, thpY, doc.page.width - 100, 80, 14).fill("#1B1F2C");
    doc
      .fillColor("#8A93AD")
      .font("Helvetica")
      .fontSize(10)
      .text("TAKE HOME PAY", 70, thpY + 16);
    doc
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(24)
      .text(fmt(opts.payroll.netSalary || 0), 70, thpY + 30);
    if (opts.employee?.bankName) {
      const last4 = opts.employee.bankAccount
        ? `****${String(opts.employee.bankAccount).slice(-4)}`
        : "";
      doc
        .fillColor("#8A93AD")
        .font("Helvetica")
        .fontSize(9)
        .text(`Transfer ke`, doc.page.width - 220, thpY + 18, {
          width: 150,
          align: "right",
        });
      doc
        .fillColor("white")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(
          `${opts.employee.bankName} ${last4}`,
          doc.page.width - 220,
          thpY + 32,
          { width: 150, align: "right" }
        );
      if (opts.payroll.paidAt) {
        doc
          .fillColor("#8A93AD")
          .font("Helvetica")
          .fontSize(8)
          .text(
            `Dibayar ${new Date(opts.payroll.paidAt).toLocaleDateString("id-ID")}`,
            doc.page.width - 220,
            thpY + 50,
            { width: 150, align: "right" }
          );
      }
    }

    // Employer share box (BPJS company contribution)
    if (opts.payroll.employerBpjs > 0) {
      const empY = thpY + 95;
      doc
        .fillColor("#8A93AD")
        .font("Helvetica")
        .fontSize(8)
        .text(
          `Kontribusi BPJS dari perusahaan: ${fmt(opts.payroll.employerBpjs)} (tidak dipotong dari take home).`,
          50,
          empY,
          { width: doc.page.width - 100, align: "center" }
        );
    }

    // Footer
    doc
      .fillColor("#8A93AD")
      .font("Helvetica")
      .fontSize(8)
      .text(
        `Slip ini dibuat otomatis pada ${new Date().toLocaleString("id-ID")}.`,
        50,
        doc.page.height - 60,
        { align: "center", width: doc.page.width - 100 }
      )
      .text(
        "Dokumen elektronik resmi — tidak memerlukan tanda tangan basah.",
        50,
        doc.page.height - 48,
        { align: "center", width: doc.page.width - 100 }
      );

    doc.end();
  });
}
