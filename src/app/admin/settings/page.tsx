"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { TopBar } from "@/components/admin/TopBar";
import { Icon3D, type Icon3DName } from "@/components/Icon3D";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import { Pencil } from "lucide-react";

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data: status } = useQuery({
    queryKey: ["system-status"],
    queryFn: () => api.adminSystemStatus(),
  });
  const { data: companyData } = useQuery({
    queryKey: ["admin-company"],
    queryFn: () => api.adminCompany(),
  });
  const company = companyData?.company;

  const [editOpen, setEditOpen] = useState(false);

  const SECTIONS: {
    title: string;
    desc: string;
    icon: Icon3DName;
    href?: string;
    onEdit?: () => void;
    fields: { l: string; v: string; ok?: boolean }[];
  }[] = [
    {
      title: "Profil Perusahaan",
      desc: "Identitas & branding tenant",
      icon: "buildings",
      onEdit: () => setEditOpen(true),
      fields: [
        { l: "Nama", v: company?.name ?? "—" },
        { l: "Slug", v: company?.slug ?? "—" },
        { l: "Domain", v: company?.domain ?? "—" },
        { l: "Plan", v: company?.plan ?? "—" },
        { l: "Timezone", v: company?.timezone ?? "Asia/Jakarta" },
      ],
    },
    {
      title: "Pengaturan Payroll",
      desc: "Rate, BPJS, lembur, THR, TER",
      icon: "payroll",
      href: "/admin/payroll-settings",
      fields: [
        { l: "PPh 21", v: "TER PMK 168/2023" },
        { l: "BPJS lengkap", v: "Kesehatan + JHT + JP + JKK + JKM" },
        { l: "Lembur", v: "Permenaker 102/2004" },
      ],
    },
    {
      title: "Hari Libur",
      desc: "Kalender libur & weekend",
      icon: "party",
      href: "/admin/holidays",
      fields: [
        { l: "Auto-detect", v: "Hari Minggu" },
        { l: "Manual", v: "Libur nasional & cuti bersama" },
      ],
    },
    {
      title: "Cabang & GPS",
      desc: "Lokasi kantor + radius geofence",
      icon: "buildings",
      href: "/admin/branches",
      fields: [
        { l: "Validasi GPS", v: "Haversine distance" },
        { l: "QR Dynamic", v: "Token JWT 60 detik" },
      ],
    },
    {
      title: "Komponen Payroll",
      desc: "Allowance, bonus, potongan tetap",
      icon: "receipt",
      href: "/admin/payroll-components",
      fields: [
        { l: "Bulk Add", v: "Per divisi atau semua" },
        { l: "Recurring", v: "Bulanan otomatis" },
      ],
    },
    {
      title: "Integrasi Eksternal",
      desc: "Hubungkan layanan eksternal",
      icon: "link",
      fields: [
        {
          l: "WhatsApp Cloud API",
          v: status?.whatsapp ? "Connected" : "Not configured",
          ok: status?.whatsapp,
        },
        {
          l: "Telegram Bot",
          v: status?.telegram ? "Connected" : "Not configured",
          ok: status?.telegram,
        },
        {
          l: "Cloudflare R2",
          v: status?.r2 ? "Connected" : "Fallback (base64)",
          ok: status?.r2,
        },
        {
          l: "Socket.IO Realtime",
          v: status?.socketIO ? "Connected" : "Polling mode",
          ok: status?.socketIO,
        },
      ],
    },
    {
      title: "Keamanan",
      desc: "Audit log & kontrol akses",
      icon: "shield",
      href: "/admin/security",
      fields: [
        { l: "JWT Auth", v: "HS256 + httpOnly cookie" },
        { l: "Rate Limit", v: "5 fail / 15 menit · 30m lock" },
        { l: "Audit log", v: "Login, payroll, leave, koreksi" },
      ],
    },
    {
      title: "CMS Konten",
      desc: "Banner, artikel, pengumuman",
      icon: "newspaper",
      href: "/admin/cms",
      fields: [
        { l: "Banner", v: "Tampil di home pegawai" },
        { l: "Artikel", v: "Multi-kategori" },
      ],
    },
  ];

  return (
    <>
      <TopBar
        title="Pengaturan"
        subtitle="Konfigurasi sistem & tenant"
      />
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
            {s.href && (
              <Link href={s.href} className="block mt-4">
                <Button variant="secondary" block>
                  Buka Pengaturan
                </Button>
              </Link>
            )}
            {s.onEdit && (
              <Button
                variant="secondary"
                block
                className="mt-4"
                onClick={s.onEdit}
              >
                <Pencil className="h-4 w-4" /> Edit Profil
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Plan info + upgrade CTA */}
      <div className="mx-6 mb-6 rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 p-6 text-white shadow-card">
        <div className="flex items-center gap-4">
          <Icon3D name="rocket" size={64} />
          <div className="flex-1">
            <p className="font-display text-xl font-bold">
              Plan: {company?.plan?.charAt(0).toUpperCase()}{company?.plan?.slice(1) ?? "Professional"}
            </p>
            <p className="text-sm text-white/80">
              {company?.plan === "enterprise"
                ? "Anda sudah di plan tertinggi. Nikmati semua fitur tanpa batas."
                : "Upgrade ke Enterprise untuk multi-tenant SaaS, custom domain, AI Analytics, dan priority support 24/7."}
            </p>
          </div>
          {company?.plan !== "enterprise" && (
            <Badge className="bg-white text-brand-700">Hemat 20%</Badge>
          )}
        </div>
        {company?.plan !== "enterprise" && (
          <a
            href="https://wa.me/6281234567890?text=Halo%2C%20saya%20tertarik%20upgrade%20ke%20Enterprise%20plan%20HRIS%20Manggala."
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 font-semibold text-brand-700 shadow hover:bg-white/90 transition"
          >
            <Icon3D name="chat" size={20} />
            Hubungi Sales via WhatsApp
          </a>
        )}
      </div>

      {editOpen && company && (
        <CompanyEditModal
          company={company}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["admin-company"] });
            setEditOpen(false);
          }}
        />
      )}
    </>
  );
}

