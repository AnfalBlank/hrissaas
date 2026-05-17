"use client";

import { useState } from "react";
import { PageHeader } from "@/components/employee/PageHeader";
import { Icon3D } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { downloadFile } from "@/lib/download";
import { FileSpreadsheet, FileText, Filter } from "lucide-react";

export default function HistoryPage() {
  const [tab, setTab] = useState<"list" | "calendar">("list");
  const [exporting, setExporting] = useState<"" | "pdf" | "xlsx">("");
  const { data } = useQuery({
    queryKey: ["attendance-me"],
    queryFn: () => api.attendanceMe(),
  });

  async function handleExport(format: "pdf" | "xlsx") {
    setExporting(format);
    try {
      await downloadFile(`/api/attendance/me/export?format=${format}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setExporting("");
    }
  }

  const rows = data?.history ?? [];
  const summary = {
    present: rows.filter((r: any) => r.status === "present").length,
    late: rows.filter((r: any) => r.status === "late").length,
    leave: rows.filter((r: any) => r.status === "leave" || r.status === "sick").length,
  };

  const fmtTime = (ts: any) =>
    ts ? new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="px-4 pt-4">
      <PageHeader
        title="Riwayat Absensi"
        subtitle={new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
        right={
          <button className="grid h-10 w-10 place-items-center rounded-2xl bg-white border border-ink-100 shadow-soft">
            <Filter className="h-4 w-4" />
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-2">
        {[
          { l: "Hadir", v: summary.present, c: "from-emerald-100 to-emerald-50", i: "check" as const },
          { l: "Telat", v: summary.late, c: "from-amber-100 to-amber-50", i: "warning" as const },
          { l: "Cuti", v: summary.leave, c: "from-violet-100 to-violet-50", i: "beach" as const },
        ].map((s) => (
          <div
            key={s.l}
            className={`rounded-2xl bg-gradient-to-br ${s.c} p-3 shadow-soft`}
          >
            <Icon3D name={s.i} size={36} />
            <p className="mt-1 text-xs text-ink-500">{s.l}</p>
            <p className="font-display text-2xl font-extrabold">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-white p-1 ring-1 ring-ink-100">
        {(["list", "calendar"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl py-2 text-sm font-semibold transition ${
              tab === t ? "bg-brand-600 text-white shadow-glow" : "text-ink-500"
            }`}
          >
            {t === "list" ? "Daftar" : "Kalender"}
          </button>
        ))}
      </div>

      {tab === "list" ? (
        <ul className="mt-4 space-y-2">
          {rows.length === 0 && (
            <li className="rounded-2xl bg-white p-6 text-center text-sm text-ink-500 shadow-soft border border-ink-100">
              Belum ada riwayat absensi.
            </li>
          )}
          {rows.map((r: any) => {
            const variant: any =
              r.status === "present" ? "success" :
              r.status === "late" ? "warning" :
              r.status === "leave" || r.status === "sick" ? "brand" : "default";
            const label =
              r.status === "present" ? "Tepat Waktu" :
              r.status === "late" ? `Telat ${r.lateMinutes}m` :
              r.status === "leave" ? "Cuti" :
              r.status === "sick" ? "Sakit" : r.status;
            return (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-soft border border-ink-100"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {new Date(r.date).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-ink-500">
                    <span>In {fmtTime(r.checkInAt)}</span>
                    <span>·</span>
                    <span>Out {fmtTime(r.checkOutAt)}</span>
                  </div>
                </div>
                <Badge variant={variant}>{label}</Badge>
              </li>
            );
          })}
        </ul>
      ) : (
        <CalendarView rows={rows} />
      )}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          onClick={() => handleExport("pdf")}
          disabled={!!exporting}
        >
          <FileText className="h-4 w-4" />
          {exporting === "pdf" ? "Mengunduh..." : "Export PDF"}
        </Button>
        <Button
          onClick={() => handleExport("xlsx")}
          disabled={!!exporting}
        >
          <FileSpreadsheet className="h-4 w-4" />
          {exporting === "xlsx" ? "Mengunduh..." : "Export Excel"}
        </Button>
      </div>
    </div>
  );
}

function CalendarView({ rows }: { rows: any[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const map = new Map<string, any>();
  rows.forEach((r) => map.set(r.date, r));

  const status = (d: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const r = map.get(dateStr);
    if (!r) {
      const dt = new Date(year, month, d);
      if (dt > today) return "future";
      if (dt.getDay() === 0 || dt.getDay() === 6) return "off";
      return "future";
    }
    if (r.status === "late") return "late";
    if (r.status === "leave" || r.status === "sick") return "leave";
    return "present";
  };

  return (
    <div className="mt-4 rounded-3xl bg-white p-4 shadow-soft border border-ink-100">
      <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-medium text-ink-400">
        {["S", "S", "R", "K", "J", "S", "M"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2 text-sm">
        {days.map((d) => {
          const s = status(d);
          const colors = {
            present: "bg-success-500/15 text-success-700",
            late: "bg-warning-500/20 text-warning-600",
            leave: "bg-brand-500/15 text-brand-700",
            off: "bg-ink-100 text-ink-400",
            future: "bg-white text-ink-300",
          } as const;
          return (
            <div
              key={d}
              className={`grid h-10 place-items-center rounded-xl text-xs font-semibold ${colors[s]}`}
            >
              {d}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <Legend color="bg-success-500" label="Hadir" />
        <Legend color="bg-warning-500" label="Telat" />
        <Legend color="bg-brand-500" label="Cuti" />
        <Legend color="bg-ink-300" label="Libur" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2 py-1 text-ink-600">
      <span className={`h-2 w-2 rounded-full ${color}`} /> {label}
    </span>
  );
}
