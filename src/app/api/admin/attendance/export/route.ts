/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireRole } from "@/server/auth/session";
import { handleError } from "@/server/api/respond";
import { todayLocalDate } from "@/server/lib/geo";
import { buildPdfTable, fmtTime } from "@/server/exports/pdf";
import { buildExcel } from "@/server/exports/excel";

const ADMIN_ROLES = ["super_admin", "owner", "hr", "supervisor"];

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(ADMIN_ROLES);
    const url = new URL(req.url);
    const date = url.searchParams.get("date") || todayLocalDate();
    const format = (url.searchParams.get("format") || "pdf").toLowerCase();

    const rows = await db
      .select({
        id: schema.attendances.id,
        date: schema.attendances.date,
        status: schema.attendances.status,
        checkInAt: schema.attendances.checkInAt,
        checkOutAt: schema.attendances.checkOutAt,
        method: schema.attendances.checkInMethod,
        lateMinutes: schema.attendances.lateMinutes,
        overtimeMinutes: schema.attendances.overtimeMinutes,
        employeeCode: schema.employees.employeeCode,
        fullName: schema.employees.fullName,
        division: schema.employees.division,
        position: schema.employees.position,
        branchName: schema.branches.name,
      })
      .from(schema.attendances)
      .leftJoin(
        schema.employees,
        eq(schema.attendances.employeeId, schema.employees.id)
      )
      .leftJoin(
        schema.branches,
        eq(schema.attendances.branchId, schema.branches.id)
      )
      .where(
        and(
          eq(schema.attendances.companyId, session.companyId),
          eq(schema.attendances.date, date)
        )
      )
      .orderBy(desc(schema.attendances.checkInAt))
      .limit(1000);

    const summary = {
      present: rows.filter((r) => r.status === "present").length,
      late: rows.filter((r) => r.status === "late").length,
      leave: rows.filter((r) => r.status === "leave").length,
      sick: rows.filter((r) => r.status === "sick").length,
      total: rows.length,
    };

    const filename = `attendance-${date}`;

    if (format === "xlsx" || format === "excel") {
      const buf = await buildExcel({
        sheet: `Absensi ${date}`,
        title: `Laporan Absensi ${date}`,
        subtitle: `Total: ${summary.total} · Hadir: ${summary.present} · Telat: ${summary.late} · Cuti: ${summary.leave} · Sakit: ${summary.sick}`,
        columns: [
          { header: "Kode", key: "employeeCode", width: 14 },
          { header: "Nama", key: "fullName", width: 28 },
          { header: "Divisi", key: "division", width: 16 },
          { header: "Cabang", key: "branchName", width: 18 },
          { header: "Check-in", key: "checkInAt", width: 18, format: "datetime" },
          { header: "Check-out", key: "checkOutAt", width: 18, format: "datetime" },
          { header: "Telat (m)", key: "lateMinutes", width: 10, format: "number" },
          { header: "Lembur (m)", key: "overtimeMinutes", width: 10, format: "number" },
          { header: "Status", key: "status", width: 12 },
          { header: "Metode", key: "method", width: 10 },
        ],
        rows,
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
      title: `Laporan Absensi`,
      subtitle: `Periode: ${date}`,
      meta: {
        Hadir: String(summary.present),
        Telat: String(summary.late),
        Cuti: String(summary.leave),
        Sakit: String(summary.sick),
        Total: String(summary.total),
      },
      columns: [
        { header: "Nama", key: "fullName", width: 130 },
        { header: "Kode", key: "employeeCode", width: 70 },
        { header: "Cabang", key: "branchName", width: 95 },
        {
          header: "In",
          key: "checkInAt",
          width: 60,
          align: "right",
          format: fmtTime,
        },
        {
          header: "Out",
          key: "checkOutAt",
          width: 60,
          align: "right",
          format: fmtTime,
        },
        {
          header: "Telat",
          key: "lateMinutes",
          width: 50,
          align: "right",
          format: (v) => (v ? `${v}m` : "-"),
        },
        { header: "Status", key: "status", width: 50 },
      ],
      rows,
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
