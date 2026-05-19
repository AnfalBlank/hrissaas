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
    "auth.login.blocked": { icon: "lock", variant: "danger" },
    "attendance.check_in.success": { icon: "face", variant: "success" },
    "attendance.check_in.qr": { icon: "qrcode", variant: "success" },
    "attendance.check_in.rejected": { icon: "cross", variant: "danger" },
    "attendance.manual_correction": { icon: "memo", variant: "warning" },
    "leave.approved": { icon: "check", variant: "success" },
    "leave.rejected": { icon: "cross", variant: "danger" },
    "overtime.approved": { icon: "check", variant: "success" },
    "overtime.rejected": { icon: "cross", variant: "danger" },
    "payroll.generate": { icon: "payroll", variant: "brand" },
    "payroll.approved": { icon: "check", variant: "success" },
    "payroll.approve": { icon: "check", variant: "success" },
    "payroll.paid": { icon: "payroll", variant: "success" },
    "payroll.delete": { icon: "warning", variant: "danger" },
    "payroll.thr.generate": { icon: "party", variant: "brand" },
    "payroll.settings.update": { icon: "gear", variant: "warning" },
    "payroll.component.create": { icon: "receipt", variant: "default" },
    "payroll.component.delete": { icon: "warning", variant: "warning" },
    "payroll.component.bulkCreate": { icon: "people", variant: "brand" },
    "payroll.buktiPotong.download": { icon: "scroll", variant: "default" },
    "employee.create": { icon: "people", variant: "success" },
    "employee.update": { icon: "memo", variant: "default" },
    "employee.delete": { icon: "warning", variant: "danger" },
    "employee.resign": { icon: "warning", variant: "warning" },
    "branch.create": { icon: "buildings", variant: "success" },
    "branch.update": { icon: "memo", variant: "default" },
    "branch.delete": { icon: "warning", variant: "danger" },
    "shift.create": { icon: "calendar", variant: "success" },
    "shift.update": { icon: "memo", variant: "default" },
    "shift.delete": { icon: "warning", variant: "danger" },
    "holiday.create": { icon: "party", variant: "success" },
    "holiday.delete": { icon: "warning", variant: "danger" },
    "announcement.create": { icon: "newspaper", variant: "success" },
    "announcement.update": { icon: "memo", variant: "default" },
    "announcement.delete": { icon: "warning", variant: "danger" },
    "company.update": { icon: "buildings", variant: "warning" },
    "profile.password.changed": { icon: "key", variant: "success" },
    "profile.password.failed": { icon: "warning", variant: "danger" },
    "profile.bank.changed": { icon: "wallet", variant: "warning" },
  };

const ACTION_LABEL: Record<string, string> = {
  "auth.login.success": "Login berhasil",
  "auth.login.failed": "Login gagal",
  "auth.login.blocked": "Login diblokir (rate limit)",
  "attendance.check_in.success": "Check-in",
  "attendance.check_in.qr": "Check-in via QR",
  "attendance.check_in.rejected": "Check-in ditolak",
  "attendance.manual_correction": "Koreksi manual absensi",
  "leave.approved": "Cuti disetujui",
  "leave.rejected": "Cuti ditolak",
  "overtime.approved": "Lembur disetujui",
  "overtime.rejected": "Lembur ditolak",
  "payroll.generate": "Generate payroll",
  "payroll.approved": "Payroll disetujui",
  "payroll.approve": "Payroll disetujui",
  "payroll.paid": "Payroll dibayar",
  "payroll.delete": "Payroll dihapus",
  "payroll.thr.generate": "Generate THR",
  "payroll.settings.update": "Update pengaturan payroll",
  "payroll.component.create": "Tambah komponen payroll",
  "payroll.component.delete": "Hapus komponen payroll",
  "payroll.component.bulkCreate": "Bulk add komponen payroll",
  "payroll.buktiPotong.download": "Download bukti potong",
  "employee.create": "Tambah pegawai",
  "employee.update": "Update pegawai",
  "employee.delete": "Hapus pegawai",
  "employee.resign": "Pegawai resign",
  "branch.create": "Tambah cabang",
  "branch.update": "Update cabang",
  "branch.delete": "Hapus cabang",
  "shift.create": "Tambah shift",
  "shift.update": "Update shift",
  "shift.delete": "Hapus shift",
  "holiday.create": "Tambah hari libur",
  "holiday.delete": "Hapus hari libur",
  "announcement.create": "Buat pengumuman",
  "announcement.update": "Update pengumuman",
  "announcement.delete": "Hapus pengumuman",
  "company.update": "Update profil perusahaan",
  "profile.password.changed": "Ganti password",
  "profile.password.failed": "Ganti password gagal",
  "profile.bank.changed": "Update info bank",
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
