"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/admin/TopBar";
import { Icon3D, type Icon3DName } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useRealtime } from "@/lib/realtime";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Plus } from "lucide-react";

const PIE_COLORS = ["#3a5cff", "#5a83ff", "#ff7a59", "#22c55e", "#f59e0b", "#a855f7"];

export default function AdminDashboard() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => api.adminDashboard(),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
  useRealtime("attendance:check-in", invalidate);
  useRealtime("attendance:check-out", invalidate);
  useRealtime("leave:applied", invalidate);
  useRealtime("leave:decided", invalidate);

  const stats: {
    label: string;
    value: string | number;
    delta?: string;
    up?: boolean;
    icon: Icon3DName;
    bg: string;
  }[] = [
    {
      label: "Total Pegawai",
      value: data?.stats?.totalEmployees ?? "-",
      icon: "people",
      bg: "from-brand-100 to-brand-50",
    },
    {
      label: "Hadir Hari Ini",
      value: data?.stats?.present ?? 0,
      icon: "check",
      bg: "from-emerald-100 to-emerald-50",
    },
    {
      label: "Telat",
      value: data?.stats?.late ?? 0,
      icon: "warning",
      bg: "from-amber-100 to-amber-50",
    },
    {
      label: "Cuti / Sakit",
      value: (data?.stats?.onLeave ?? 0) + (data?.stats?.sick ?? 0),
      icon: "beach",
      bg: "from-cyan-100 to-cyan-50",
    },
  ];

  const monthly = [
    { m: "Jan", v: 92 },
    { m: "Feb", v: 94 },
    { m: "Mar", v: 91 },
    { m: "Apr", v: 95 },
    { m: "Mei", v: 96 },
  ];

  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle="Ringkasan kehadiran perusahaan hari ini"
        actions={
          <Button>
            <Plus className="h-4 w-4" /> Tambah Pegawai
          </Button>
        }
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-3xl bg-white p-5 shadow-card border border-ink-100"
            >
              <div className="flex items-start justify-between">
                <Icon3D name={s.icon} size={56} />
              </div>
              <p className="mt-4 text-xs text-ink-500">{s.label}</p>
              <p className="font-display text-3xl font-extrabold">
                {isLoading ? "..." : s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl bg-white p-5 shadow-card border border-ink-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-base font-bold">
                  Kehadiran 7 Hari Terakhir
                </p>
                <p className="text-xs text-ink-500">
                  Hadir, telat, dan cuti per hari
                </p>
              </div>
              <Badge variant="brand">Live</Badge>
            </div>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.chart ?? []} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    label={{
                      value: "Pegawai",
                      angle: -90,
                      position: "insideLeft",
                      style: { fontSize: 11, fill: "#8A93AD" },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid #eef0f6",
                      boxShadow: "0 8px 30px -8px rgba(0,0,0,.12)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="hadir" fill="#3a5cff" radius={[8, 8, 0, 0]} name="Hadir" />
                  <Bar dataKey="telat" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Telat" />
                  <Bar dataKey="cuti" fill="#22c55e" radius={[8, 8, 0, 0]} name="Cuti" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-card border border-ink-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-base font-bold">Distribusi Divisi</p>
                <p className="text-xs text-ink-500">Total pegawai per divisi</p>
              </div>
              <Icon3D name="pieChart" size={48} />
            </div>
            <div className="mt-2 h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.divisions ?? []}
                    dataKey="v"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {(data?.divisions ?? []).map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1 text-xs">
              {(data?.divisions ?? []).map((d: any, i: number) => (
                <li
                  key={d.name}
                  className="flex items-center justify-between text-ink-600"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    {d.name}
                  </span>
                  <span className="font-mono">{d.v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl bg-white p-5 shadow-card border border-ink-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-base font-bold">Tren Kehadiran Bulanan</p>
                <p className="text-xs text-ink-500">% pegawai hadir</p>
              </div>
              <Badge variant="success">+4% YoY</Badge>
            </div>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3a5cff" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3a5cff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="m" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    domain={[80, 100]}
                    label={{
                      value: "% Hadir",
                      angle: -90,
                      position: "insideLeft",
                      style: { fontSize: 11, fill: "#8A93AD" },
                    }}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#3a5cff"
                    strokeWidth={3}
                    fill="url(#grad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <LiveFeed feed={data?.feed ?? []} />
        </div>

        <BranchSummary branches={data?.branches ?? []} />
      </div>
    </>
  );
}

function LiveFeed({ feed }: { feed: any[] }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-card border border-ink-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-base font-bold">Aktivitas Realtime</p>
          <p className="text-xs text-ink-500">Update setiap detik</p>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-success-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-success-500" />
          LIVE
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {feed.length === 0 && (
          <li className="rounded-2xl bg-ink-50 p-4 text-center text-xs text-ink-500">
            Belum ada aktivitas hari ini.
          </li>
        )}
        {feed.map((it: any) => {
          const icon: Icon3DName =
            it.status === "late"
              ? "warning"
              : it.method === "qr"
                ? "qrcode"
                : "face";
          const time = it.checkInAt
            ? new Date(it.checkInAt).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—";
          return (
            <li
              key={it.id}
              className="flex items-center gap-3 rounded-2xl bg-ink-50 p-3"
            >
              <Icon3D name={icon} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {it.employeeName ?? "-"}
                </p>
                <p className="truncate text-[11px] text-ink-500">
                  {it.status === "late"
                    ? `Telat ${it.lateMinutes ?? 0}m`
                    : "Check-in"}{" "}
                  · {it.branchName ?? "-"}
                </p>
              </div>
              <span className="font-mono text-xs text-ink-500">{time}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BranchSummary({ branches }: { branches: any[] }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-card border border-ink-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-base font-bold">Statistik Cabang</p>
          <p className="text-xs text-ink-500">Performance per cabang hari ini</p>
        </div>
        <Icon3D name="buildings" size={48} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {branches.length === 0 && (
          <div className="col-span-full rounded-2xl bg-ink-50 p-6 text-center text-xs text-ink-500">
            Belum ada cabang terdaftar.
          </div>
        )}
        {branches.map((b: any) => (
          <div
            key={b.id}
            className="rounded-2xl bg-gradient-to-br from-ink-50 to-white p-4 border border-ink-100"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">{b.name}</p>
              <Icon3D name="pin" size={28} />
            </div>
            <p className="text-xs text-ink-500">{b.city}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-ink-500">Pegawai</span>
              <span className="font-bold">{b.employees}</span>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-ink-500">Kehadiran</span>
                <span className="font-mono font-semibold">{b.percent}%</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-ink-100">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                  style={{ width: `${b.percent}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
