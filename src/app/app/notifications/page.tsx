"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { PageHeader } from "@/components/employee/PageHeader";
import { Icon3D, type Icon3DName } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { useRealtime } from "@/lib/realtime";
import { resolveNotifLink } from "@/lib/notif-route";
import { CheckCheck, Trash2 } from "lucide-react";

const ICON_MAP: Record<string, Icon3DName> = {
  attendance: "face",
  leave: "beach",
  payroll: "payroll",
  cms: "megaphone",
  system: "rocket",
};

const FILTERS = [
  { k: "all", label: "Semua" },
  { k: "unread", label: "Belum dibaca" },
  { k: "attendance", label: "Absensi" },
  { k: "leave", label: "Cuti" },
  { k: "payroll", label: "Payroll" },
  { k: "system", label: "Sistem" },
];

function timeAgo(date: any) {
  if (!date) return "";
  const ms = Date.now() - new Date(date).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}

export default function NotificationsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.notifications(),
  });

  useRealtime("notification", () =>
    qc.invalidateQueries({ queryKey: ["notifications"] })
  );

  const markOne = useMutation({
    mutationFn: (id: string) => api.notificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAll = useMutation({
    mutationFn: () => api.notificationsReadAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const deleteOne = useMutation({
    mutationFn: (id: string) => api.notificationDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const clearRead = useMutation({
    mutationFn: () => api.notificationsClear("read"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const all = data?.items ?? [];
  const items =
    filter === "all"
      ? all
      : filter === "unread"
        ? all.filter((n: any) => !n.readAt)
        : all.filter((n: any) => n.category === filter);
  const unreadCount = all.filter((n: any) => !n.readAt).length;

  return (
    <div className="px-4 pt-4">
      <PageHeader
        title="Notifikasi"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} belum dibaca`
            : "Semua sudah dibaca"
        }
        right={
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-brand-600 border border-ink-100 shadow-soft"
              >
                <CheckCheck className="h-3 w-3" /> Tandai semua
              </button>
            )}
            {all.length > 0 && all.some((n: any) => n.readAt) && (
              <button
                onClick={() => {
                  if (confirm("Hapus semua notifikasi yang sudah dibaca?")) {
                    clearRead.mutate();
                  }
                }}
                disabled={clearRead.isPending}
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-danger-600 border border-ink-100 shadow-soft"
              >
                <Trash2 className="h-3 w-3" /> Bersihkan
              </button>
            )}
          </div>
        }
      />

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {FILTERS.map((t) => (
          <button
            key={t.k}
            onClick={() => setFilter(t.k)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === t.k
                ? "bg-brand-600 text-white"
                : "bg-white text-ink-600 border border-ink-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ul className="mt-3 space-y-2">
        {items.length === 0 && (
          <li className="rounded-2xl bg-white p-6 text-center text-sm text-ink-500 shadow-soft border border-ink-100">
            {filter === "unread"
              ? "Tidak ada yang belum dibaca."
              : "Belum ada notifikasi."}
          </li>
        )}
        {items.map((n: any) => {
          const unread = !n.readAt;
          return (
            <li
              key={n.id}
              className={`group relative flex gap-3 rounded-2xl p-3 shadow-soft border transition ${
                unread
                  ? "bg-brand-50/60 border-brand-100"
                  : "bg-white border-ink-100"
              }`}
            >
              <button
                onClick={() => {
                  if (unread) markOne.mutate(n.id);
                  router.push(resolveNotifLink(n, false));
                }}
                className="flex flex-1 gap-3 text-left active:scale-[0.99]"
              >
                <Icon3D
                  name={(ICON_MAP[n.category] ?? n.icon ?? "bell") as Icon3DName}
                  size={48}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold">{n.title}</p>
                    {unread && <Badge variant="brand">Baru</Badge>}
                  </div>
                  {n.body && (
                    <p className="mt-0.5 text-xs text-ink-600 whitespace-pre-line">
                      {n.body}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-ink-400">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteOne.mutate(n.id);
                }}
                className="rounded-lg p-1.5 text-ink-400 hover:bg-danger-50 hover:text-danger-600 self-start"
                title="Hapus"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
