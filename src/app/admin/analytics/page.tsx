"use client";

import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/admin/TopBar";
import { Icon3D, type Icon3DName } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => api.adminAnalytics(),
  });

  const stats = data?.stats ?? {
    attendanceScore: 0,
    predictedLate: 0,
    topPerformer: null,
    insightCount: 0,
  };
  const trend = data?.trend ?? [];
  const productivity = data?.productivity ?? [];
  const heatmap = data?.heatmap ?? [];
  const insights = data?.insights ?? [];

  return (
    <>
      <TopBar
        title="AI Analytics"
        subtitle="Prediksi & insight berbasis data"
      />
      <div className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              l: "Skor Kehadiran",
              v: isLoading
                ? "..."
                : `${stats.attendanceScore.toFixed(1)}%`,
              d: "rata-rata 12 bulan",
              i: "trophy" as Icon3DName,
              c: "from-emerald-100 to-emerald-50",
            },
            {
              l: "Prediksi Telat",
              v: `${stats.predictedLate} org`,
              d: "berdasarkan pola 30 hari",
              i: "warning" as Icon3DName,
              c: "from-amber-100 to-amber-50",
            },
            {
              l: "Top Performer",
              v: stats.topPerformer?.name ?? "—",
              d: stats.topPerformer
                ? `Skor ${stats.topPerformer.score}`
                : "data belum cukup",
              i: "star" as Icon3DName,
              c: "from-violet-100 to-violet-50",
            },
            {
              l: "AI Insight",
              v: `${stats.insightCount} aktif`,
              d: "minggu ini",
              i: "sparkles" as Icon3DName,
              c: "from-brand-100 to-brand-50",
            },
          ].map((s) => (
            <div
              key={s.l}
              className={`rounded-3xl bg-gradient-to-br ${s.c} p-5 shadow-soft`}
            >
              <Icon3D name={s.i} size={56} />
              <p className="mt-2 text-xs text-ink-500">{s.l}</p>
              <p className="font-display text-2xl font-extrabold truncate">
                {s.v}
              </p>
              <p className="text-[11px] text-ink-500 truncate">{s.d}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl bg-white p-5 shadow-card border border-ink-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display font-bold">Tren Kehadiran 12 Bulan</p>
                <p className="text-xs text-ink-500">
                  Aktual vs prediksi (% pegawai hadir)
                </p>
              </div>
              <Badge variant="brand">AI Forecast</Badge>
            </div>
            <div className="mt-3 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="m" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke="#3a5cff"
                    strokeWidth={3}
                    name="Aktual"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pred"
                    stroke="#ff7a59"
                    strokeWidth={3}
                    strokeDasharray="6 4"
                    name="Prediksi AI"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-card border border-ink-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display font-bold">Skor Produktivitas</p>
                <p className="text-xs text-ink-500">Per divisi</p>
              </div>
              <Icon3D name="bullseye" size={48} />
            </div>
            <div className="mt-2 h-60">
              {productivity.length === 0 ? (
                <div className="grid h-full place-items-center text-xs text-ink-500">
                  Data belum cukup.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productivity} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis
                      type="category"
                      dataKey="d"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Bar dataKey="v" radius={[0, 8, 8, 0]}>
                      {productivity.map((_: any, i: number) => (
                        <Cell
                          key={i}
                          fill={
                            [
                              "#3a5cff",
                              "#5a83ff",
                              "#ff7a59",
                              "#22c55e",
                              "#f59e0b",
                              "#a855f7",
                            ][i % 6]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="rounded-3xl bg-white p-5 shadow-card border border-ink-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-display font-bold">Heatmap Kehadiran</p>
              <p className="text-xs text-ink-500">
                Hari × Jam check-in (intensitas relatif)
              </p>
            </div>
            <Icon3D name="fire" size={48} />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="px-2 py-1"></th>
                  {Array.from({ length: 12 }).map((_, h) => (
                    <th
                      key={h}
                      className="px-2 py-1 text-ink-500 font-medium"
                    >
                      {6 + h}h
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmap.map((row: any) => (
                  <tr key={row.day}>
                    <td className="px-2 py-1 font-semibold text-ink-600">
                      {row.day}
                    </td>
                    {row.h.map((v: number, i: number) => (
                      <td key={i} className="p-0.5">
                        <div
                          className="h-7 w-10 rounded-md"
                          style={{
                            background: `rgba(58,92,255,${(v / 100).toFixed(2)})`,
                          }}
                          title={`${v}%`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI insights */}
        <div className="rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 p-6 text-white shadow-card">
          <div className="flex items-center gap-3">
            <Icon3D name="sparkles" size={56} />
            <div>
              <p className="font-display text-xl font-bold">AI Insights</p>
              <p className="text-xs text-white/80">
                Diperbarui otomatis berdasarkan data terkini
              </p>
            </div>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {insights.map((t: string, i: number) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-2xl bg-white/15 p-4 backdrop-blur-sm"
              >
                <Icon3D name="light" size={32} />
                <p className="text-sm">{t}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
