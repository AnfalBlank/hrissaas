import Link from "next/link";
import { Icon3D } from "@/components/Icon3D";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Sparkles,
  Star,
  ChevronDown,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative overflow-x-hidden">
      <BackgroundDecor />
      <Header />
      <Hero />
      <LogoCloud />
      <FeatureShowcase />
      <MobilePreview />
      <Stats />
      <Pricing />
      <Testimonials />
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
      className="pointer-events-none absolute inset-0 -z-10 bg-hero-gradient"
    >
      <div className="absolute inset-0 bg-grid-light bg-[size:48px_48px] opacity-40 [mask-image:radial-gradient(ellipse_at_top,#000_30%,transparent_70%)]" />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-ink-100">
      <div className="container mx-auto flex h-16 items-center justify-between px-5 max-w-7xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center text-white font-extrabold">
            M
          </div>
          <span className="font-display text-lg font-extrabold tracking-tight">
            Manggala<span className="text-brand-600">.</span>
          </span>
        </Link>
        <nav className="hidden gap-8 md:flex text-sm text-ink-600">
          <a href="#features" className="hover:text-ink-900">Fitur</a>
          <a href="#pricing" className="hover:text-ink-900">Harga</a>
          <a href="#testimonials" className="hover:text-ink-900">Testimoni</a>
          <a href="#faq" className="hover:text-ink-900">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="md">Masuk</Button>
          </Link>
          <Link href="/login">
            <Button size="md">
              Coba Gratis <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative">
      <div className="container mx-auto max-w-7xl px-5 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="animate-slide-up">
            <Badge variant="brand" className="mb-5">
              <Sparkles className="h-3.5 w-3.5" /> Powered by AI Face Recognition
            </Badge>
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              HRIS Attendance
              <br />
              <span className="bg-gradient-to-r from-brand-500 via-brand-700 to-accent-500 bg-clip-text text-transparent">
                cerdas, ringan, realtime.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-600 text-balance">
              Manggala Attendance System adalah platform PWA HRIS modern dengan
              face recognition, GPS validation, payroll otomatis, dan
              monitoring multi-cabang dalam satu aplikasi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login">
                <Button size="xl">
                  Mulai Sekarang <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="secondary" size="xl">
                  Lihat Demo Admin
                </Button>
              </Link>
            </div>
            <ul className="mt-8 grid grid-cols-2 gap-3 text-sm text-ink-600">
              {[
                "Face Recognition + Liveness",
                "GPS & Geofence",
                "Payroll Otomatis",
                "PWA & Offline Mode",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success-600" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-brand-200 to-accent-500/40 blur-2xl opacity-60" />
      <div className="relative animate-slide-up">
        {/* Phone mockup */}
        <div className="relative mx-auto aspect-[9/19] w-[300px] rounded-[3rem] bg-ink-900 p-3 shadow-card">
          <div className="absolute left-1/2 top-3 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-ink-900" />
          <div className="h-full w-full overflow-hidden rounded-[2.4rem] bg-gradient-to-b from-brand-50 to-white p-4">
            <div className="flex items-center justify-between text-xs text-ink-500 pt-3">
              <span>9:41</span>
              <span>5G ●●●</span>
            </div>
            <div className="mt-4">
              <p className="text-[11px] text-ink-500">Selamat Datang</p>
              <p className="font-display text-base font-bold">Andini Putri</p>
            </div>
            <div className="mt-3 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white shadow-card">
              <p className="text-[11px] opacity-80">Shift hari ini</p>
              <p className="text-lg font-bold">Pagi · 08:00 - 17:00</p>
              <div className="mt-3 flex items-center gap-2">
                <Icon3D name="clock" size={36} />
                <div>
                  <p className="text-[10px] opacity-80">Waktu sekarang</p>
                  <p className="font-bold">08:24:11</p>
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[
                { n: "face" as const, label: "Absen" },
                { n: "qrcode" as const, label: "QR" },
                { n: "calendar" as const, label: "Cuti" },
                { n: "payroll" as const, label: "Slip" },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-2xl bg-white p-2 text-center shadow-soft"
                >
                  <Icon3D name={m.n} size={36} className="mx-auto" />
                  <p className="mt-1 text-[10px] font-medium text-ink-700">
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-2xl bg-white p-3 shadow-soft">
              <p className="text-[10px] uppercase tracking-wider text-ink-400">
                Riwayat
              </p>
              {[
                ["Senin", "Tepat Waktu", "08:00"],
                ["Selasa", "Tepat Waktu", "07:54"],
                ["Rabu", "Telat 5m", "08:05"],
              ].map(([d, s, t]) => (
                <div
                  key={d}
                  className="mt-2 flex items-center justify-between text-[11px]"
                >
                  <span className="text-ink-600">{d}</span>
                  <span className="text-ink-700 font-semibold">{s}</span>
                  <span className="text-ink-400">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Floating badges */}
        <div className="absolute -left-10 top-12 hidden md:block animate-float">
          <FloatingChip icon="shield" title="Anti Fake GPS" subtitle="Aktif" />
        </div>
        <div className="absolute -right-12 top-40 hidden md:block animate-float [animation-delay:.6s]">
          <FloatingChip
            icon="face"
            title="Face Verified"
            subtitle="98% match"
          />
        </div>
        <div className="absolute -right-6 bottom-10 hidden md:block animate-float [animation-delay:1.2s]">
          <FloatingChip
            icon="bolt"
            title="Realtime"
            subtitle="Sync ✓"
          />
        </div>
      </div>
    </div>
  );
}

function FloatingChip({
  icon,
  title,
  subtitle,
}: {
  icon: any;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white/90 px-3 py-2 shadow-card backdrop-blur">
      <Icon3D name={icon} size={36} />
      <div>
        <p className="text-xs font-bold text-ink-800">{title}</p>
        <p className="text-[10px] text-ink-500">{subtitle}</p>
      </div>
    </div>
  );
}

function LogoCloud() {
  return (
    <div className="border-y border-ink-100 bg-white/60">
      <div className="container mx-auto max-w-7xl px-5 py-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">
          Dipercaya oleh berbagai perusahaan di Indonesia
        </p>
        <div className="mt-5 grid grid-cols-3 items-center gap-6 opacity-70 md:grid-cols-6">
          {["NUSA", "GARUDA", "MEKAR", "ARYA", "BIMA", "SURYA"].map((b) => (
            <div
              key={b}
              className="text-center font-display text-xl font-extrabold tracking-widest text-ink-400"
            >
              {b}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: "face",
    title: "Absensi Online",
    desc: "Absensi mobile dengan GPS, geofencing, dan AI face recognition. Aman dan akurat.",
  },
  {
    icon: "shield",
    title: "Validasi Biometrik",
    desc: "Liveness detection berbasis AI mencegah kecurangan, anti foto palsu dan emulator.",
  },
  {
    icon: "fire",
    title: "Manajemen Lembur",
    desc: "Pengajuan & approval lembur transparan, otomatis terhitung di payroll bulanan.",
  },
  {
    icon: "stopwatch",
    title: "Manajemen Jam Kerja",
    desc: "Timesheet praktis dengan rekap harian dan bulanan dari data absensi nyata.",
  },
  {
    icon: "clock",
    title: "Manajemen Shift",
    desc: "Atur shift kerja kompleks dan bergulir, dengan toleransi telat per shift.",
  },
  {
    icon: "beach",
    title: "Manajemen Cuti",
    desc: "Kelola cuti karyawan secara terpusat dengan kuota dan multi-level approval.",
  },
  {
    icon: "qrcode",
    title: "Mesin Absensi Wajah",
    desc: "Alternatif modern fingerprint dengan integrasi penuh ke sistem absensi.",
  },
  {
    icon: "satellite",
    title: "Live Tracking",
    desc: "Pantau kehadiran karyawan lapangan secara realtime di peta interaktif.",
  },
  {
    icon: "bell",
    title: "Notifikasi Realtime",
    desc: "Update kehadiran karyawan via Push, WhatsApp, dan Email otomatis.",
  },
  {
    icon: "payroll",
    title: "Payroll Otomatis",
    desc: "Generate slip gaji dari absensi + lembur + BPJS + pajak dalam satu klik.",
  },
  {
    icon: "chart",
    title: "AI Analytics",
    desc: "Prediksi keterlambatan, employee scoring, dan attendance heatmap.",
  },
  {
    icon: "buildings",
    title: "Multi Branch SaaS",
    desc: "Kelola banyak cabang, multi-tenant, custom domain, dan branding perusahaan.",
  },
] as const;

function FeatureShowcase() {
  return (
    <section id="features" className="container mx-auto max-w-7xl px-5 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="brand">Fitur Unggulan</Badge>
        <h2 className="mt-4 font-display text-3xl font-extrabold md:text-5xl">
          Semua yang HR butuhkan, dalam satu platform.
        </h2>
        <p className="mt-4 text-ink-600">
          Dari absensi cerdas hingga payroll otomatis, MAS dirancang
          mobile-first untuk pengalaman cepat seperti aplikasi native.
        </p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="group rounded-3xl border border-ink-100 bg-white p-5 shadow-card transition hover:-translate-y-1 hover:shadow-glow"
          >
            <Icon3D name={f.icon as any} size={64} />
            <h3 className="mt-4 font-display text-lg font-bold">{f.title}</h3>
            <p className="mt-2 text-sm text-ink-600">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MobilePreview() {
  return (
    <section className="bg-gradient-to-b from-brand-950 to-ink-900 text-white">
      <div className="container mx-auto max-w-7xl px-5 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge variant="brand" className="bg-white/10 text-white">
              <Smartphone className="h-3.5 w-3.5" /> PWA · Mobile First
            </Badge>
            <h2 className="mt-4 font-display text-3xl font-extrabold md:text-5xl">
              Install di home screen.
              <br />
              <span className="text-brand-300">Tanpa Play Store.</span>
            </h2>
            <p className="mt-4 max-w-xl text-white/70">
              MAS adalah Progressive Web App. Pegawai bisa install langsung
              dari browser, akses offline, dan mendapatkan push notification
              seperti aplikasi native.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-3">
              {[
                "Offline mode",
                "Install ke home screen",
                "Push notification",
                "App-like experience",
              ].map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-sm text-white/80"
                >
                  <CheckCircle2 className="h-4 w-4 text-brand-300" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { n: "house", label: "Dashboard" },
              { n: "face", label: "Absen" },
              { n: "calendar", label: "Cuti" },
              { n: "payroll", label: "Payroll" },
              { n: "chart", label: "Laporan" },
              { n: "bell", label: "Notifikasi" },
              { n: "chat", label: "Chat" },
              { n: "gear", label: "Setting" },
            ].map((m) => (
              <div
                key={m.label}
                className="flex flex-col items-center gap-2 rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur"
              >
                <Icon3D name={m.n as any} size={56} />
                <p className="text-sm font-medium">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { v: "150+", l: "Perusahaan" },
    { v: "65k+", l: "Pegawai aktif" },
    { v: "99.9%", l: "Uptime" },
    { v: "4.9★", l: "Rating user" },
  ];
  return (
    <section className="container mx-auto max-w-7xl px-5 py-16">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.l}
            className="rounded-3xl border border-ink-100 bg-white p-6 text-center shadow-card"
          >
            <p className="font-display text-3xl font-extrabold text-brand-700 md:text-4xl">
              {s.v}
            </p>
            <p className="mt-1 text-sm text-ink-500">{s.l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  const plans: {
    name: string;
    price: string;
    per: string;
    icon: any;
    featured?: boolean;
    bullets: string[];
  }[] = [
    {
      name: "Basic",
      price: "Rp 15rb",
      per: "/pegawai/bulan",
      icon: "rocket",
      bullets: [
        "Absensi GPS & QR",
        "Dashboard pegawai",
        "Riwayat absensi",
        "Email support",
      ],
    },
    {
      name: "Professional",
      price: "Rp 25rb",
      per: "/pegawai/bulan",
      icon: "trophy",
      featured: true,
      bullets: [
        "Semua fitur Basic",
        "Face recognition + Liveness",
        "Payroll otomatis",
        "Multi cabang",
        "WhatsApp notification",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      per: "kontak sales",
      icon: "buildings",
      bullets: [
        "Semua fitur Professional",
        "Multi tenant SaaS",
        "Custom domain",
        "AI Analytics Dashboard",
        "Priority support 24/7",
      ],
    },
  ];

  return (
    <section id="pricing" className="container mx-auto max-w-7xl px-5 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="brand">Harga</Badge>
        <h2 className="mt-4 font-display text-3xl font-extrabold md:text-5xl">
          Mulai gratis, bayar sesuai pertumbuhan tim.
        </h2>
        <p className="mt-4 text-ink-600">
          Tanpa biaya tersembunyi. Cancel kapanpun.
        </p>
      </div>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`relative rounded-3xl border p-6 shadow-card ${
              p.featured
                ? "border-brand-500 bg-gradient-to-b from-brand-50 to-white scale-[1.02]"
                : "border-ink-100 bg-white"
            }`}
          >
            {p.featured && (
              <Badge
                variant="brand"
                className="absolute -top-3 left-1/2 -translate-x-1/2"
              >
                <Star className="h-3 w-3" /> Paling populer
              </Badge>
            )}
            <div className="flex items-center gap-3">
              <Icon3D name={p.icon as any} size={56} />
              <div>
                <p className="font-display text-xl font-bold">{p.name}</p>
                <p className="text-xs text-ink-500">paket berlangganan</p>
              </div>
            </div>
            <div className="mt-5">
              <span className="font-display text-4xl font-extrabold">
                {p.price}
              </span>
              <span className="ml-1 text-ink-500">{p.per}</span>
            </div>
            <ul className="mt-5 space-y-2 text-sm">
              {p.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-ink-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-success-600" />
                  {b}
                </li>
              ))}
            </ul>
            <Link href="/login">
              <Button
                className="mt-6"
                block
                variant={p.featured ? "primary" : "secondary"}
              >
                Pilih {p.name}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    {
      name: "Rina Hartati",
      role: "HR Manager · Garuda Mekar",
      quote:
        "Sebelum pakai MAS, rekap absensi memakan waktu 3 hari. Sekarang otomatis dan realtime, HR bisa fokus ke hal strategis.",
    },
    {
      name: "Bayu Saputra",
      role: "Owner · Surya Group",
      quote:
        "Multi-cabang dengan geofence berbeda jadi sangat mudah. Saya bisa monitor 8 cabang dari satu dashboard.",
    },
    {
      name: "Dewi Anggraini",
      role: "Operations · Bima Tech",
      quote:
        "Face recognition-nya akurat, liveness detection benar-benar mencegah kecurangan. Worth setiap rupiah.",
    },
  ];
  return (
    <section
      id="testimonials"
      className="container mx-auto max-w-7xl px-5 py-20"
    >
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="brand">Testimoni</Badge>
        <h2 className="mt-4 font-display text-3xl font-extrabold md:text-5xl">
          Apa kata pelanggan kami.
        </h2>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {items.map((t) => (
          <div
            key={t.name}
            className="rounded-3xl border border-ink-100 bg-white p-6 shadow-card"
          >
            <div className="flex gap-0.5 text-warning-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="mt-3 text-ink-700">&ldquo;{t.quote}&rdquo;</p>
            <div className="mt-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-100 grid place-items-center font-bold text-brand-700">
                {t.name[0]}
              </div>
              <div>
                <p className="text-sm font-bold">{t.name}</p>
                <p className="text-xs text-ink-500">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "Apakah perlu install dari Play Store?",
      a: "Tidak. MAS adalah PWA, cukup buka via browser dan klik 'Tambah ke Home Screen'.",
    },
    {
      q: "Bagaimana cara kerja face recognition?",
      a: "Kami menggunakan InsightFace dan DeepFace dengan liveness detection untuk memastikan wajah asli, bukan foto.",
    },
    {
      q: "Apakah data perusahaan aman?",
      a: "Data dienkripsi end-to-end, JWT authentication, audit logs, dan device binding untuk maximum security.",
    },
    {
      q: "Apakah ada uji coba gratis?",
      a: "Ya, 14 hari uji coba untuk semua paket tanpa kartu kredit.",
    },
  ];
  return (
    <section id="faq" className="container mx-auto max-w-3xl px-5 py-20">
      <div className="text-center">
        <Badge variant="brand">FAQ</Badge>
        <h2 className="mt-4 font-display text-3xl font-extrabold md:text-5xl">
          Pertanyaan yang sering ditanyakan.
        </h2>
      </div>
      <div className="mt-10 space-y-3">
        {faqs.map((f) => (
          <details
            key={f.q}
            className="group rounded-2xl border border-ink-100 bg-white p-5 shadow-soft open:shadow-card"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-ink-800">
              {f.q}
              <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm text-ink-600">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="container mx-auto max-w-7xl px-5 pb-20">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 p-10 text-white md:p-16">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid items-center gap-8 md:grid-cols-2">
          <div>
            <h3 className="font-display text-3xl font-extrabold md:text-5xl">
              Siap upgrade HR perusahaanmu?
            </h3>
            <p className="mt-3 max-w-md text-white/80">
              Coba gratis 14 hari. Setup cepat. Tanpa kartu kredit.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link href="/login">
              <Button size="xl" variant="secondary">
                Mulai Gratis <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/admin">
              <Button
                size="xl"
                className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
              >
                Lihat Demo
              </Button>
            </Link>
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
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 grid place-items-center text-white font-extrabold">
                M
              </div>
              <span className="font-display text-lg font-extrabold">
                Manggala
              </span>
            </div>
            <p className="mt-3 text-sm text-ink-500">
              Manggala Attendance System — HRIS modern berbasis PWA & AI.
            </p>
          </div>
          {[
            { t: "Produk", l: ["Fitur", "Harga", "Demo", "Roadmap"] },
            { t: "Perusahaan", l: ["Tentang", "Karir", "Blog", "Kontak"] },
            { t: "Legal", l: ["Privasi", "Syarat", "Keamanan", "DPA"] },
          ].map((c) => (
            <div key={c.t}>
              <p className="text-sm font-bold text-ink-800">{c.t}</p>
              <ul className="mt-3 space-y-2 text-sm text-ink-500">
                {c.l.map((i) => (
                  <li key={i}>
                    <a className="hover:text-ink-800" href="#">
                      {i}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-ink-100 pt-6 text-xs text-ink-500">
          <p>© 2026 Manggala. Semua hak dilindungi.</p>
          <p>Made with ♥ in Indonesia</p>
        </div>
      </div>
    </footer>
  );
}
