"use client";

import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/admin/TopBar";
import { Icon3D, type Icon3DName } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";

const TOGGLES: { l: string; d: string; v: boolean; i: Icon3DName }[] = [
  { l: "Validasi GPS Wajib", d: "Geofence per branch (haversine)", v: true, i: "satellite" },
  { l: "Liveness Detection", d: "AI face recognition + anti-spoof", v: true, i: "face" },
  { l: "Rate Limiting", d: "Cegah brute force login", v: true, i: "bolt" },
  { l: "Audit Log", d: "Catat semua aktivitas penting", v: true, i: "scroll" },
  { l: "JWT httpOnly Cookie", d: "Session cookie aman", v: true, i: "lock" },
  { l: "Multi-tenant Isolation", d: "Query filter by companyId", v: true, i: "shield" },
  { l: "Password bcrypt", d: "Hashing 10 rounds", v: true, i: "key" },
  { l: "Anti Mock GPS", d: "Cek akurasi & pola koordinat", v: false, i: "warning" },
];

const ACTION_ICON: Record<string, { icon: Icon3DName; variant: "success" | "danger" | "warning" | "default" | "brand" }> =
  {
    "auth.login.success": { icon: "check", variant: "success" },
    "auth.login.failed": { icon: "warning", variant: "danger" },
    "attendance.check_in.success": { icon: "face", variant: "success" },
    "attendance.check_in.qr": { icon: "qrcode", variant: "success" },
    "attendance.check_in.rejected": { icon: "cross", variant: "danger" },
  };

const ACTION_LABEL: Record<string, string> = {
  "auth.login.success": "Login berhasil",
  "auth.login.failed": "Login gagal",
  "attendance.check_in.success": "Check-in",
  "attendance.check_in.qr": "Check-in via QR",
  "attendance.check_in.rejected": "Check-in ditolak",
};

function timeAgo(date: any) {
  if (!date) return "";
  const ms = Date.now() - new Date(date).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  return `${Math.floor(h / 24)}h lalu`;
}

export default function SecurityPage() {
  const { data } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => api.adminAuditLogs(),
    refetchInterval: 30_000,
  });

  const logs = data?.items ?? [];

  return (
    <>
      <TopBar title="Keamanan" subtitle="Fraud detection & audit logs" />
      <div className="space-y-4 p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-5 shadow-card border border-ink-100">
            <div className="flex items-center gap-3">
              <Icon3D name="shield" size={56} />
              <div>
                <p className="font-display font-bold">Fitur Keamanan Aktif</p>
                <p className="text-xs text-ink-500">
                  Konfigurasi sistem saat ini
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {TOGGLES.map((t) => (
                <li
                  key={t.l}
                  className="flex items-center gap-3 rounded-2xl bg-ink-50 p-3"
                >
                  <Icon3D name={t.i} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{t.l}</p>
                    <p className="text-[11px] text-ink-500">{t.d}</p>
                  </div>
                  <span
                    className={`relative h-6 w-11 rounded-full transition ${
                      t.v ? "bg-success-500" : "bg-ink-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        t.v ? "left-5" : "left-0.5"
                      }`}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-card border border-ink-100">
            <div className="flex items-center gap-3">
              <Icon3D name="scroll" size={56} />
              <div>
                <p className="font-display font-bold">Audit Logs</p>
                <p className="text-xs text-ink-500">
                  {data?.totalToday ?? 0} event hari ini · auto-refresh 30s
                </p>
              </div>
            </div>
            <ul className="mt-4 max-h-[480px] space-y-2 overflow-y-auto pr-1">
              {logs.length === 0 && (
                <li className="rounded-2xl bg-ink-50 p-6 text-center text-xs text-ink-500">
                  Belum ada aktivitas tercatat.
                </li>
              )}
              {logs.map((l: any) => {
                const meta = ACTION_ICON[l.action] ?? {
                  icon: "scroll" as Icon3DName,
                  variant: "default" as const,
                };
                return (
                  <li
                    key={l.id}
                    className="flex items-center gap-3 rounded-2xl bg-ink-50 p-3"
                  >
                    <Icon3D name={meta.icon} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {ACTION_LABEL[l.action] ?? l.action}
                      </p>
                      <p className="truncate text-[11px] text-ink-500">
                        {l.userEmail ?? "system"}
                        {l.ip ? ` · ${l.ip}` : ""}
                      </p>
                    </div>
                    <Badge variant={meta.variant as any}>
                      {timeAgo(l.createdAt)}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
