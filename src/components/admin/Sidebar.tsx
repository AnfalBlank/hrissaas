"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Icon3D, type Icon3DName } from "@/components/Icon3D";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const NAV: {
  group: string;
  items: { href: string; label: string; icon: Icon3DName }[];
}[] = [
  {
    group: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: "chart" },
      { href: "/admin/live", label: "Live Monitoring", icon: "satellite" },
      { href: "/admin/analytics", label: "AI Analytics", icon: "sparkles" },
    ],
  },
  {
    group: "Manajemen",
    items: [
      { href: "/admin/employees", label: "Pegawai", icon: "people" },
      { href: "/admin/attendance", label: "Absensi", icon: "face" },
      { href: "/admin/timesheet", label: "Timesheet", icon: "stopwatch" },
      { href: "/admin/overtime", label: "Lembur", icon: "fire" },
      { href: "/admin/leave", label: "Cuti", icon: "beach" },
      { href: "/admin/leave-quotas", label: "Kuota Cuti", icon: "calendar" },
      { href: "/admin/shifts", label: "Shift", icon: "clock" },
      { href: "/admin/holidays", label: "Hari Libur", icon: "party" },
    ],
  },
  {
    group: "Payroll",
    items: [
      { href: "/admin/payroll", label: "Generate Payroll", icon: "payroll" },
      { href: "/admin/payroll-components", label: "Komponen Tambahan", icon: "wallet" },
      { href: "/admin/payroll-settings", label: "Pengaturan Payroll", icon: "gear" },
    ],
  },
  {
    group: "Konfigurasi",
    items: [
      { href: "/admin/branches", label: "Cabang & GPS", icon: "buildings" },
      { href: "/admin/cms", label: "CMS", icon: "newspaper" },
      { href: "/admin/notifications", label: "Notifikasi", icon: "bell" },
      { href: "/admin/security", label: "Keamanan", icon: "shield" },
      { href: "/admin/settings", label: "Pengaturan", icon: "gear" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
    staleTime: 5 * 60 * 1000, // 5 menit cache
  });

  const user = meData?.user;
  const employee = meData?.employee;
  const avatarUrl = employee?.avatarUrl;
  const fullName = employee?.fullName ?? user?.email?.split("@")[0] ?? "Admin";
  const initials = fullName
    .split(" ")
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const roleLabel =
    user?.role === "super_admin"
      ? "Super Admin"
      : user?.role === "owner"
        ? "Owner"
        : user?.role === "hr"
          ? "HR Manager"
          : user?.role === "supervisor"
            ? "Supervisor"
            : "Admin";

  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-0 flex h-screen flex-col border-r border-ink-100 bg-white">
        <div className="flex h-16 items-center gap-2 border-b border-ink-100 px-5">
          <Logo size={36} />
          <div>
            <p className="font-display text-sm font-extrabold leading-tight">
              Manggala
            </p>
            <p className="text-[10px] text-ink-400">Admin Console</p>
          </div>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {NAV.map((g) => (
            <div key={g.group}>
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-ink-400">
                {g.group}
              </p>
              <ul className="space-y-1">
                {g.items.map((it) => {
                  const active =
                    pathname === it.href ||
                    (it.href !== "/admin" && pathname.startsWith(it.href));
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition",
                          active
                            ? "bg-brand-50 text-brand-700"
                            : "text-ink-600 hover:bg-ink-50"
                        )}
                      >
                        <Icon3D name={it.icon} size={28} />
                        {it.label}
                        {active && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-600" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-ink-100 p-3">
          <div className="flex items-center gap-3 rounded-2xl bg-ink-50 p-3">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={fullName}
                className="h-10 w-10 rounded-xl object-cover"
              />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-sm font-bold text-white">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{fullName}</p>
              <p className="truncate text-[10px] text-ink-500">{roleLabel}</p>
            </div>
            <Link
              href="/login"
              className="rounded-lg p-2 text-ink-400 hover:bg-white"
              title="Logout"
            >
              <Icon3D name="key" size={20} />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
