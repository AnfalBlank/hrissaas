"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/admin/TopBar";
import { Icon3D } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { downloadFile } from "@/lib/download";
import { FileSpreadsheet, FileText } from "lucide-react";

const todayStr = new Date().toISOString().slice(0, 10);

export default function TimesheetAdmin() {
  const [date, setDate] = useState(todayStr);
  const [exporting, setExporting] = useState<"" | "pdf" | "xlsx">("");

  const { data } = useQuery({
    queryKey: ["admin-attendance", date],
    queryFn: () => api.adminAttendance(date),
  });

  async function handleExport(format: "pdf" | "xlsx") {
    setExporting(format);
    try {
      await downloadFile(
        `/api/admin/attendance/export?date=${date}&format=${format}`
      );
    } catch (e: any) {
      alert(e.message);
    } finally {
      setExporting("");
    }
  }

  const items = data?.items ?? [];
  const fmtT = (ts: any) =>
    ts
      ? new Date(ts).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  function workedMinutes(r: any) {
    if (!r.checkInAt || !r.checkOutAt) return 0;
    return Math.max(
      0,
      Math.round(
        (new Date(r.checkOutAt).getTime() -
          new Date(r.checkInAt).getTime()) /
          60000
      )
    );
  }

  function fmtMins(m: number) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${h}j ${min}m`;
  }

  const totalWorked = items.reduce((s: number, r: any) => s + workedMinutes(r), 0);
  const totalLate = items.reduce((s: number, r: any) => s + (r.lateMinutes ?? 0), 0);

  return (
    <>
      <TopBar
        title="Timesheet"
        subtitle="Jam kerja pegawai harian"
        actions={
          <>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm"
            />
            <Button
              variant="secondary"
              onClick={() => handleExport("xlsx")}
              disabled={!!exporting}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {exporting === "xlsx" ? "Mengunduh..." : "Excel"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport("pdf")}
              disabled={!!exporting}
            >
              <FileText className="h-4 w-4" />
              {exporting === "pdf" ? "Mengunduh..." : "PDF"}
            </Button>
          </>
        }
      />
      <div className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              l: "Jumlah Pegawai",
              v: items.length,
              i: "people" as const,
              c: "from-brand-100 to-brand-50",
            },
            {
              l: "Total Jam Kerja",
              v: fmtMins(totalWorked),
              i: "stopwatch" as const,
              c: "from-emerald-100 to-emerald-50",
            },
            {
              l: "Total Telat",
              v: fmtMins(totalLate),
              i: "warning" as const,
              c: "from-amber-100 to-amber-50",
            },
          ].map((s) => (
            <div
              key={s.l}
              className={`flex items-center gap-3 rounded-3xl bg-gradient-to-br ${s.c} p-5 shadow-soft`}
            >
              <Icon3D name={s.i} size={56} />
              <div>
                <p className="text-xs text-ink-500">{s.l}</p>
                <p className="font-display text-2xl font-extrabold">{s.v}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-card border border-ink-100">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-3">Pegawai</th>
                  <th className="px-5 py-3">Cabang</th>
                  <th className="px-5 py-3">Check-in</th>
                  <th className="px-5 py-3">Check-out</th>
                  <th className="px-5 py-3">Jam Kerja</th>
                  <th className="px-5 py-3">Telat</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-6 text-center text-ink-500"
                    >
                      Tidak ada timesheet pada tanggal ini.
                    </td>
                  </tr>
                )}
                {items.map((r: any) => {
                  const w = workedMinutes(r);
                  const variant =
                    r.status === "present"
                      ? "success"
                      : r.status === "late"
                        ? "warning"
                        : "default";
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-ink-100 hover:bg-ink-50/60"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-100 text-xs font-bold text-brand-700">
                            {r.fullName
                              ?.split(" ")
                              .map((s: string) => s[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <div>
                            <p className="font-semibold">{r.fullName}</p>
                            <p className="text-[11px] text-ink-500">
                              {r.employeeCode}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">{r.branchName ?? "-"}</td>
                      <td className="px-5 py-3 font-mono">
                        {fmtT(r.checkInAt)}
                      </td>
                      <td className="px-5 py-3 font-mono">
                        {fmtT(r.checkOutAt)}
                      </td>
                      <td className="px-5 py-3 font-mono font-semibold">
                        {w > 0 ? fmtMins(w) : "—"}
                      </td>
                      <td className="px-5 py-3 font-mono text-warning-600">
                        {r.lateMinutes ? fmtMins(r.lateMinutes) : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={variant as any}>
                          {r.status === "present"
                            ? "Hadir"
                            : r.status === "late"
                              ? "Telat"
                              : r.status}
                        </Badge>
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
