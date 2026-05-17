"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon3D, type Icon3DName } from "@/components/Icon3D";
import { cn } from "@/lib/utils";

const ITEMS: { href: string; label: string; icon: Icon3DName }[] = [
  { href: "/app", label: "Home", icon: "house" },
  { href: "/app/history", label: "Riwayat", icon: "history" },
  { href: "/app/attendance", label: "", icon: "face" },
  { href: "/app/notifications", label: "Inbox", icon: "bell" },
  { href: "/app/profile", label: "Akun", icon: "employee" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-3 pb-3 safe-bottom">
      <div className="relative flex items-end justify-between rounded-3xl bg-white/85 px-4 pt-2 pb-2 shadow-card backdrop-blur-xl border border-ink-100">
        {ITEMS.map((it, idx) => {
          const isCenter = idx === 2;
          const active =
            pathname === it.href ||
            (it.href !== "/app" && pathname.startsWith(it.href));
          if (isCenter) {
            return (
              <Link
                key={it.href}
                href={it.href}
                className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow ring-4 ring-white animate-pulseSoft"
              >
                <Icon3D name={it.icon} size={36} />
              </Link>
            );
          }
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-1 text-[11px]",
                active ? "text-brand-700" : "text-ink-400"
              )}
            >
              <Icon3D name={it.icon} size={28} />
              <span className="font-medium">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
