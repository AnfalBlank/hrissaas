"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/admin/TopBar";
import { Icon3D } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { downloadFile } from "@/lib/download";
import { formatCurrency } from "@/lib/utils";
import { FileSpreadsheet, FileText, Play } from "lucide-react";

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function PayrollAdmin() {
  const qc = useQueryClient();
  const [period, setPeriod] = useState(currentPeriod());
  const { data } = useQuery({
    queryKey: ["admin-payroll", period],
    queryFn: () => api.adminPayroll(period),
  });

  const generate = useMutation({
    mutationFn: () => api.adminGeneratePayroll(period),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-payroll", period] }),
  });

  const generateThr = useMutation({
    mutationFn: () => api.adminGenerateThr(period),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["admin-payroll", period] });
      qc.invalidateQueries({ queryKey: ["payroll-components"] });
      alert(res?.message ?? "THR berhasil di-generate");
    },
  });

  const [exporting, setExporting] = useState<"" | "pdf" | "xlsx">("");
  async function handleExport(format: "pdf" | "xlsx") {
    setExporting(format);
    try {
      await downloadFile(
        `/api/admin/payroll/export?period=${period}&format=${format}`
      );
    } catch (e: any) {
      alert(e.message);
    } finally {
      setExporting("");
    }
  }

  const items = data?.items ?? [];
  const totals = data?.totals ?? { gross: 0, deduction: 0, net: 0 };

  return (
    <>
      <TopBar
        title="Payroll Management"
        subtitle="Generate dan kelola gaji bulanan"
        actions={
          <>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm"
            />
            <Button
              variant="secondary"
              onClick={() => handleExport("xlsx")}
              disabled={!!exporting || items.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {exporting === "xlsx" ? "Mengunduh..." : "Excel"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport("pdf")}
              disabled={!!exporting || items.length === 0}
            >
              <FileText className="h-4 w-4" />
              {exporting === "pdf" ? "Mengunduh..." : "PDF"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => generateThr.mutate()}
              disabled={generateThr.isPending}
            >
              <Icon3D name="party" size={20} />
              {generateThr.isPending ? "Generating THR..." : "Generate THR"}
            </Button>
            <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
              <Play className="h-4 w-4" />
              {generate.isPending ? "Generating..." : "Generate Payroll"}
            </Button>
          </>
        }
      />
      <div className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: "Periode", v: period, i: "calendar" as const, c: "from-brand-100 to-brand-50" },
            { l: "Pegawai", v: items.length, i: "people" as const, c: "from-violet-100 to-violet-50" },
            { l: "Total Net", v: formatCurrency(totals.net), i: "payroll" as const, c: "from-emerald-100 to-emerald-50" },
            { l: "Total Potongan", v: formatCurrency(totals.deduction), i: "receipt" as const, c: "from-amber-100 to-amber-50" },
          ].map((s) => (
            <div
              key={s.l}
              className={`rounded-3xl bg-gradient-to-br ${s.c} p-5 shadow-soft`}
            >
              <Icon3D name={s.i} size={56} />
              <p className="mt-2 text-xs text-ink-500">{s.l}</p>
              <p className="font-display text-xl font-extrabold">{s.v}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-card border border-ink-100">
          <div className="border-b border-ink-100 px-5 py-4 flex items-center justify-between">
            <p className="font-display font-bold">Daftar Payroll {period}</p>
            <Badge variant="brand">{items.length} pegawai</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-3">Pegawai</th>
                  <th className="px-5 py-3">Divisi</th>
                  <th className="px-5 py-3 text-right">Gaji Pokok</th>
                  <th className="px-5 py-3 text-right">Lembur</th>
                  <th className="px-5 py-3 text-right">Potongan</th>
                  <th className="px-5 py-3 text-right">Take Home</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-8 text-center text-ink-500"
                    >
                      Belum ada payroll. Klik &quot;Generate Payroll&quot; untuk
                      membuat.
                    </td>
                  </tr>
                )}
                {items.map((r: any) => {
                  const ded =
                    (r.attendanceDeduction || 0) +
                    (r.taxDeduction || 0) +
                    (r.bpjsDeduction || 0);
                  const variant =
                    r.status === "paid" ? "success" :
                    r.status === "approved" ? "brand" : "warning";
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-ink-100 hover:bg-ink-50/60"
                    >
                      <td className="px-5 py-3 font-semibold">{r.fullName}</td>
                      <td className="px-5 py-3">{r.division}</td>
                      <td className="px-5 py-3 text-right font-mono">
                        {formatCurrency(r.baseSalary)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono">
                        {formatCurrency(r.overtimePay)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-danger-600">
                        - {formatCurrency(ded)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold">
                        {formatCurrency(r.netSalary)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={variant as any}>{r.status}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
