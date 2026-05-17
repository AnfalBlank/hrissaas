"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/admin/TopBar";
import { Icon3D, type Icon3DName } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { useRealtime } from "@/lib/realtime";

const LiveMap = dynamic(
  () => import("@/components/admin/LiveMap").then((m) => m.LiveMap),
  { ssr: false, loading: () => <MapSkeleton /> }
);

function MapSkeleton() {
  return (
    <div className="grid h-full place-items-center bg-gradient-to-br from-brand-50 to-cyan-50">
      <div className="text-sm text-ink-500">Memuat peta...</div>
    </div>
  );
}

type FeedItem = {
  id: string;
  name: string;
  detail: string;
  time: string;
  icon: Icon3DName;
};

export default function LivePage() {
  const qc = useQueryClient();
  const { data, refetch } = useQuery({
    queryKey: ["admin-live"],
    queryFn: () => api.adminLive(),
    refetchInterval: 30_000,
  });

  const [liveFeed, setLiveFeed] = useState<FeedItem[]>([]);

  useEffect(() => {
    if (!data?.feed) return;
    setLiveFeed(
      data.feed.slice(0, 30).map((it: any) => ({
        id: it.id,
        name: it.name ?? "-",
        detail:
          (it.status === "late"
            ? `Telat ${it.lateMinutes ?? 0}m`
            : "Check-in") + ` · ${it.branchName ?? "-"}`,
        time: it.checkInAt
          ? new Date(it.checkInAt).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
        icon:
          it.status === "late"
            ? "warning"
            : it.method === "qr"
              ? "qrcode"
              : "face",
      }))
    );
  }, [data?.feed]);

  const { connected } = useRealtime<any>("attendance:check-in", (payload) => {
    refetch();
    setLiveFeed((prev) =>
      [
        {
          id: payload.attendance.id,
          name: payload.employee.fullName,
          detail:
            (payload.status === "late"
              ? `Telat ${payload.lateMinutes}m`
              : "Check-in") + " · baru saja",
          time: new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          icon: payload.status === "late" ? "warning" : "face",
        } as FeedItem,
        ...prev,
      ].slice(0, 30)
    );
  });

  useRealtime<any>("attendance:check-out", () => refetch());
  useRealtime<any>("leave:applied", () => refetch());

  const branches = data?.branches ?? [];
  const employees = data?.employees ?? [];
  const stats = data?.stats ?? { present: 0, late: 0, total: 0 };

  return (
    <>
      <TopBar
        title="Live Tracking"
        subtitle="Realtime attendance & employee map"
      />
      <div className="grid gap-4 p-6 lg:grid-cols-3">
        {/* Map */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl shadow-card border border-ink-100 min-h-[560px]">
          <LiveMap branches={branches} employees={employees} />

          <div className="pointer-events-none absolute left-4 top-4 z-[1000]">
            <Badge
              variant={connected ? "success" : "default"}
              className="pointer-events-auto"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  connected ? "animate-pulse bg-success-500" : "bg-ink-400"
                }`}
              />
              {connected ? "LIVE" : "Connecting..."}
            </Badge>
          </div>

          <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] grid grid-cols-3 gap-2">
            {[
              { l: "Check-in", v: stats.present, i: "check" as Icon3DName },
              { l: "Telat", v: stats.late, i: "warning" as Icon3DName },
              { l: "Total", v: stats.total, i: "people" as Icon3DName },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-2xl bg-white/95 px-3 py-2 shadow-soft backdrop-blur"
              >
                <div className="flex items-center gap-2">
                  <Icon3D name={s.i} size={28} />
                  <div>
                    <p className="text-[10px] text-ink-500">{s.l}</p>
                    <p className="text-sm font-bold">{s.v}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-card border border-ink-100">
          <div className="flex items-center justify-between">
            <p className="font-display font-bold">Live Activity Feed</p>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-success-600">
              <span
                className={`h-2 w-2 rounded-full ${
                  connected ? "animate-pulse bg-success-500" : "bg-ink-400"
                }`}
              />
              {connected ? "Streaming" : "Offline"}
            </span>
          </div>
          <ul className="mt-3 max-h-[500px] space-y-2 overflow-y-auto pr-1">
            {liveFeed.length === 0 && (
              <li className="rounded-2xl bg-ink-50 p-6 text-center text-xs text-ink-500">
                Menunggu aktivitas...
              </li>
            )}
            {liveFeed.map((f, i) => (
              <li
                key={`${f.id}-${i}`}
                className="flex items-center gap-3 rounded-2xl bg-ink-50 p-3 animate-slide-up"
              >
                <Icon3D name={f.icon} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{f.name}</p>
                  <p className="truncate text-[11px] text-ink-500">
                    {f.detail}
                  </p>
                </div>
                <span className="font-mono text-xs text-ink-500">{f.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
