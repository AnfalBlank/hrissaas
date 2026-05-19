"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Icon3D } from "@/components/Icon3D";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";

const PRESETS = {
  employee: { email: "andini@manggala.id", password: "demo1234" },
  admin: { email: "admin@manggala.id", password: "demo1234" },
};

const ADMIN_ROLES = ["super_admin", "owner", "hr"];

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "";
  const reason = searchParams.get("reason");

  const REASON_MSG: Record<string, string> = {
    expired: "Sesi Anda sudah berakhir. Silakan login kembali.",
    idle: "Anda di-logout otomatis karena tidak ada aktivitas selama 30 menit.",
  };

  const [showPwd, setShowPwd] = useState(false);
  const [role, setRole] = useState<"employee" | "admin">("employee");
  const [email, setEmail] = useState(PRESETS.employee.email);
  const [password, setPassword] = useState(PRESETS.employee.password);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchRole(r: "employee" | "admin") {
    setRole(r);
    setEmail(PRESETS[r].email);
    setPassword(PRESETS[r].password);
    setError(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Logout dulu untuk clear session lama (jika ada)
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
      const data = await api.login(email, password);
      const userRole = data.user?.role;
      const target =
        next ||
        (ADMIN_ROLES.includes(userRole) ? "/admin" : "/app");
      // Force clear React Query cache agar data user lama tidak nyangkut
      if (typeof window !== "undefined") {
        window.__MAS_FRESH_LOGIN__ = true;
      }
      router.push(target);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Login gagal");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 lg:block">
        <div className="absolute inset-0 bg-grid-light bg-[size:48px_48px] opacity-20" />
        <div className="relative z-10 flex h-full flex-col p-12 text-white">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={40} className="ring-2 ring-white/20" />
            <span className="font-display text-xl font-extrabold">
              Manggala
            </span>
          </Link>
          <div className="mt-auto">
            <div className="grid grid-cols-3 gap-3 max-w-sm">
              {[
                "face",
                "satellite",
                "qrcode",
                "payroll",
                "calendar",
                "chart",
                "shield",
                "buildings",
                "bell",
              ].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl bg-white/10 p-3 backdrop-blur ring-1 ring-white/15"
                >
                  <Icon3D name={n as any} size={48} />
                </div>
              ))}
            </div>
            <h2 className="mt-8 font-display text-3xl font-extrabold leading-tight max-w-md">
              Absensi cerdas dengan AI face recognition.
            </h2>
            <p className="mt-3 max-w-md text-white/75">
              Login untuk mengakses dashboard pegawai atau panel admin Manggala
              Attendance System.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12 lg:p-16 bg-hero-gradient">
        <div className="w-full max-w-md mx-auto">
          <Link href="/" className="lg:hidden mb-6 inline-flex items-center gap-2">
            <Logo size={36} />
            <span className="font-display text-lg font-extrabold">Manggala</span>
          </Link>
          <h1 className="font-display text-3xl font-extrabold">
            Selamat datang kembali 👋
          </h1>
          <p className="mt-2 text-sm text-ink-600">
            Masuk untuk melanjutkan ke dashboard.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-white/60 p-1 ring-1 ring-ink-100">
            {(["employee", "admin"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => switchRole(r)}
                className={`rounded-xl py-2 text-sm font-semibold transition ${
                  role === r
                    ? "bg-white text-ink-900 shadow-soft"
                    : "text-ink-500"
                }`}
              >
                {r === "employee" ? "Pegawai" : "Admin"}
              </button>
            ))}
          </div>

          {reason && REASON_MSG[reason] && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {REASON_MSG[reason]}
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-danger-500/10 px-3 py-2 text-sm text-danger-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-4 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-ink-400 hover:bg-ink-100"
                >
                  {showPwd ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink-600">
                <input type="checkbox" className="rounded" /> Ingat saya
              </label>
              <a className="font-medium text-brand-600" href="#">
                Lupa password?
              </a>
            </div>
            <Button block size="lg" disabled={loading} type="submit">
              {loading ? "Memproses..." : "Masuk"}{" "}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-center text-[11px] text-ink-500">
              Demo: <code>{PRESETS[role].email}</code> /{" "}
              <code>demo1234</code>
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Belum punya akun?{" "}
            <Link href="/" className="font-semibold text-brand-600">
              Hubungi sales
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
