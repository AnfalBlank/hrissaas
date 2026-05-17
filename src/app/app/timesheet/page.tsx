"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/employee/PageHeader";
import { Icon3D } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";

function fmtMins(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}j ${min}m`;
}

export default function TimesheetPage() {
  const today = new Date();
  const [month, setMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );

  const { data } = useQuery({
    queryKey: ["timesheet-me", month],
    queryFn: () => api.timesheetMe(month),
  });

  const items = data?.items ?? [];
  const summary = data?.summary ?? {
    days: 0,
    totalMinutes: 0,
    overtimeMinutes: 0,
    lateMinutes: 0,
  };

  return (
    <div className="px-4 pt-4">
      <PageHeader title="Timesheet" subtitle="Jam kerja bulanan" />

      <input
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="input mb-4"
      />

      <div className="grid grid-cols-2 gap-3">
        <Stat
          icon="stopwatch"
          label="Total Jam Kerja"
          value={fmtMins(summary.totalMinutes)}
          color="from-emerald-100 to-emerald-50"
        />
        <Stat
          icon="fire"
          label="Lembur"
          value={fmtMins(summary.overtimeMinutes)}
          color="from-orange-100 to-orange-50"
        />
        <Stat
          icon="check"
          label="Hari Hadir"
          value={`${summary.days} hari`}
          color="from-brand-100 to-brand-50"
        />
        <Stat
          icon="warning"
          label="Telat"
          value={fmtMins(summary.lateMinutes)}
          color="from-amber-100 to-amber-50"
        />
      </div>

      <div className="mt-5">
        <p className="section-title px-1">Detail Harian</p>
        <ul className="mt-2 space-y-2">
          {items.length === 0 && (
            <li className="rounded-2xl bg-white p-6 text-center text-sm text-ink-500 shadow-soft border border-ink-100">
              Belum ada timesheet bulan ini.
            </li>
          )}
          {items.map((r: any) => {
            const variant: any =
              r.status === "present"
                ? "success"
                : r.status === "late"
                  ? "warning"
                  : r.status === "leave" || r.status === "sick"
                    ? "brand"
                    : "default";
            return (
              <li
                key={r.date}
                className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-soft border border-ink-100"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {new Date(r.date).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      weekday: "short",
                    })}
                  </p>
                  <p className="text-[11px] text-ink-500">
                    {r.checkInAt
                      ? `${new Date(r.checkInAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })} - ${
                          r.checkOutAt
                            ? new Date(r.checkOutAt).toLocaleTimeString(
                                "id-ID",
                                { hour: "2-digit", minute: "2-digit" }
                              )
                            : "—"
                        }`
                      : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-bold">
                    {r.workedMinutes ? fmtMins(r.workedMinutes) : "—"}
                  </p>
                  <Badge variant={variant}>
                    {r.status === "present"
                      ? "Hadir"
                      : r.status === "late"
                        ? `Telat ${r.lateMinutes}m`
                        : r.status}
                  </Badge>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`rounded-3xl bg-gradient-to-br ${color} p-4 shadow-soft`}>
      <Icon3D name={icon} size={48} />
      <p className="mt-1 text-xs text-ink-600">{label}</p>
      <p className="font-display text-xl font-extrabold">{value}</p>
    </div>
  );
}
