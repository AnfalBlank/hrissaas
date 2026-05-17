"use client";

import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/admin/TopBar";
import { Icon3D, type Icon3DName } from "@/components/Icon3D";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { data: status } = useQuery({
    queryKey: ["system-status"],
    queryFn: () => api.adminSystemStatus(),
  });

  const SECTIONS: {
    title: string;
    desc: string;
    icon: Icon3DName;
    fields: { l: string; v: string; ok?: boolean }[];
  }[] = [
    {
      title: "Profil Perusahaan",
      desc: "Identitas & branding tenant",
      icon: "buildings",
      fields: [
        { l: "Nama", v: "PT Manggala Sejahtera" },
        { l: "Domain", v: "manggala.app" },
        { l: "Timezone", v: "Asia/Jakarta (GMT+7)" },
      ],
    },
    {
      title: "Integrasi",
      desc: "Hubungkan layanan eksternal",
      icon: "link",
      fields: [
        {
          l: "WhatsApp Cloud API",
          v: status?.whatsapp ? "Connected" : "Not configured",
          ok: status?.whatsapp,
        },
        {
          l: "Cloudflare R2 Storage",
          v: status?.r2 ? "Connected" : "Fallback (base64)",
          ok: status?.r2,
        },
        {
          l: "Socket.IO Realtime",
          v: status?.socketIO ? "Connected" : "Offline",
          ok: status?.socketIO,
        },
      ],
    },
    {
      title: "Billing & SaaS",
      desc: "Paket berlangganan & invoice",
      icon: "wallet",
      fields: [
        { l: "Paket aktif", v: "Professional" },
        { l: "Pegawai", v: "264 / 500" },
        { l: "Tagihan berikutnya", v: "20 Mei 2026" },
      ],
    },
    {
      title: "Backup & Storage",
      desc: "Cloud storage & retensi data",
      icon: "package",
      fields: [
        { l: "Database", v: "Turso libSQL" },
        { l: "Backup", v: "Otomatis (Turso replicas)" },
        { l: "Retensi audit log", v: "365 hari" },
      ],
    },
  ];

  return (
    <>
      <TopBar title="Pengaturan" subtitle="Konfigurasi sistem & tenant" />
      <div className="grid gap-4 p-6 lg:grid-cols-2">
        {SECTIONS.map((s) => (
          <div
            key={s.title}
            className="rounded-3xl bg-white p-5 shadow-card border border-ink-100"
          >
            <div className="flex items-center gap-3">
              <Icon3D name={s.icon} size={56} />
              <div>
                <p className="font-display font-bold">{s.title}</p>
                <p className="text-xs text-ink-500">{s.desc}</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {s.fields.map((f) => (
                <li
                  key={f.l}
                  className="flex items-center justify-between rounded-2xl bg-ink-50 p-3 text-sm"
                >
                  <span className="text-ink-600">{f.l}</span>
                  <div className="flex items-center gap-2">
                    {f.ok !== undefined && (
                      <Badge variant={f.ok ? "success" : "warning"}>
                        {f.ok ? "OK" : "Off"}
                      </Badge>
                    )}
                    <span className="font-semibold">{f.v}</span>
                  </div>
                </li>
              ))}
            </ul>
            <Button variant="secondary" block className="mt-4">
              Atur
            </Button>
          </div>
        ))}

        <div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 p-6 text-white shadow-card">
          <div className="flex items-center gap-3">
            <Icon3D name="rocket" size={64} />
            <div>
              <p className="font-display text-xl font-bold">
                Upgrade ke Enterprise
              </p>
              <p className="text-sm text-white/80">
                Multi tenant SaaS, custom domain, AI Analytics, dan priority
                support 24/7.
              </p>
            </div>
            <div className="ml-auto">
              <Badge className="bg-white text-brand-700">Hemat 20%</Badge>
            </div>
          </div>
          <Button className="mt-4 bg-white text-brand-700 hover:bg-white/90">
            Upgrade Sekarang
          </Button>
        </div>
      </div>
    </>
  );
}
