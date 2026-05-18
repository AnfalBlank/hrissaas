"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { api } from "@/lib/api";
import { useRealtime } from "@/lib/realtime";

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

export function ChatBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, refetch } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.conversations(),
    refetchInterval: 30_000,
  });

  useRealtime("conv:message", () => refetch());

  const items = data?.items ?? [];

  // unread = punya last message yang lebih baru dari lastReadAt
  const isUnread = (c: any) =>
    c.lastMessageAt &&
    (!c.lastReadAt ||
      new Date(c.lastMessageAt).getTime() >
        new Date(c.lastReadAt).getTime());
  const unreadCount = items.filter(isUnread).length;

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
        title="Chat"
      >
        <MessageSquare className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[90vw] rounded-2xl bg-white shadow-card border border-ink-100 overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <p className="font-display font-bold">Pesan</p>
            <button
              onClick={() => {
                setOpen(false);
                router.push("/app/chat");
              }}
              className="text-[11px] font-semibold text-brand-600 hover:underline"
            >
              Buka semua
            </button>
          </div>
          <ul className="max-h-[480px] divide-y divide-ink-100 overflow-y-auto">
            {items.length === 0 && (
              <li className="p-8 text-center text-sm text-ink-500">
                Belum ada percakapan.
              </li>
            )}
            {items.slice(0, 10).map((c: any) => {
              const other = c.otherParticipants?.[0];
              const initials =
                other?.name
                  ?.split(" ")
                  .map((s: string) => s[0])
                  .slice(0, 2)
                  .join("") ?? "?";
              const unread = isUnread(c);
              return (
                <li
                  key={c.id}
                  onClick={() => {
                    setOpen(false);
                    router.push("/app/chat");
                  }}
                  className={`flex cursor-pointer items-center gap-3 p-3 transition ${
                    unread
                      ? "bg-brand-50/40 hover:bg-brand-50"
                      : "hover:bg-ink-50"
                  }`}
                >
                  <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-brand-100 text-xs font-bold text-brand-700">
                    {other?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={other.avatarUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">
                        {other?.name ?? "User"}
                      </p>
                      <span className="shrink-0 text-[10px] text-ink-400">
                        {timeAgo(c.lastMessageAt)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-ink-500">
                      {c.lastMessageText ?? "—"}
                    </p>
                  </div>
                  {unread && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />
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
