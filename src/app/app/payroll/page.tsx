"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/employee/PageHeader";
import { Icon3D } from "@/components/Icon3D";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { downloadFile } from "@/lib/download";
import { formatCurrency } from "@/lib/utils";
import { Download, HelpCircle, Printer, X } from "lucide-react";

export default function PayrollPage() {
  const { data } = useQuery({
    queryKey: ["payroll-me"],
    queryFn: () => api.payrollMe(),
  });
  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
  });

  const [downloading, setDownloading] = useState(false);
  const [showEduTax, setShowEduTax] = useState(false);
  const [showEduBpjs, setShowEduBpjs] = useState(false);

  async function handleDownload(period?: string) {
    setDownloading(true);
    try {
      const url = period
        ? `/api/payroll/me/export?period=${period}`
        : "/api/payroll/me/export";
      await downloadFile(url);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDownloading(false);
    }
  }

  function handlePrint(period?: string) {
    const url = period
      ? `/api/payroll/me/export?period=${period}`
      : "/api/payroll/me/export";
    const w = window.open(url, "_blank");
    setTimeout(() => w?.print?.(), 800);
  }

  const c = data?.current;
  if (!c) {
    return (
      <div className="px-4 pt-4">
        <PageHeader title="Slip Gaji" />
        <div className="rounded-3xl bg-white p-6 text-center text-sm text-ink-500 shadow-soft border border-ink-100">
          Loading...
        </div>
      </div>
    );
  }

  const employee = meData?.employee;
  const bankName = employee?.bankName ?? "";
  const bankAccount = employee?.bankAccount ?? "";
  const bankLast4 = bankAccount ? `****${String(bankAccount).slice(-4)}` : "";
  const bankLine = bankName
    ? `Akan ditransfer ke ${bankName} · ${bankLast4 || "(no rek belum diisi)"}`
    : "Lengkapi info rekening di profil untuk transfer otomatis.";

  const earnings: [string, number][] = [
    ["Gaji Pokok", c.baseSalary],
    ["Tunjangan Tetap", c.allowance ?? 0],
    [
      `Lembur${c.overtimeHours ? ` (${c.overtimeHours}j)` : ""}`,
      c.overtimePay,
    ],
    ["Bonus", c.bonus],
    ["THR", c.thr],
  ];
  const deductions: [string, number][] = [
    ["BPJS Kesehatan (1%)", c.bpjsKesehatan ?? 0],
    ["BPJS JHT (2%)", c.bpjsJht ?? 0],
    ["BPJS JP (1%)", c.bpjsJp ?? 0],
    [
      `PPh 21${c.ptkpStatus ? ` · ${c.ptkpStatus}` : ""}`,
      c.taxDeduction,
    ],
    ["Potongan Telat", c.attendanceDeduction],
  ];
  const totalEarnings = earnings.reduce((a, b) => a + b[1], 0);
  const totalDed = deductions.reduce((a, b) => a + b[1], 0);

  // Donut chart segments
  const chartTotal = totalEarnings || 1;
  const segments = [
    { label: "Gaji Pokok", value: c.baseSalary || 0, color: "#3A5CFF" },
    { label: "Tunjangan", value: c.allowance || 0, color: "#22C55E" },
    { label: "Lembur", value: c.overtimePay || 0, color: "#F59E0B" },
    { label: "Bonus + THR", value: (c.bonus || 0) + (c.thr || 0), color: "#A855F7" },
    { label: "Potongan", value: -(totalDed || 0), color: "#EF4444" },
  ].filter((s) => Math.abs(s.value) > 0);

  return (
    <div className="px-4 pt-4">
      <PageHeader title="Slip Gaji" subtitle={`Periode ${c.period}`} />

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-5 text-white shadow-card">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/80">Take Home Pay</p>
            <p className="font-display text-3xl font-extrabold">
              {formatCurrency(c.netSalary)}
            </p>
            <p className="mt-1 text-xs text-white/80">{bankLine}</p>
            {data?.preview && (
              <Badge className="mt-2 bg-white/20 text-white">Preview</Badge>
            )}
          </div>
          <Icon3D name="payroll" size={72} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
            <p className="text-[11px] text-white/80">Pendapatan</p>
            <p className="font-bold">{formatCurrency(totalEarnings)}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
            <p className="text-[11px] text-white/80">Potongan</p>
            <p className="font-bold">{formatCurrency(totalDed)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => handlePrint(c.period)}>
          <Printer className="h-4 w-4" /> Cetak
        </Button>
        <Button
          onClick={() => handleDownload(c.period)}
          disabled={downloading}
        >
          <Download className="h-4 w-4" />
          {downloading ? "Mengunduh..." : "Download PDF"}
        </Button>
      </div>

      {/* Komposisi gaji — donut */}
      <div className="mt-5 rounded-3xl bg-white p-5 shadow-soft border border-ink-100">
        <div className="flex items-center gap-3">
          <Icon3D name="chart" size={36} />
          <p className="font-display font-bold">Komposisi Gaji</p>
        </div>
        <div className="mt-4 flex items-center gap-5">
          <Donut total={chartTotal} segments={segments} size={140} />
          <ul className="flex-1 space-y-1.5">
            {segments.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-xs">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: s.color }}
                />
                <span className="flex-1 truncate text-ink-600">{s.label}</span>
                <span className="font-mono font-semibold">
                  {formatCurrency(Math.abs(s.value))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Pendapatan */}
      <div className="mt-4 rounded-3xl bg-white shadow-soft border border-ink-100">
        <SectionHeader title="Pendapatan" icon="wallet" />
        <ul>
          {earnings.filter(([, v]) => v > 0).map(([k, v]) => (
            <Row key={k} k={k} v={v} />
          ))}
          <li className="flex items-center justify-between border-t border-ink-100 px-4 py-3 text-sm font-bold">
            <span>Total Pendapatan</span>
            <span>{formatCurrency(totalEarnings)}</span>
          </li>
        </ul>
      </div>

      {/* Potongan */}
      <div className="mt-4 rounded-3xl bg-white shadow-soft border border-ink-100">
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-3">
            <Icon3D name="receipt" size={36} />
            <p className="font-display font-bold">Potongan</p>
          </div>
          <button
            onClick={() => setShowEduTax(true)}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Edukasi PPh 21
          </button>
        </div>
        <ul>
          {deductions.filter(([, v]) => v > 0).map(([k, v]) => (
            <Row key={k} k={k} v={v} negative />
          ))}
          <li className="flex items-center justify-between border-t border-ink-100 px-4 py-3 text-sm font-bold">
            <span>Total Potongan</span>
            <span className="text-danger-600">- {formatCurrency(totalDed)}</span>
          </li>
        </ul>
      </div>

      {/* Employer BPJS share — info */}
      {(c as any).employerBpjs > 0 && (
        <div className="mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-violet-50 to-brand-50 p-5 border border-violet-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Icon3D name="shield" size={40} />
              <div>
                <p className="font-display font-bold">
                  Kontribusi Perusahaan
                </p>
                <p className="text-[11px] text-ink-500">
                  Dibayar perusahaan untuk Anda
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowEduBpjs(true)}
              className="rounded-full bg-white p-1.5 text-violet-600 shadow-soft hover:bg-violet-100"
              title="Pelajari"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 font-display text-2xl font-extrabold text-violet-700">
            {formatCurrency((c as any).employerBpjs)}
          </p>
          <p className="text-[11px] text-ink-500">
            BPJS Kesehatan + JHT + JP + JKK + JKM dari sisi perusahaan. Tidak
            dipotong dari take home, tapi dialokasikan untuk perlindungan
            jangka panjang Anda.
          </p>
        </div>
      )}

      {/* Riwayat */}
      {data?.history && data.history.length > 0 && (
        <div className="mt-5 rounded-3xl bg-white p-4 shadow-soft border border-ink-100">
          <p className="font-display font-bold">Riwayat Payroll</p>
          <ul className="mt-2 space-y-2">
            {data.history.map((h: any) => (
              <li
                key={h.id}
                className="flex items-center justify-between rounded-2xl bg-ink-50 p-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <Icon3D name="receipt" size={36} />
                  <span className="font-semibold">{h.period}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono">{formatCurrency(h.netSalary)}</span>
                  <button
                    onClick={() => handleDownload(h.period)}
                    className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50"
                    title="Download slip"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showEduTax && (
        <EduSheet
          title="Cara Hitung PPh 21 Anda"
          onClose={() => setShowEduTax(false)}
        >
          <p>
            Mulai 2024, perusahaan menggunakan{" "}
            <strong>Tarif Efektif Rata-rata (TER)</strong> sesuai PMK 168/2023
            untuk hitung PPh 21 bulanan Januari–November.
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <strong>Status PTKP Anda</strong>:{" "}
              <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">
                {c.ptkpStatus ?? "TK/0"}
              </code>{" "}
              menentukan kategori TER.
            </li>
            <li>
              <strong>Kategori A</strong> (TK/0, TK/1, K/0): tarif paling
              rendah.
            </li>
            <li>
              <strong>Kategori B</strong> (TK/2, TK/3, K/1, K/2): tarif menengah.
            </li>
            <li>
              <strong>Kategori C</strong> (K/3): tarif paling tinggi.
            </li>
            <li>
              Tarif TER langsung dikalikan ke <strong>penghasilan bruto bulanan</strong>{" "}
              (gaji + tunjangan + lembur + bonus + THR).
            </li>
            <li>
              <strong>Bulan Desember</strong>: dihitung pajak progresif tahunan
              5/15/25/30/35%, dikurangi total TER yang telah dipotong Jan–Nov.
            </li>
            <li>
              Tanpa NPWP, tarif yang dipotong <strong>+20%</strong>.
            </li>
          </ul>
          <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-amber-900">
            💡 <strong>Tip</strong>: Masukkan NPWP di profil agar tidak kena
            tarif tambahan 20%.
          </div>
        </EduSheet>
      )}

      {showEduBpjs && (
        <EduSheet
          title="Kontribusi BPJS dari Perusahaan"
          onClose={() => setShowEduBpjs(false)}
        >
          <p>
            Selain potongan dari gaji Anda, perusahaan <strong>menambah</strong>{" "}
            kontribusi BPJS untuk perlindungan Anda. Total ini{" "}
            <strong>tidak mengurangi take home</strong>, tapi dibayarkan
            terpisah ke BPJS.
          </p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-ink-500">
                <th className="text-left">Program</th>
                <th className="text-right">Karyawan</th>
                <th className="text-right">Perusahaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              <tr>
                <td className="py-2">Kesehatan</td>
                <td className="text-right">1%</td>
                <td className="text-right">4%</td>
              </tr>
              <tr>
                <td className="py-2">JHT</td>
                <td className="text-right">2%</td>
                <td className="text-right">3.7%</td>
              </tr>
              <tr>
                <td className="py-2">JP</td>
                <td className="text-right">1%</td>
                <td className="text-right">2%</td>
              </tr>
              <tr>
                <td className="py-2">JKK</td>
                <td className="text-right">—</td>
                <td className="text-right">0.24%–1.74%</td>
              </tr>
              <tr>
                <td className="py-2">JKM</td>
                <td className="text-right">—</td>
                <td className="text-right">0.3%</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs text-ink-500">
            Dasar hukum: Perpres 64/2020 (Kesehatan), PP 44/2015 (JKK/JKM), PP
            45/2015 (JP), PP 46/2015 (JHT).
          </p>
        </EduSheet>
      )}
    </div>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: any }) {
  return (
    <div className="flex items-center gap-3 px-4 pt-4">
      <Icon3D name={icon} size={36} />
      <p className="font-display font-bold">{title}</p>
    </div>
  );
}

function Row({ k, v, negative }: { k: string; v: number; negative?: boolean }) {
  return (
    <li className="flex items-center justify-between px-4 py-2 text-sm">
      <span className="text-ink-600">{k}</span>
      <span className={`font-mono ${negative ? "text-danger-600" : ""}`}>
        {negative ? "- " : ""}
        {formatCurrency(v)}
      </span>
    </li>
  );
}

/** Donut chart sederhana via SVG. Negative segment di-render sebagai outline. */
function Donut({
  total,
  segments,
  size = 120,
}: {
  total: number;
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const positives = segments.filter((s) => s.value > 0);
  const sumPos = positives.reduce((a, b) => a + b.value, 0) || 1;
  const r = size / 2 - 8;
  const c2 = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#F1F3F8"
          strokeWidth={14}
        />
        {positives.map((s) => {
          const len = (s.value / sumPos) * c2;
          const dash = `${len} ${c2 - len}`;
          const segment = (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={14}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += len;
          return segment;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] uppercase text-ink-500">Bruto</span>
        <span className="font-display text-xs font-bold leading-tight">
          {compactCurrency(sumPos)}
        </span>
      </div>
    </div>
  );
}

function compactCurrency(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)} rb`;
  return `Rp ${n}`;
}

function EduSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[80vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-xl sm:max-w-md sm:rounded-3xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-ink-100 bg-white px-5 py-4">
          <p className="font-display font-bold">{title}</p>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-ink-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2 p-5 text-sm text-ink-700">{children}</div>
      </div>
    </div>
  );
}
