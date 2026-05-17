/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
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
    const format = (url.searchParams.get("format") || "pdf").toLowerCase();

    const rows = await db
      .select({
        employeeCode: schema.employees.employeeCode,
        fullName: schema.employees.fullName,
        position: schema.employees.position,
        division: schema.employees.division,
        phone: schema.employees.phone,
        baseSalary: schema.employees.baseSalary,
        status: schema.employees.status,
        joinDate: schema.employees.joinDate,
        branchName: schema.branches.name,
        userEmail: schema.users.email,
        userRole: schema.users.role,
      })
      .from(schema.employees)
      .leftJoin(
        schema.branches,
        eq(schema.employees.branchId, schema.branches.id)
      )
      .leftJoin(schema.users, eq(schema.employees.userId, schema.users.id))
      .where(eq(schema.employees.companyId, session.companyId));

    const filename = `employees-${new Date().toISOString().slice(0, 10)}`;

    if (format === "xlsx" || format === "excel") {
      const buf = await buildExcel({
        sheet: "Pegawai",
        title: "Master Data Pegawai",
        subtitle: `Total ${rows.length} pegawai`,
        columns: [
          { header: "Kode", key: "employeeCode", width: 14 },
          { header: "Nama", key: "fullName", width: 28 },
          { header: "Email", key: "userEmail", width: 26 },
          { header: "Posisi", key: "position", width: 22 },
          { header: "Divisi", key: "division", width: 16 },
          { header: "Cabang", key: "branchName", width: 18 },
          { header: "Role", key: "userRole", width: 12 },
          { header: "Telepon", key: "phone", width: 16 },
          { header: "Gaji Pokok", key: "baseSalary", width: 16, format: "currency" },
          { header: "Tgl Bergabung", key: "joinDate", width: 14, format: "date" },
          { header: "Status", key: "status", width: 12 },
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

    const buf = await buildPdfTable({
      title: "Master Data Pegawai",
      subtitle: new Date().toLocaleDateString("id-ID"),
      meta: { Total: String(rows.length) },
      columns: [
        { header: "Kode", key: "employeeCode", width: 70 },
        { header: "Nama", key: "fullName", width: 130 },
        { header: "Posisi", key: "position", width: 110 },
        { header: "Divisi", key: "division", width: 70 },
        { header: "Cabang", key: "branchName", width: 90 },
        {
          header: "Gaji",
          key: "baseSalary",
          width: 85,
          align: "right",
          format: fmtCurrency,
        },
        { header: "Status", key: "status", width: 60 },
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
