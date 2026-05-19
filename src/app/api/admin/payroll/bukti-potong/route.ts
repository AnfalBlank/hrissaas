/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lte } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { audit } from "@/server/auth/audit";
import { fail, handleError } from "@/server/api/respond";
import PDFDocument from "pdfkit";

const ADMIN_ROLES = ["super_admin", "owner", "hr"];

/**
 * Bukti Potong PPh Pasal 21 (Form 1721-A1) — tahunan.
 * Query: ?year=YYYY&employeeId=xxx (opsional, jika tidak diisi return semua employee)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const url = new URL(req.url);
    const year =
      url.searchParams.get("year") || String(new Date().getFullYear());
    const employeeId = url.searchParams.get("employeeId");

    if (!employeeId) {
      return fail(400, "employeeId wajib untuk Bukti Potong");
    }

    const yearNum = Number(year);
    if (!yearNum) return fail(400, "year tidak valid");

    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.id, employeeId));
    if (!employee || employee.companyId !== session.companyId)
      return fail(404, "Pegawai tidak ditemukan");

    const [company] = await db
      .select()
      .from(schema.companies)
      .where(eq(schema.companies.id, session.companyId));
    const [settings] = await db
      .select()
      .from(schema.payrollSettings)
      .where(eq(schema.payrollSettings.companyId, session.companyId));

    const payrolls = await db
      .select()
      .from(schema.payrolls)
      .where(
        and(
          eq(schema.payrolls.employeeId, employeeId),
          gte(schema.payrolls.period, `${year}-01`),
          lte(schema.payrolls.period, `${year}-12`)
        )
      );

    if (payrolls.length === 0) return fail(404, "Belum ada payroll di tahun tsb");

    const ytd = payrolls.reduce(
      (a, p) => ({
        gross:
          a.gross +
          (p.baseSalary || 0) +
          (p.allowance || 0) +
          (p.overtimePay || 0) +
          (p.bonus || 0) +
          (p.thr || 0),
        bpjs: a.bpjs + (p.bpjsDeduction || 0),
        tax: a.tax + (p.taxDeduction || 0),
      }),
      { gross: 0, bpjs: 0, tax: 0 }
    );

    const buf = await renderBuktiPotong({
      year: yearNum,
      company: company?.name ?? "Perusahaan",
      companyNpwp: settings?.companyNpwp ?? null,
      companyAddress: settings?.companyTaxAddress ?? null,
      employee,
      payrolls,
      ytd,
    });

    await audit({
      companyId: session.companyId,
      userId: session.sub,
      action: "payroll.buktiPotong.download",
      details: { employeeId, year: yearNum, ytdTax: ytd.tax },
    });

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="1721-A1-${employee.employeeCode}-${year}.pdf"`,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}

function renderBuktiPotong(opts: {
  year: number;
  company: string;
  companyNpwp: string | null;
  companyAddress: string | null;
  employee: any;
  payrolls: any[];
  ytd: { gross: number; bpjs: number; tax: number };
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

    // Header
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("BUKTI PEMOTONGAN PAJAK PENGHASILAN", { align: "center" });
    doc
      .font("Helvetica")
      .fontSize(11)
      .text("Pasal 21 (Form 1721-A1)", { align: "center" });
    doc.moveDown(0.5);
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(`Masa Pajak: Januari–Desember ${opts.year}`, { align: "center" });
    doc.moveDown(1);

    // Pemberi Kerja
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("A. IDENTITAS PEMOTONG (Pemberi Kerja)");
    doc.font("Helvetica").fontSize(10);
    doc.text(`Nama        : ${opts.company}`);
    doc.text(`NPWP        : ${opts.companyNpwp ?? "-"}`);
    doc.text(`Alamat      : ${opts.companyAddress ?? "-"}`);
    doc.moveDown(0.7);

    // Penerima
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("B. IDENTITAS PENERIMA PENGHASILAN");
    doc.font("Helvetica").fontSize(10);
    doc.text(`Nama        : ${opts.employee?.fullName ?? "-"}`);
    doc.text(`NPWP        : ${opts.employee?.npwp ?? "—"}`);
    doc.text(`Status PTKP : ${opts.employee?.ptkpStatus ?? "TK/0"}`);
    doc.text(`Kode Pegawai: ${opts.employee?.employeeCode ?? "-"}`);
    doc.text(`Jabatan     : ${opts.employee?.position ?? "-"}`);
    doc.moveDown(0.7);

    // Rincian Penghasilan
    doc.font("Helvetica-Bold").fontSize(11).text("C. RINCIAN PENGHASILAN");
    doc.font("Helvetica").fontSize(9);
    doc.moveDown(0.3);

    // Tabel rincian per bulan
    const tableTop = doc.y;
    const cols = [
      { k: "period", l: "Periode", w: 70 },
      { k: "gross", l: "Bruto", w: 100 },
      { k: "bpjs", l: "BPJS", w: 80 },
      { k: "tax", l: "PPh 21", w: 80 },
      { k: "net", l: "Take Home", w: 100 },
    ];

    let x = 50;
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#1B1F2C");
    for (const c of cols) {
      doc.text(c.l, x, tableTop, { width: c.w, align: c.k === "period" ? "left" : "right" });
      x += c.w;
    }
    doc
      .moveTo(50, tableTop + 14)
      .lineTo(50 + cols.reduce((s, c) => s + c.w, 0), tableTop + 14)
      .stroke();

    let y = tableTop + 18;
    doc.font("Helvetica").fontSize(9);
    for (const p of opts.payrolls.sort((a, b) => a.period.localeCompare(b.period))) {
      const gross =
        (p.baseSalary || 0) +
        (p.allowance || 0) +
        (p.overtimePay || 0) +
        (p.bonus || 0) +
        (p.thr || 0);
      const row = {
        period: p.period,
        gross: fmt(gross),
        bpjs: fmt(p.bpjsDeduction || 0),
        tax: fmt(p.taxDeduction || 0),
        net: fmt(p.netSalary || 0),
      };
      x = 50;
      for (const c of cols) {
        doc.text(String((row as any)[c.k]), x, y, {
          width: c.w,
          align: c.k === "period" ? "left" : "right",
        });
        x += c.w;
      }
      y += 14;
    }

    // Total row
    doc
      .moveTo(50, y + 2)
      .lineTo(50 + cols.reduce((s, c) => s + c.w, 0), y + 2)
      .stroke();
    y += 6;
    doc.font("Helvetica-Bold");
    x = 50;
    doc.text("TOTAL", x, y, { width: cols[0].w });
    x += cols[0].w;
    doc.text(fmt(opts.ytd.gross), x, y, { width: cols[1].w, align: "right" });
    x += cols[1].w;
    doc.text(fmt(opts.ytd.bpjs), x, y, { width: cols[2].w, align: "right" });
    x += cols[2].w;
    doc.text(fmt(opts.ytd.tax), x, y, { width: cols[3].w, align: "right" });
    x += cols[3].w;
    doc.text(fmt(opts.ytd.gross - opts.ytd.bpjs - opts.ytd.tax), x, y, {
      width: cols[4].w,
      align: "right",
    });
    doc.y = y + 24;

    // Summary box
    doc.font("Helvetica-Bold").fontSize(11).text("D. RINGKASAN");
    doc.font("Helvetica").fontSize(10);
    doc.text(`Penghasilan Bruto Setahun  : ${fmt(opts.ytd.gross)}`);
    doc.text(`Iuran BPJS Karyawan        : ${fmt(opts.ytd.bpjs)}`);
    doc.text(`PPh Pasal 21 Telah Dipotong: ${fmt(opts.ytd.tax)}`);
    doc.moveDown(1);

    // Footer attestation
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#5B6478")
      .text(
        "Dokumen ini dibuat berdasarkan data sistem HRIS dan dapat dijadikan dasar pelaporan SPT Tahunan PPh Orang Pribadi sesuai PMK 168/2023 dan UU HPP 7/2021.",
        { align: "justify" }
      );
    doc.moveDown(1);
    doc.fillColor("#1B1F2C").font("Helvetica").fontSize(10);
    doc.text(
      `Dicetak pada: ${new Date().toLocaleString("id-ID")}`,
      { align: "right" }
    );
    doc.moveDown(2);
    doc.text("Pemberi Kerja,", { align: "right" });
    doc.moveDown(3);
    doc.text(`(${opts.company})`, { align: "right" });

    doc.end();
  });
}
