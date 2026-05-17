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
import { Download, Printer } from "lucide-react";

export default function PayrollPage() {
  const { data } = useQuery({
    queryKey: ["payroll-me"],
    queryFn: () => api.payrollMe(),
  });
  const [downloading, setDownloading] = useState(false);

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

  return (
    <div className="px-4 pt-4">
      <PageHeader title="Slip Gaji" subtitle={`Periode ${c.period}`} />

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-5 text-white shadow-card">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/80">Take Home Pay</p>
            <p className="font-display text-3xl font-extrabold">
              {formatCurrency(c.netSalary)}
            </p>
            <p className="mt-1 text-xs text-white/80">
              Akan ditransfer ke BCA · ****1234
            </p>
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
        <Button
          variant="secondary"
          onClick={() => handlePrint(c.period)}
        >
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

      <div className="mt-5 rounded-3xl bg-white shadow-soft border border-ink-100">
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

      <div className="mt-4 rounded-3xl bg-white shadow-soft border border-ink-100">
        <SectionHeader title="Potongan" icon="receipt" />
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
