/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { requireSession } from "@/server/auth/session";
import { fail, handleError } from "@/server/api/respond";
import { buildPdfTable, fmtTime } from "@/server/exports/pdf";
import { buildExcel } from "@/server/exports/excel";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.employeeId) return fail(400, "Bukan akun pegawai");
    const url = new URL(req.url);
    const month = url.searchParams.get("month");
    const format = (url.searchParams.get("format") || "pdf").toLowerCase();

    const filter = month
      ? and(
          eq(schema.attendances.employeeId, session.employeeId),
          gte(schema.attendances.date, `${month}-01`)
        )
      : eq(schema.attendances.employeeId, session.employeeId);

    const rows = await db
      .select()
      .from(schema.attendances)
      .where(filter)
      .orderBy(desc(schema.attendances.date));

    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.id, session.employeeId));

    const filename = `riwayat-absensi-${employee?.employeeCode ?? "me"}-${month ?? "all"}`;

    if (format === "xlsx" || format === "excel") {
      const buf = await buildExcel({
        sheet: "Riwayat",
        title: `Riwayat Absensi · ${employee?.fullName ?? ""}`,
        subtitle: month
          ? `Bulan ${month}`
          : `Total ${rows.length} catatan`,
        columns: [
          { header: "Tanggal", key: "date", width: 14 },
          { header: "Check-in", key: "checkInAt", width: 18, format: "datetime" },
          { header: "Check-out", key: "checkOutAt", width: 18, format: "datetime" },
          { header: "Telat (m)", key: "lateMinutes", width: 10, format: "number" },
          { header: "Lembur (m)", key: "overtimeMinutes", width: 10, format: "number" },
          { header: "Status", key: "status", width: 12 },
          { header: "Metode", key: "checkInMethod", width: 10 },
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

    const summary = {
      Hadir: rows.filter((r) => r.status === "present").length,
      Telat: rows.filter((r) => r.status === "late").length,
      Cuti: rows.filter((r) => r.status === "leave").length,
      Sakit: rows.filter((r) => r.status === "sick").length,
    };

    const buf = await buildPdfTable({
      title: `Riwayat Absensi`,
      subtitle: `${employee?.fullName ?? ""} · ${employee?.employeeCode ?? ""}`,
      meta: Object.fromEntries(
        Object.entries(summary).map(([k, v]) => [k, String(v)])
      ),
      columns: [
        { header: "Tanggal", key: "date", width: 90 },
        {
          header: "Check-in",
          key: "checkInAt",
          width: 80,
          align: "right",
          format: fmtTime,
        },
        {
          header: "Check-out",
          key: "checkOutAt",
          width: 80,
          align: "right",
          format: fmtTime,
        },
        {
          header: "Telat",
          key: "lateMinutes",
          width: 60,
          align: "right",
          format: (v) => (v ? `${v}m` : "-"),
        },
        {
          header: "Lembur",
          key: "overtimeMinutes",
          width: 60,
          align: "right",
          format: (v) => (v ? `${v}m` : "-"),
        },
        { header: "Status", key: "status", width: 75 },
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
