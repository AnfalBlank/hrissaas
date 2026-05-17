"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Icon3D, type Icon3DName } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatTime } from "@/lib/utils";
import { api } from "@/lib/api";
import { Bell, ChevronRight, MapPin } from "lucide-react";

const MENU: { href: string; label: string; icon: Icon3DName; color: string }[] =
  [
    { href: "/app/attendance", label: "Absen", icon: "face", color: "from-brand-100 to-brand-50" },
    { href: "/app/qr", label: "QR Scan", icon: "qrcode", color: "from-cyan-100 to-cyan-50" },
    { href: "/app/leave", label: "Cuti", icon: "beach", color: "from-orange-100 to-orange-50" },
    { href: "/app/overtime", label: "Lembur", icon: "fire", color: "from-rose-100 to-rose-50" },
    { href: "/app/timesheet", label: "Timesheet", icon: "stopwatch", color: "from-emerald-100 to-emerald-50" },
    { href: "/app/payroll", label: "Slip Gaji", icon: "payroll", color: "from-emerald-100 to-emerald-50" },
    { href: "/app/history", label: "Riwayat", icon: "history", color: "from-violet-100 to-violet-50" },
    { href: "/app/news", label: "Info", icon: "newspaper", color: "from-pink-100 to-pink-50" },
  ];

