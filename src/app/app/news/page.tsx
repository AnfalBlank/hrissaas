"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/employee/PageHeader";
import { Icon3D, type Icon3DName } from "@/components/Icon3D";
import { api } from "@/lib/api";

const TYPE_ICON: Record<string, { icon: Icon3DName; color: string }> = {
  banner: { icon: "ticket", color: "from-rose-200 to-rose-50" },
  article: { icon: "graduationCap", color: "from-cyan-200 to-cyan-50" },
  announcement: { icon: "scroll", color: "from-amber-200 to-amber-50" },
  promo: { icon: "party", color: "from-violet-200 to-violet-50" },
};

const FILTERS = ["Semua", "announcement", "promo", "article", "banner"];
const FILTER_LABEL: Record<string, string> = {
  Semua: "Semua",
  announcement: "Pengumuman",
  promo: "Promo",
  article: "Artikel",
  banner: "Banner",
};

export default function NewsPage() {
  const [filter, setFilter] = useState("Semua");
  const { data } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => api.announcements(),
  });

  const all = (data?.items ?? []).filter((i: any) => i.status === "live");
  const banners = all.filter((i: any) => i.type === "banner");
  const items = all.filter(
    (i: any) => filter === "Semua" || i.type === filter
  );

  return (
    <div className="px-4 pt-4">
      <PageHeader title="Informasi" subtitle="Berita & pengumuman" />

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === f
                ? "bg-brand-600 text-white"
                : "bg-white text-ink-600 border border-ink-100"
            }`}
          >
            {FILTER_LABEL[f]}
          </button>
        ))}
      </div>

      {/* Banner carousel */}
      {banners.length > 0 && filter === "Semua" && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
          {banners.map((b: any) => (
            <div
              key={b.id}
              className="relative min-w-[85%] snap-center overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-violet-600 p-5 text-white shadow-card"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              {b.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={b.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-20"
                />
              )}
              <div className="relative">
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                  {b.category ?? "Banner"}
                </span>
                <p className="mt-2 font-display text-lg font-extrabold leading-tight">
                  {b.title}
                </p>
                {b.excerpt && (
                  <p className="mt-1 text-xs text-white/80">{b.excerpt}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-3">
        {items.length === 0 && (
          <div className="rounded-3xl bg-white p-6 text-center text-sm text-ink-500 shadow-soft border border-ink-100">
            Belum ada konten.
          </div>
        )}
        {items.map((a: any) => {
          const meta = TYPE_ICON[a.type] ?? TYPE_ICON.article;
          return (
            <article
              key={a.id}
              className="overflow-hidden rounded-3xl bg-white shadow-soft border border-ink-100"
            >
              <div
                className={`flex items-center justify-between bg-gradient-to-br ${meta.color} p-4`}
              >
                <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold text-ink-700">
                  {a.category ?? FILTER_LABEL[a.type] ?? a.type}
                </span>
                <Icon3D name={meta.icon} size={56} />
              </div>
              <div className="p-4">
                <p className="font-display font-bold">{a.title}</p>
                {a.excerpt && (
                  <p className="mt-1 text-xs text-ink-500">{a.excerpt}</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
