/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { handleError } from "@/server/api/respond";
import { buildPdfTable } from "@/server/exports/pdf";
import { buildExcel } from "@/server/exports/excel";

const ADMIN_ROLES = ["super_admin", "owner", "hr", "supervisor"];

const TYPE_LABEL: Record<string, string> = {
  annual: "Cuti Tahunan",
  sick: "Sakit",
  permission: "Izin",
  emergency: "Darurat",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const format = (url.searchParams.get("format") || "pdf").toLowerCase();

    const filters = [eq(schema.leaves.companyId, session.companyId)];
    if (status) filters.push(eq(schema.leaves.status, status));

    const rows = await db
      .select({
        type: schema.leaves.type,
        fromDate: schema.leaves.fromDate,
        toDate: schema.leaves.toDate,
        days: schema.leaves.days,
        reason: schema.leaves.reason,
        status: schema.leaves.status,
        approverNote: schema.leaves.approverNote,
        createdAt: schema.leaves.createdAt,
        employeeCode: schema.employees.employeeCode,
        fullName: schema.employees.fullName,
        division: schema.employees.division,
      })
      .from(schema.leaves)
      .leftJoin(
        schema.employees,
        eq(schema.leaves.employeeId, schema.employees.id)
      )
      .where(and(...filters))
      .orderBy(desc(schema.leaves.createdAt));

    const mapped = rows.map((r) => ({
      ...r,
      typeLabel: TYPE_LABEL[r.type] ?? r.type,
      statusLabel: STATUS_LABEL[r.status] ?? r.status,
    }));

    const filename = `leaves-${new Date().toISOString().slice(0, 10)}`;

    if (format === "xlsx" || format === "excel") {
      const buf = await buildExcel({
        sheet: "Cuti",
        title: "Laporan Cuti",
        subtitle: `Total ${rows.length} pengajuan`,
        columns: [
          { header: "Kode", key: "employeeCode", width: 14 },
          { header: "Nama", key: "fullName", width: 26 },
          { header: "Divisi", key: "division", width: 16 },
          { header: "Jenis", key: "typeLabel", width: 16 },
          { header: "Dari", key: "fromDate", width: 14, format: "date" },
          { header: "Sampai", key: "toDate", width: 14, format: "date" },
          { header: "Hari", key: "days", width: 8, format: "number" },
          { header: "Alasan", key: "reason", width: 30 },
          { header: "Status", key: "statusLabel", width: 12 },
          { header: "Catatan Approver", key: "approverNote", width: 28 },
          { header: "Diajukan", key: "createdAt", width: 16, format: "datetime" },
        ],
        rows: mapped,
      });
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      });
    }

    const buf = await buildPdfTable({
      title: "Laporan Cuti",
      subtitle: new Date().toLocaleDateString("id-ID"),
      meta: { Total: String(rows.length) },
      columns: [
        { header: "Nama", key: "fullName", width: 130 },
        { header: "Jenis", key: "typeLabel", width: 90 },
        { header: "Dari", key: "fromDate", width: 75 },
        { header: "Sampai", key: "toDate", width: 75 },
        { header: "Hari", key: "days", width: 45, align: "right" },
        { header: "Status", key: "statusLabel", width: 70 },
      ],
      rows: mapped,
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
