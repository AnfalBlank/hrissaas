"use client";

import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/admin/TopBar";
import { Icon3D, type Icon3DName } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Plus } from "lucide-react";

const TEMPLATES: {
  trigger: string;
  channel: string[];
  active: boolean;
  icon: Icon3DName;
}[] = [
  { trigger: "Pengingat absen pagi", channel: ["WA", "Push"], active: true, icon: "clock" },
  { trigger: "Telat masuk", channel: ["WA", "Push"], active: true, icon: "warning" },
  { trigger: "Lupa absen pulang", channel: ["WA", "Push"], active: true, icon: "bell" },
  { trigger: "Cuti disetujui / ditolak", channel: ["WA", "Push"], active: true, icon: "check" },
  { trigger: "Slip gaji siap", channel: ["WA", "Push"], active: true, icon: "payroll" },
  { trigger: "Pengingat shift", channel: ["Push"], active: false, icon: "calendar" },
];

export default function NotificationsAdmin() {
  const { data } = useQuery({
    queryKey: ["system-status"],
    queryFn: () => api.adminSystemStatus(),
  });

  const channels = [
    {
      l: "WhatsApp Cloud API",
      ok: data?.whatsapp,
      i: "chat" as Icon3DName,
      hint: data?.whatsapp ? "Terkonfigurasi" : "Mock mode (set WHATSAPP_TOKEN)",
    },
    {
      l: "Push Notification",
      ok: !!data?.socketIO,
      i: "bell" as Icon3DName,
      hint: data?.socketIO ? "Socket.IO aktif" : "Realtime offline",
    },
    {
      l: "Email SMTP",
      ok: false,
      i: "envelope" as Icon3DName,
      hint: "Belum dikonfigurasi",
    },
  ];

  return (
    <>
      <TopBar
        title="Notifikasi"
        subtitle="WhatsApp, Push & Email otomatis"
        actions={
          <Button>
            <Plus className="h-4 w-4" /> Template Baru
          </Button>
        }
      />
      <div className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {channels.map((s) => (
            <div
              key={s.l}
              className="rounded-3xl bg-white p-5 shadow-card border border-ink-100"
            >
              <div className="flex items-center gap-3">
                <Icon3D name={s.i} size={56} />
                <div>
                  <p className="font-display font-bold">{s.l}</p>
                  <Badge variant={s.ok ? "success" : "warning"}>
                    {s.ok ? "Aktif" : "Mock"}
                  </Badge>
                </div>
              </div>
              <p className="mt-3 text-xs text-ink-500">{s.hint}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-card border border-ink-100">
          <div className="border-b border-ink-100 px-5 py-4">
            <p className="font-display font-bold">Template Notifikasi</p>
          </div>
          <ul className="divide-y divide-ink-100">
            {TEMPLATES.map((t, i) => (
              <li key={i} className="flex items-center gap-4 p-5">
                <Icon3D name={t.icon} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{t.trigger}</p>
                  <div className="mt-1 flex gap-1.5">
                    {t.channel.map((c) => (
                      <Badge key={c} variant="brand">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
                <span
                  className={`relative h-6 w-11 rounded-full transition ${
                    t.active ? "bg-brand-600" : "bg-ink-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      t.active ? "left-5" : "left-0.5"
                    }`}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