export default function EmployeeHome() {
  const [now, setNow] = useState<Date | null>(null);

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
  });
  const { data: attData } = useQuery({
    queryKey: ["attendance-me"],
    queryFn: () => api.attendanceMe(),
  });
  const { data: anns } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => api.announcements(),
  });

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const employee = meData?.employee;
  const branch = meData?.branch;
  const shift = meData?.shift;
  const today = attData?.today;
  const history = (attData?.history ?? []).slice(0, 5);
  const initials =
    employee?.fullName
      ?.split(" ")
      .map((s: string) => s[0])
      .slice(0, 2)
      .join("") ?? "U";

  const fmtT = (ts: any) =>
    ts ? new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="space-y-5 px-4 pb-6 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center text-white font-extrabold ring-2 ring-white">
            {employee?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={employee.avatarUrl}
                alt="avatar"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div>
            <p className="text-xs text-ink-500">Selamat datang 👋</p>
            <p className="font-display font-bold">
              {employee?.fullName ?? "Loading..."}
            </p>
          </div>
        </div>
        <Link
          href="/app/notifications"
          className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-soft border border-ink-100"
        >
          <Bell className="h-5 w-5 text-ink-700" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger-500" />
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 p-5 text-white shadow-card">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/80">{now ? formatDate(now) : "—"}</p>
            <p className="mt-1 font-display text-3xl font-extrabold tracking-tight">
              {now ? formatTime(now) : "—"}
            </p>
          </div>
          <Icon3D name="clock" size={64} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
            <p className="text-[11px] text-white/80">Check-in</p>
            <p className="font-bold">{fmtT(today?.checkInAt)}</p>
            <Badge className="mt-1 bg-white/20 text-white">
              {today?.status
                ? today.status === "late"
                  ? `Telat ${today.lateMinutes ?? 0}m`
                  : today.status === "present"
                    ? "Tepat waktu"
                    : today.status
                : "Belum"}
            </Badge>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
            <p className="text-[11px] text-white/80">Check-out</p>
            <p className="font-bold">{fmtT(today?.checkOutAt)}</p>
            <Badge className="mt-1 bg-white/20 text-white">
              {today?.checkOutAt ? "Selesai" : "Menunggu"}
            </Badge>
          </div>
        </div>
        <Link
          href="/app/attendance"
          className="mt-4 flex items-center justify-between rounded-2xl bg-white/20 px-4 py-3 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 text-sm">
            <Icon3D name="face" size={28} />
            {today?.checkInAt && !today?.checkOutAt
              ? "Check-out sekarang"
              : "Absen sekarang dengan Face ID"}
          </div>
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-card border border-ink-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon3D name="bullseye" size={48} />
            <div>
              <p className="text-xs text-ink-500">Shift hari ini</p>
              <p className="font-display font-bold">
                {shift
                  ? `${shift.name} · ${shift.startTime} — ${shift.endTime}`
                  : "Belum ditugaskan"}
              </p>
            </div>
          </div>
          <Badge variant={shift ? "success" : "default"}>
            {shift ? "Aktif" : "—"}
          </Badge>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-ink-50 p-3 text-xs text-ink-600">
          <MapPin className="h-4 w-4 text-brand-600" />
          {branch
            ? `${branch.name}${branch.city ? ` · ${branch.city}` : ""}${
                branch.address ? ` · ${branch.address}` : ""
              }`
            : "Belum ada cabang ditugaskan"}
        </div>
      </div>

      <div>
        <p className="section-title px-1">Menu Utama</p>
        <div className="mt-3 grid grid-cols-4 gap-3">
          {MENU.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex flex-col items-center gap-2 rounded-3xl bg-white p-3 shadow-soft border border-ink-100 transition active:scale-95"
            >
              <Icon3D name={m.icon} size={56} />
              <p className="text-[11px] font-medium text-ink-700 text-center">
                {m.label}
              </p>
            </Link>
          ))}
          <Link
            href="/app/chat"
            className="flex flex-col items-center gap-2 rounded-3xl bg-white p-3 shadow-soft border border-ink-100 transition active:scale-95"
          >
            <Icon3D name="chat" size={56} />
            <p className="text-[11px] font-medium text-ink-700 text-center">
              Chat HR
            </p>
          </Link>
        </div>
      </div>

      <div>
        <p className="section-title px-1">Pengumuman</p>
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {(anns?.items ?? []).slice(0, 5).map((b: any, i: number) => {
            const colors = [
              "from-brand-700 to-brand-500",
              "from-accent-600 to-accent-500",
              "from-emerald-600 to-emerald-400",
              "from-violet-600 to-violet-400",
            ];
            const icons: Icon3DName[] = ["payroll", "rocket", "beach", "megaphone"];
            return (
              <div
                key={b.id}
                className={`relative min-w-[260px] overflow-hidden rounded-3xl bg-gradient-to-br ${colors[i % colors.length]} p-4 text-white shadow-card`}
              >
                <p className="font-display text-base font-bold line-clamp-2">
                  {b.title}
                </p>
                <p className="mt-1 text-xs text-white/80 line-clamp-2">
                  {b.excerpt}
                </p>
                <div className="absolute right-2 bottom-2 opacity-90">
                  <Icon3D name={icons[i % icons.length]} size={56} />
                </div>
              </div>
            );
          })}
          {(!anns || anns.items.length === 0) && (
            <div className="min-w-[260px] rounded-3xl bg-ink-100 p-4 text-center text-xs text-ink-500">
              Belum ada pengumuman.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-card border border-ink-100">
        <div className="flex items-center justify-between">
          <p className="font-display font-bold">Riwayat Terbaru</p>
          <Link href="/app/history" className="text-xs font-semibold text-brand-600">
            Lihat semua
          </Link>
        </div>
        <ul className="mt-3 space-y-3">
          {history.length === 0 && (
            <li className="rounded-2xl bg-ink-50 p-3 text-xs text-ink-500 text-center">
              Belum ada riwayat absensi.
            </li>
          )}
          {history.map((r: any) => {
            const variant: any =
              r.status === "present" ? "success" :
              r.status === "late" ? "warning" :
              r.status === "leave" || r.status === "sick" ? "brand" : "default";
            const label =
              r.status === "present" ? "Tepat Waktu" :
              r.status === "late" ? `Telat ${r.lateMinutes}m` :
              r.status;
            return (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-2xl bg-ink-50 p-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-xs font-bold text-ink-700 shadow-soft">
                    {new Date(r.date).toLocaleDateString("id-ID", { weekday: "short" })}
                  </div>
                  <Badge variant={variant}>{label}</Badge>
                </div>
                <span className="font-mono text-ink-700">
                  {fmtT(r.checkInAt)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