function CompanyEditModal({
  company,
  onClose,
  onSaved,
}: {
  company: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: company.name ?? "",
    slug: company.slug ?? "",
    domain: company.domain ?? "",
    plan: company.plan ?? "professional",
    timezone: company.timezone ?? "Asia/Jakarta",
    logoUrl: company.logoUrl ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      api.adminCompanyUpdate({
        name: form.name,
        slug: form.slug,
        domain: form.domain || null,
        plan: form.plan,
        timezone: form.timezone,
        logoUrl: form.logoUrl || null,
      }),
    onSuccess: () => onSaved(),
    onError: (e: any) => setError(e.message),
  });

  return (
    <Modal open onClose={onClose} title="Edit Profil Perusahaan" size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="space-y-3 p-5"
      >
        {error && (
          <p className="rounded-xl bg-danger-500/10 p-3 text-xs text-danger-600">
            {error}
          </p>
        )}
        <div>
          <label className="label">Nama Perusahaan</label>
          <input
            required
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Slug</label>
            <input
              required
              className="input"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              pattern="[a-z0-9-]+"
            />
          </div>
          <div>
            <label className="label">Plan</label>
            <select
              className="input"
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
            >
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Domain</label>
          <input
            className="input"
            placeholder="contoh: manggala.app"
            value={form.domain}
            onChange={(e) => setForm({ ...form, domain: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Timezone</label>
          <select
            className="input"
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
          >
            <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
            <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
            <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
          </select>
        </div>
        <div>
          <label className="label">Logo URL</label>
          <input
            className="input"
            placeholder="https://..."
            value={form.logoUrl}
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={save.isPending}
          >
            Batal
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
