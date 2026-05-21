import type { Metadata } from "next";
import Link from "next/link";
import { Icon3D } from "@/components/Icon3D";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Mail,
  Instagram,
  Phone,
  ShieldCheck,
  Zap,
  Users,
  Clock,
  TrendingUp,
} from "lucide-react";

const WA_NUMBER = "6287884241703";
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
  "Halo MAS (Manggala Attendant System), saya tertarik untuk demo dan konsultasi sistem HRIS untuk perusahaan kami."
)}`;
const EMAIL = "admin@manggala-utama.id";
const IG = "manggalautamaindonesia";
const COMPANY = "PT Manggala Utama Indonesia";

export const metadata: Metadata = {
  title:
    "MAS — Manggala Attendant System | Sistem Absensi & Payroll Otomatis Indonesia",
  description:
    "MAS (Manggala Attendant System) — platform HRIS lengkap dengan absensi face recognition, GPS geofencing, payroll otomatis sesuai PPh 21 TER 2024, BPJS, THR, dan lembur Permenaker 102/2004. Managed by PT Manggala Utama Indonesia. Demo gratis hari ini.",
  keywords: [
    "HRIS Indonesia",
    "absensi online",
    "payroll otomatis",
    "PPh 21 TER",
    "BPJS",
    "face recognition absensi",
    "GPS geofencing",
    "THR",
    "lembur Permenaker",
    "aplikasi HR Indonesia",
    "software HRIS murah",
    "manajemen pegawai",
  ],
  authors: [{ name: COMPANY }],
  creator: COMPANY,
  publisher: COMPANY,
  openGraph: {
    title: "MAS — Manggala Attendant System | HRIS Indonesia",
    description:
      "Absensi face recognition + GPS, payroll otomatis PPh 21 TER, BPJS lengkap, lembur, cuti, THR. Managed by PT Manggala Utama Indonesia.",
    type: "website",
    locale: "id_ID",
    siteName: "MAS — Manggala Attendant System",
  },
  twitter: {
    card: "summary_large_image",
    title: "MAS — Manggala Attendant System | HRIS Indonesia",
    description:
      "Absensi face recognition + GPS, payroll otomatis PPh 21 TER, BPJS lengkap, lembur, cuti, THR.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://hris.manggala.biz.id",
  },
};

export default function LandingPage() {
  // Structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MAS — Manggala Attendant System",
    alternateName: "MAS",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Browser, iOS, Android (PWA)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "IDR",
      description: "Demo gratis dan konsultasi via WhatsApp",
    },
    publisher: {
      "@type": "Organization",
      name: COMPANY,
      url: "https://hris.manggala.biz.id",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+62-878-8424-1703",
        contactType: "Sales",
        email: EMAIL,
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "127",
    },
  };

  return (
    <div className="relative overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BackgroundDecor />
      <Header />
      <Hero />
      <TrustBar />
      <Features />
      <HowItWorks />
      <Compliance />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

function BackgroundDecor() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-brand-50 via-white to-accent-50"
    >
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="absolute top-1/3 -left-32 h-96 w-96 rounded-full bg-accent-200/30 blur-3xl" />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-ink-100">
      <div className="container mx-auto flex h-16 items-center justify-between px-5 max-w-7xl">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={36} />
          <span className="font-display text-lg font-extrabold tracking-tight">
            MAS<span className="text-brand-600">.</span>
          </span>
        </Link>
        <nav className="hidden gap-8 md:flex text-sm font-medium text-ink-600">
          <a href="#features" className="hover:text-brand-600 transition">
            Fitur
          </a>
          <a href="#how" className="hover:text-brand-600 transition">
            Cara Kerja
          </a>
          <a href="#pricing" className="hover:text-brand-600 transition">
            Harga
          </a>
          <a href="#faq" className="hover:text-brand-600 transition">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" size="md">
              Masuk
            </Button>
          </Link>
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
            <Button size="md">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Demo Gratis</span>
              <span className="sm:hidden">Demo</span>
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative">
      <div className="container mx-auto max-w-7xl px-5 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge className="mb-5 bg-brand-100 text-brand-700 px-3 py-1.5">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Sudah dipakai 100+ perusahaan di Indonesia
              </span>
            </Badge>

            <h1 className="font-display text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
              HRIS Modern,{" "}
              <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
                Compliant Indonesia
              </span>
              <br />
              tanpa ribet.
            </h1>

            <p className="mt-5 text-lg text-ink-600 max-w-xl">
              Absensi <strong>face recognition</strong> dengan GPS geofencing,
              payroll otomatis sesuai <strong>PPh 21 TER PMK 168/2023</strong>,
              BPJS lengkap, THR pro-rata, dan lembur Permenaker. Hemat 40 jam
              kerja HR per bulan.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                <Button size="xl" className="shadow-lg shadow-brand-500/30">
                  <MessageCircle className="h-5 w-5" />
                  Demo Gratis via WhatsApp
                </Button>
              </a>
              <a href={`mailto:${EMAIL}`}>
                <Button size="xl" variant="secondary">
                  <Mail className="h-5 w-5" />
                  Konsultasi Email
                </Button>
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-5 text-sm text-ink-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Tanpa kartu kredit
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Setup 1 hari
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Support WhatsApp
              </span>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative">
            <div className="relative mx-auto max-w-md">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 blur-2xl" />
              <div className="relative rounded-3xl bg-white p-6 shadow-2xl border border-ink-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-ink-400">Selamat pagi</p>
                    <p className="font-display text-xl font-bold">
                      Andini Putri
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-400 to-accent-500 grid place-items-center text-white font-bold">
                    AP
                  </div>
                </div>
                <div className="mt-5 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-600 p-4 text-white">
                  <p className="text-xs opacity-80">Status Hari Ini</p>
                  <p className="mt-1 font-display text-2xl font-extrabold">
                    Hadir · Tepat Waktu
                  </p>
                  <div className="mt-3 flex justify-between text-xs">
                    <div>
                      <p className="opacity-70">Masuk</p>
                      <p className="font-bold">08:00</p>
                    </div>
                    <div>
                      <p className="opacity-70">Lokasi</p>
                      <p className="font-bold">Kantor Pusat</p>
                    </div>
                    <div>
                      <p className="opacity-70">Confidence</p>
                      <p className="font-bold">98%</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { l: "Absensi", i: "face" as const },
                    { l: "Cuti", i: "beach" as const },
                    { l: "Slip", i: "payroll" as const },
                  ].map((it) => (
                    <div
                      key={it.l}
                      className="rounded-2xl bg-ink-50 p-3 text-center"
                    >
                      <Icon3D name={it.i} size={36} />
                      <p className="mt-1 text-xs font-semibold">{it.l}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl bg-emerald-50 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-emerald-700">Slip Mei 2026</p>
                      <p className="font-display font-extrabold text-emerald-800">
                        Rp 13.671.000
                      </p>
                    </div>
                    <Badge variant="success">Paid</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <section className="border-y border-ink-100 bg-white/50 backdrop-blur">
      <div className="container mx-auto max-w-7xl px-5 py-8">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { v: "100+", l: "Perusahaan" },
            { v: "10k+", l: "Pegawai aktif" },
            { v: "40 jam", l: "Hemat HR/bulan" },
            { v: "99.9%", l: "Uptime" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="font-display text-3xl font-extrabold bg-gradient-to-br from-brand-600 to-accent-600 bg-clip-text text-transparent">
                {s.v}
              </p>
              <p className="text-xs text-ink-500">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: "face" as const,
      title: "Absensi Face Recognition + GPS",
      desc: "Liveness detection (kedipan + motion), anti-spoof, geofencing radius per cabang. Tidak bisa absen pakai foto.",
    },
    {
      icon: "payroll" as const,
      title: "Payroll Otomatis Compliant",
      desc: "PPh 21 TER PMK 168/2023, BPJS Kesehatan/JHT/JP/JKK/JKM, lembur Permenaker, THR pro-rata. Generate 1 klik.",
    },
    {
      icon: "beach" as const,
      title: "Cuti & Lembur Self-Service",
      desc: "Pegawai apply via mobile app, approval workflow, auto-update kuota, validasi overlap.",
    },
    {
      icon: "satellite" as const,
      title: "Live Monitoring Real-time",
      desc: "Peta OpenStreetMap menampilkan lokasi semua pegawai yang sudah check-in hari ini.",
    },
    {
      icon: "chart" as const,
      title: "AI Analytics & Insight",
      desc: "Tren kehadiran 12 bulan, top performer, prediksi telat, heatmap jam masuk per hari.",
    },
    {
      icon: "shield" as const,
      title: "Multi-Tenant Aman",
      desc: "Isolasi data per perusahaan, JWT httpOnly cookie, rate limiting, 40+ audit log action types.",
    },
    {
      icon: "chat" as const,
      title: "Chat Internal + Notifikasi",
      desc: "Chat antar pegawai dengan attachment. Notifikasi via WhatsApp + Telegram + push.",
    },
    {
      icon: "qrcode" as const,
      title: "QR Code & Manual Backup",
      desc: "Scan QR untuk check-in cepat. Admin bisa koreksi manual dengan audit trail.",
    },
    {
      icon: "scroll" as const,
      title: "Bukti Potong 1721-A1",
      desc: "Generate PDF bukti potong PPh 21 tahunan otomatis untuk lapor SPT pegawai.",
    },
  ];

  return (
    <section id="features" className="py-20">
      <div className="container mx-auto max-w-7xl px-5">
        <div className="text-center mb-12">
          <Badge className="bg-accent-100 text-accent-700 mb-4">FITUR</Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
            Semua yang HR butuhkan,{" "}
            <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
              dalam satu platform
            </span>
          </h2>
          <p className="mt-3 text-ink-600 max-w-2xl mx-auto">
            Dari absensi sampai payroll, dari cuti sampai bukti potong pajak.
            Compliant dengan regulasi terbaru Indonesia 2024+.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-3xl bg-white p-6 shadow-soft border border-ink-100 hover:shadow-card hover:-translate-y-1 transition"
            >
              <Icon3D name={f.icon} size={56} />
              <p className="mt-4 font-display font-bold text-lg">{f.title}</p>
              <p className="mt-2 text-sm text-ink-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: "rocket" as const,
      t: "Daftar & Setup (1 hari)",
      d: "Tim kami bantu setup gratis: import data pegawai, atur cabang dengan map picker, set shift, kuota cuti, dan parameter payroll perusahaan Anda.",
    },
    {
      n: "02",
      icon: "people" as const,
      t: "Onboarding Pegawai",
      d: "Pegawai install PWA dari browser, login, upload foto profil. Bisa pakai di Android, iOS, atau desktop.",
    },
    {
      n: "03",
      icon: "face" as const,
      t: "Absensi Mulai",
      d: "Pegawai absen via face recognition + GPS. Admin pantau real-time di dashboard. Anomali otomatis ter-flag.",
    },
    {
      n: "04",
      icon: "payroll" as const,
      t: "Payroll Sebulan Sekali",
      d: "Klik 'Generate Payroll' → semua slip tergenerate dengan PPh 21, BPJS, lembur, THR. Approve → mark paid → kirim slip otomatis ke pegawai.",
    },
  ];

  return (
    <section id="how" className="py-20 bg-white/50">
      <div className="container mx-auto max-w-7xl px-5">
        <div className="text-center mb-12">
          <Badge className="bg-emerald-100 text-emerald-700 mb-4">
            CARA KERJA
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
            Dari setup ke payroll dalam 4 langkah
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.n}
              className="relative rounded-3xl bg-gradient-to-br from-white to-brand-50 p-6 border border-ink-100 shadow-soft"
            >
              <span className="absolute top-4 right-4 font-display font-extrabold text-4xl text-brand-100">
                {s.n}
              </span>
              <Icon3D name={s.icon} size={56} />
              <p className="mt-4 font-display font-bold">{s.t}</p>
              <p className="mt-2 text-sm text-ink-600">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Compliance() {
  const items = [
    { l: "UU HPP 7/2021", d: "PPh 21 progresif 5/15/25/30/35%" },
    { l: "PMK 168/2023", d: "Tarif Efektif Rata-rata (TER) bulanan" },
    { l: "Permenaker 102/2004", d: "Lembur weekday & holiday" },
    { l: "Permenaker 6/2016", d: "THR pro-rata" },
    { l: "Perpres 64/2020", d: "BPJS Kesehatan 1%+4%" },
    { l: "PP 44/2015", d: "BPJS JKK 0.24-1.74% + JKM 0.3%" },
    { l: "PP 45/2015", d: "BPJS JP 1%+2% capped" },
    { l: "PP 46/2015", d: "BPJS JHT 2%+3.7%" },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto max-w-7xl px-5">
        <div className="rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 p-8 sm:p-12 text-white">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge className="bg-white/20 text-white mb-4">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                COMPLIANCE
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight">
                Sesuai regulasi terbaru,{" "}
                <span className="text-yellow-300">100% legal</span>
              </h2>
              <p className="mt-4 text-white/80 max-w-md">
                Kami selalu update mengikuti regulasi Direktorat Jenderal Pajak,
                Kementerian Ketenagakerjaan, dan BPJS. Anda fokus jalankan
                bisnis, kami pastikan compliance.
              </p>
              <div className="mt-6">
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-bold text-brand-700 shadow-lg hover:bg-white/90 transition"
                >
                  <MessageCircle className="h-5 w-5" />
                  Konsultasi Gratis
                </a>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((i) => (
                <div
                  key={i.l}
                  className="rounded-2xl bg-white/10 p-3 backdrop-blur"
                >
                  <p className="font-bold text-sm">{i.l}</p>
                  <p className="text-xs text-white/70">{i.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-white/50">
      <div className="container mx-auto max-w-7xl px-5">
        <div className="text-center mb-12">
          <Badge className="bg-amber-100 text-amber-700 mb-4">HARGA</Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
            Investasi yang sebanding,{" "}
            <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
              hemat puluhan jam HR
            </span>
          </h2>
          <p className="mt-3 text-ink-600">
            Semua paket dapat fitur lengkap. Bedanya: jumlah pegawai &amp;
            support.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {[
            {
              name: "Starter",
              price: "Hubungi Sales",
              tagline: "Untuk UKM 1-25 pegawai",
              features: [
                "Semua fitur core",
                "1 cabang",
                "Storage R2 5 GB",
                "Email support",
              ],
              highlight: false,
            },
            {
              name: "Professional",
              price: "Hubungi Sales",
              tagline: "Untuk UKM 25-200 pegawai",
              features: [
                "Semua fitur core",
                "Unlimited cabang",
                "Storage R2 50 GB",
                "WhatsApp support",
                "Custom payroll components",
                "Bulk import CSV/Excel",
              ],
              highlight: true,
            },
            {
              name: "Enterprise",
              price: "Custom",
              tagline: "Untuk perusahaan 200+ pegawai",
              features: [
                "Semua fitur Professional",
                "Custom domain",
                "Storage unlimited",
                "Priority 24/7 support",
                "AI Analytics premium",
                "Dedicated account manager",
                "On-premise option",
              ],
              highlight: false,
            },
          ].map((p) => (
            <div
              key={p.name}
              className={`relative rounded-3xl p-7 border ${
                p.highlight
                  ? "bg-gradient-to-br from-brand-600 to-accent-600 text-white border-transparent shadow-2xl scale-105"
                  : "bg-white border-ink-100 shadow-soft"
              }`}
            >
              {p.highlight && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900">
                  Paling Populer
                </Badge>
              )}
              <p className="font-display text-xl font-extrabold">{p.name}</p>
              <p
                className={`text-xs ${
                  p.highlight ? "text-white/80" : "text-ink-500"
                }`}
              >
                {p.tagline}
              </p>
              <p className="mt-5 font-display text-3xl font-extrabold">
                {p.price}
              </p>
              <ul className="mt-6 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2
                      className={`h-4 w-4 mt-0.5 shrink-0 ${
                        p.highlight ? "text-yellow-300" : "text-emerald-500"
                      }`}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-7 block rounded-2xl px-5 py-3 text-center font-bold transition ${
                  p.highlight
                    ? "bg-white text-brand-700 hover:bg-white/90"
                    : "bg-brand-600 text-white hover:bg-brand-700"
                }`}
              >
                <MessageCircle className="inline h-4 w-4 mr-1" />
                Hubungi via WhatsApp
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "Apakah datanya aman dan terisolasi per perusahaan?",
      a: "Ya. Setiap perusahaan punya tenant terpisah. Query selalu di-filter berdasar companyId, JWT httpOnly cookie, password bcrypt, dan rate limiting login.",
    },
    {
      q: "Apakah perhitungan PPh 21 sudah sesuai PMK 168/2023?",
      a: "Ya. Kami sudah implementasi TER (Tarif Efektif Rata-rata) untuk Januari–November dengan kategori A/B/C berdasar PTKP. Desember otomatis rekonsiliasi tahunan progresif. Non-NPWP +20%.",
    },
    {
      q: "Bagaimana cara setup awal?",
      a: "Tim kami bantu setup gratis dalam 1 hari kerja. Anda hanya perlu kasih data pegawai (CSV/Excel), data cabang, dan parameter payroll perusahaan.",
    },
    {
      q: "Bisa di-akses dari HP atau hanya laptop?",
      a: "Bisa keduanya. MAS adalah Progressive Web App (PWA) — bisa di-install di Android/iOS sebagai aplikasi tanpa download dari Play Store/App Store, dan tetap responsive di laptop/desktop.",
    },
    {
      q: "Apakah pegawai bisa absen di luar kantor?",
      a: "Pegawai hanya bisa absen di lokasi yang sudah di-set admin (geofencing radius). Out-of-office assignment bisa di-handle dengan multi-cabang atau koreksi manual oleh admin.",
    },
    {
      q: "Bagaimana cara dapat bukti potong pajak (1721-A1)?",
      a: "Admin bisa generate Form 1721-A1 PDF per pegawai per tahun langsung dari halaman Payroll. Berisi rincian bruto, BPJS, dan PPh 21 yang sudah dipotong selama setahun.",
    },
    {
      q: "Bisa integrasi dengan WhatsApp atau Telegram?",
      a: "Ya. Notifikasi otomatis dikirim via WhatsApp Cloud API dan Telegram Bot. Cocok untuk reminder absen, slip gaji, approval cuti/lembur.",
    },
    {
      q: "Berapa biaya setup dan training?",
      a: "Setup gratis. Training online via Zoom juga gratis. Kontak sales via WhatsApp untuk paket harga sesuai jumlah pegawai.",
    },
  ];

  return (
    <section id="faq" className="py-20">
      <div className="container mx-auto max-w-3xl px-5">
        <div className="text-center mb-10">
          <Badge className="bg-brand-100 text-brand-700 mb-4">FAQ</Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
            Pertanyaan yang sering ditanyakan
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details
              key={i}
              className="group rounded-2xl bg-white p-5 border border-ink-100 shadow-soft"
            >
              <summary className="cursor-pointer font-bold text-ink-800 list-none flex items-center justify-between">
                {f.q}
                <span className="text-brand-600 group-open:rotate-180 transition-transform">
                  ▾
                </span>
              </summary>
              <p className="mt-3 text-sm text-ink-600 leading-relaxed">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20">
      <div className="container mx-auto max-w-7xl px-5">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-brand-600 to-accent-600 p-10 sm:p-16 text-center text-white relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <Badge className="bg-white/20 text-white mb-5">
              <Zap className="h-3.5 w-3.5 mr-1" />
              MULAI SEKARANG
            </Badge>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold leading-tight">
              Siap modernisasi HR perusahaan Anda?
            </h2>
            <p className="mt-4 text-white/90 max-w-xl mx-auto">
              Demo gratis 30 menit. Tim kami akan tunjukkan langsung sesuai
              kebutuhan perusahaan Anda. Tidak ada komitmen.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                <Button
                  size="xl"
                  className="bg-white text-brand-700 hover:bg-white/90 shadow-2xl"
                >
                  <MessageCircle className="h-5 w-5" />
                  Demo via WhatsApp
                </Button>
              </a>
              <a href={`mailto:${EMAIL}`}>
                <Button
                  size="xl"
                  variant="ghost"
                  className="text-white border-white/30 hover:bg-white/10"
                >
                  <Mail className="h-5 w-5" />
                  Email Kami
                </Button>
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/80">
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                +62 878-8424-1703
              </span>
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {EMAIL}
              </span>
              <a
                href={`https://instagram.com/${IG}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition"
              >
                <Instagram className="h-4 w-4" />@{IG}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="container mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-10 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={36} />
              <span className="font-display text-lg font-extrabold">
                MAS<span className="text-brand-600">.</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-ink-600 max-w-md">
              MAS (Manggala Attendant System) — platform HRIS modern untuk
              perusahaan Indonesia. Compliant dengan regulasi pajak &amp;
              ketenagakerjaan terbaru. Managed by {COMPANY}.
            </p>
            <div className="mt-5 space-y-2 text-sm">
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-ink-700 hover:text-brand-600 transition"
              >
                <Phone className="h-4 w-4" />
                +62 878-8424-1703 (WhatsApp)
              </a>
              <a
                href={`mailto:${EMAIL}`}
                className="flex items-center gap-2 text-ink-700 hover:text-brand-600 transition"
              >
                <Mail className="h-4 w-4" />
                {EMAIL}
              </a>
              <a
                href={`https://instagram.com/${IG}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-ink-700 hover:text-brand-600 transition"
              >
                <Instagram className="h-4 w-4" />@{IG}
              </a>
            </div>
          </div>
          <div>
            <p className="font-display font-bold text-sm mb-3">Produk</p>
            <ul className="space-y-2 text-sm text-ink-600">
              <li>
                <a href="#features" className="hover:text-brand-600">
                  Fitur
                </a>
              </li>
              <li>
                <a href="#how" className="hover:text-brand-600">
                  Cara Kerja
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-brand-600">
                  Harga
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-brand-600">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-display font-bold text-sm mb-3">Perusahaan</p>
            <ul className="space-y-2 text-sm text-ink-600">
              <li>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-600"
                >
                  Demo Gratis
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${EMAIL}`}
                  className="hover:text-brand-600"
                >
                  Konsultasi
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-brand-600">
                  Masuk Sistem
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-ink-100 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-ink-500">
            © {new Date().getFullYear()} {COMPANY}. All rights reserved.
          </p>
          <p className="text-xs text-ink-500">
            Built &amp; managed by{" "}
            <span className="font-bold text-ink-700">{COMPANY}</span> 🇮🇩
          </p>
        </div>
      </div>
    </footer>
  );
}
