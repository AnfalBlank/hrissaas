"use client";

import { Bell, Search } from "lucide-react";

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
        {subtitle && (
          <p className="text-xs text-ink-500">{subtitle}</p>
        )}
      </div>
      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="relative hidden md:block w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            placeholder="Cari pegawai, laporan, cabang..."
            className="w-full rounded-2xl border border-ink-200 bg-ink-50/60 pl-9 pr-4 py-2 text-sm outline-none focus:border-brand-500 focus:bg-white"
          />
        </div>
        <button className="relative grid h-10 w-10 place-items-center rounded-2xl bg-white border border-ink-100 shadow-soft">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger-500" />
        </button>
        {actions}
      </div>
    </header>
  );
}
