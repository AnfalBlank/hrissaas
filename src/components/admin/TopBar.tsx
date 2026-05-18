"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Search, X } from "lucide-react";
import { Icon3D, type Icon3DName } from "@/components/Icon3D";
import { ChatBell } from "@/components/admin/ChatBell";
import { api } from "@/lib/api";
import { useRealtime } from "@/lib/realtime";
import { resolveNotifLink } from "@/lib/notif-route";

const ICON_MAP: Record<string, Icon3DName> = {
  attendance: "face",
  leave: "beach",
  payroll: "payroll",
  cms: "megaphone",
  system: "rocket",
};

function timeAgo(date: any) {
  if (!date) return "";
  const ms = Date.now() - new Date(date).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j`;
  return `${Math.floor(h / 24)}h`;
}

export function TopBar({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-ink-100 bg-white/80 px-6 py-4 backdrop-blur-xl">
      <div>
        <h1 className="font-display text-xl font-extrabold leading-tight">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-ink-500">{subtitle}</p>}
      </div>
      <div className="flex flex-1 items-center justify-end gap-3">
        <GlobalSearch />
        <ChatBell />
        <NotifBell />
        {actions}
      </div>
    </header>
  );
}

/* ===================== Search ===================== */

type SearchResult = {
  type: "employee" | "branch" | "shift";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: Icon3DName;
};

function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data: employees } = useQuery({
    queryKey: ["admin-employees", ""],
    queryFn: () => api.adminEmployees(),
    enabled: open,
  });
  const { data: branches } = useQuery({
    queryKey: ["admin-branches"],
    queryFn: () => api.adminBranches(),
    enabled: open,
  });
  const { data: shifts } = useQuery({
    queryKey: ["admin-shifts"],
    queryFn: () => api.adminShifts(),
    enabled: open,
  });

  // Close on click outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const term = q.trim().toLowerCase();
  const results: SearchResult[] = [];

  if (term && employees?.items) {
    employees.items
      .filter((e: any) =>
        [e.fullName, e.employeeCode, e.division, e.position, e.userEmail]
          .filter(Boolean)
          .some((s: string) => s.toLowerCase().includes(term))
      )
      .slice(0, 8)
      .forEach((e: any) =>
        results.push({
          type: "employee",
          id: e.id,
          title: e.fullName,
          subtitle: `${e.employeeCode} · ${e.position ?? "-"} · ${e.division ?? "-"}`,
          href: `/admin/employees`,
          icon: "employee",
        })
      );
  }

  if (term && branches?.items) {
    branches.items
      .filter((b: any) =>
        [b.name, b.city]
          .filter(Boolean)
          .some((s: string) => s.toLowerCase().includes(term))
      )
      .slice(0, 5)
      .forEach((b: any) =>
        results.push({
          type: "branch",
          id: b.id,
          title: b.name,
          subtitle: `${b.city ?? ""} · ${b.employeeCount ?? 0} pegawai · radius ${b.radiusMeters}m`,
          href: `/admin/branches`,
          icon: "buildings",
        })
      );
  }

  if (term && shifts?.items) {
    shifts.items
      .filter((s: any) => s.name?.toLowerCase().includes(term))
      .slice(0, 5)
      .forEach((s: any) =>
        results.push({
          type: "shift",
          id: s.id,
          title: s.name,
          subtitle: `${s.startTime} - ${s.endTime} · toleransi ${s.graceMinutes}m`,
          href: `/admin/shifts`,
          icon: "clock",
        })
      );
  }

  return (
    <div
      ref={containerRef}
      className="relative hidden md:block w-72"
    >
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Cari pegawai, cabang, shift..."
        className="w-full rounded-2xl border border-ink-200 bg-ink-50/60 pl-9 pr-9 py-2 text-sm outline-none focus:border-brand-500 focus:bg-white"
      />
      {q && (
        <button
          onClick={() => {
            setQ("");
            setOpen(false);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:bg-ink-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {open && term && (
        <div className="absolute right-0 top-full mt-2 w-[420px] max-w-[90vw] rounded-2xl bg-white shadow-card border border-ink-100 overflow-hidden">
          {results.length === 0 ? (
            <div className="p-6 text-center text-xs text-ink-500">
              Tidak ada hasil untuk &ldquo;{term}&rdquo;
            </div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto py-2">
              {results.map((r, i) => (
                <li
                  key={`${r.type}-${r.id}-${i}`}
                  onClick={() => {
                    router.push(r.href);
                    setOpen(false);
                    setQ("");
                  }}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-ink-50"
                >
                  <Icon3D name={r.icon} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.title}</p>
                    <p className="truncate text-[11px] text-ink-500">
                      {r.subtitle}
                    </p>
                  </div>
                  <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[9px] font-bold uppercase text-ink-500">
                    {r.type}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ===================== Notif Bell ===================== */

function NotifBell() {
  const qc = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.notifications(),
    refetchInterval: 30000,
  });

  useRealtime("notification", () => refetch());

  const markAll = useMutation({
    mutationFn: () => api.notificationsReadAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markOne = useMutation({
    mutationFn: (id: string) => api.notificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const items = data?.items ?? [];
  const unread = items.filter((n: any) => !n.readAt);

  // Click outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-10 w-10 place-items-center rounded-2xl bg-white border border-ink-100 shadow-soft hover:bg-ink-50"
      >
        <Bell className="h-4 w-4" />
        {unread.length > 0 && (
          <span className="absolute right-1 top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-danger-500 px-1 text-[9px] font-bold text-white">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[90vw] rounded-2xl bg-white shadow-card border border-ink-100 overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <p className="font-display font-bold">Notifikasi</p>
            {unread.length > 0 && (
              <button
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="text-[11px] font-semibold text-brand-600 hover:underline"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>
          <ul className="max-h-[480px] divide-y divide-ink-100 overflow-y-auto">
            {items.length === 0 && (
              <li className="p-8 text-center text-sm text-ink-500">
                Tidak ada notifikasi.
              </li>
            )}
            {items.slice(0, 20).map((n: any) => {
              const isUnread = !n.readAt;
              return (
                <li
                  key={n.id}
                  onClick={() => {
                    if (isUnread) markOne.mutate(n.id);
                    setOpen(false);
                    router.push(resolveNotifLink(n, true));
                  }}
                  className={`flex cursor-pointer gap-3 p-3 transition ${
                    isUnread ? "bg-brand-50/40 hover:bg-brand-50" : "hover:bg-ink-50"
                  }`}
                >
                  <Icon3D
                    name={(ICON_MAP[n.category] ?? "bell") as Icon3DName}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{n.title}</p>
                    {n.body && (
                      <p className="line-clamp-2 text-xs text-ink-600">
                        {n.body}
                      </p>
                    )}
                    <p className="mt-0.5 text-[10px] text-ink-400">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {isUnread && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
