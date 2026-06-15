"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/admin/TopBar";
import { Icon3D } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { api } from "@/lib/api";
import { downloadFile } from "@/lib/download";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import {
  CheckCircle,
  Eye,
  FileSpreadsheet,
  FileText,
  History,
  Play,
  Trash2,
  Wallet,
  ScrollText,
} from "lucide-react";

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function PayrollAdmin() {
  const qc = useQueryClient();
  const toast = useToast();
  const [period, setPeriod] = useState(currentPeriod());
  const { data } = useQuery({
    queryKey: ["admin-payroll", period],
    queryFn: () => api.adminPayroll(period),
  });

  const generate = useMutation({
    mutationFn: () => api.adminGeneratePayroll(period),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["admin-payroll", period] });
      toast.success("Payroll digenerate", res?.message ?? `Periode ${period} selesai.`);
    },
    onError: (e: any) => toast.error("Gagal generate payroll", e.message),
  });

  const generateThr = useMutation({
    mutationFn: () => api.adminGenerateThr(period),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["admin-payroll", period] });
      qc.invalidateQueries({ queryKey: ["payroll-components"] });
      toast.success("THR digenerate", res?.message ?? "THR berhasil di-generate.");
    },
    onError: (e: any) => toast.error("Gagal generate THR", e.message),
  });

  const update = useMutation({
    mutationFn: (vars: { id: string; data: any }) =>
      api.adminPayrollUpdate(vars.id, vars.data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-payroll", period] });
      const st = vars.data?.status;
      if (st === "approved") toast.success("Payroll disetujui", "Status berubah ke approved.");
      else if (st === "paid") toast.success("Payroll dibayar", "Pegawai mendapat notifikasi.");
      else toast.success("Payroll diperbarui");
    },
    onError: (e: any) => toast.error("Gagal update payroll", e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.adminPayrollDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payroll", period] });
      setDeleteId(null);
      toast.success("Payroll dihapus");
    },
    onError: (e: any) => toast.error("Gagal hapus payroll", e.message),
  });

  const [exporting, setExporting] = useState<"" | "pdf" | "xlsx">("");
  const [paymentTarget, setPaymentTarget] = useState<any | null>(null);
  const [historyTarget, setHistoryTarget] = useState<any | null>(null);
  const [detailTarget, setDetailTarget] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleExport(format: "pdf" | "xlsx") {
    setExporting(format);
    try {
      await downloadFile(
        `/api/admin/payroll/export?period=${period}&format=${format}`
      );
    } catch (e: any) {
      alert(e.message);
    } finally {
      setExporting("");
    }
  }

  async function handleBuktiPotong(employeeId: string) {
    const year = period.slice(0, 4);
    try {
      await downloadFile(api.adminBuktiPotongUrl(employeeId, Number(year)));
    } catch (e: any) {
      alert(e.message);
    }
  }

  const items = data?.items ?? [];
  const totals = data?.totals ?? { gross: 0, deduction: 0, net: 0 };

  return (
    <>
      <TopBar
        title="Payroll Management"
        subtitle="Generate dan kelola gaji bulanan"
        actions={
          <>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm"
            />
            <Button
              variant="secondary"
              onClick={() => handleExport("xlsx")}
              disabled={!!exporting || items.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {exporting === "xlsx" ? "Mengunduh..." : "Excel"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport("pdf")}
              disabled={!!exporting || items.length === 0}
            >
              <FileText className="h-4 w-4" />
              {exporting === "pdf" ? "Mengunduh..." : "PDF"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => generateThr.mutate()}
              disabled={generateThr.isPending}
            >
              <Icon3D name="party" size={20} />
              {generateThr.isPending ? "Generating THR..." : "Generate THR"}
            </Button>
            <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
              <Play className="h-4 w-4" />
              {generate.isPending ? "Generating..." : "Generate Payroll"}
            </Button>
          </>
        }
      />
      <div className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: "Periode", v: period, i: "calendar" as const, c: "from-brand-100 to-brand-50" },
            { l: "Pegawai", v: items.length, i: "people" as const, c: "from-violet-100 to-violet-50" },
            { l: "Total Net", v: formatCurrency(totals.net), i: "payroll" as const, c: "from-emerald-100 to-emerald-50" },
            { l: "Total Potongan", v: formatCurrency(totals.deduction), i: "receipt" as const, c: "from-amber-100 to-amber-50" },
          ].map((s) => (
            <div
              key={s.l}
              className={`rounded-3xl bg-gradient-to-br ${s.c} p-5 shadow-soft`}
            >
              <Icon3D name={s.i} size={56} />
              <p className="mt-2 text-xs text-ink-500">{s.l}</p>
              <p className="font-display text-xl font-extrabold">{s.v}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-card border border-ink-100">
          <div className="border-b border-ink-100 px-5 py-4 flex items-center justify-between">
            <p className="font-display font-bold">Daftar Payroll {period}</p>
            <Badge variant="brand">{items.length} pegawai</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-3">Pegawai</th>
                  <th className="px-5 py-3">Divisi</th>
                  <th className="px-5 py-3 text-right">Gaji Pokok</th>
                  <th className="px-5 py-3 text-right">Lembur</th>
                  <th className="px-5 py-3 text-right">Potongan</th>
                  <th className="px-5 py-3 text-right">Take Home</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-8 text-center text-ink-500"
                    >
                      Belum ada payroll. Klik &quot;Generate Payroll&quot; untuk
                      membuat.
                    </td>
                  </tr>
                )}
                {items.map((r: any) => {
                  const ded =
                    (r.attendanceDeduction || 0) +
                    (r.taxDeduction || 0) +
                    (r.bpjsDeduction || 0);
                  const variant =
                    r.status === "paid"
                      ? "success"
                      : r.status === "approved"
                        ? "brand"
                        : r.status === "cancelled"
                          ? "danger"
                          : "warning";
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-ink-100 hover:bg-ink-50/60"
                    >
                      <td className="px-5 py-3">
                        <p className="font-semibold">{r.fullName}</p>
                        <p className="text-[10px] text-ink-500">
                          {r.employeeCode}
                          {r.bankName ? ` · ${r.bankName} ****${String(r.bankAccount ?? "").slice(-4)}` : ""}
                        </p>
                      </td>
                      <td className="px-5 py-3">{r.division}</td>
                      <td className="px-5 py-3 text-right font-mono">
                        {formatCurrency(r.baseSalary)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono">
                        {formatCurrency(r.overtimePay)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-danger-600">
                        - {formatCurrency(ded)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold">
                        {formatCurrency(r.netSalary)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={variant as any}>{r.status}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          {r.status === "draft" && (
                            <button
                              onClick={() => setDetailTarget(r.id)}
                              className="rounded-lg p-1.5 text-ink-600 hover:bg-ink-100"
                              title="Verifikasi detail"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          {r.status === "draft" && (
                            <button
                              onClick={() =>
                                update.mutate({
                                  id: r.id,
                                  data: { status: "approved" },
                                })
                              }
                              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          {r.status === "approved" && (
                            <button
                              onClick={() => setPaymentTarget(r)}
                              className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50"
                              title="Mark as Paid"
                            >
                              <Wallet className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleBuktiPotong(r.employeeId)}
                            className="rounded-lg p-1.5 text-violet-600 hover:bg-violet-50"
                            title="Bukti Potong (1721-A1) tahunan"
                          >
                            <ScrollText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setHistoryTarget(r)}
                            className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50"
                            title="History revisi"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          {r.status !== "paid" && (
                            <button
                              onClick={() => setDeleteId(r.id)}
                              className="rounded-lg p-1.5 text-danger-600 hover:bg-danger-50"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {paymentTarget && (
        <PaymentModal
          payroll={paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onSubmit={(data) => {
            update.mutate({ id: paymentTarget.id, data: { ...data, status: "paid" } });
            setPaymentTarget(null);
          }}
        />
      )}
      {historyTarget && (
        <HistoryModal
          payroll={historyTarget}
          onClose={() => setHistoryTarget(null)}
        />
      )}
      {detailTarget && (
        <DetailModal
          payrollId={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove.mutate(deleteId)}
        title="Hapus payroll?"
        description="Payroll yang dihapus akan hilang permanen. Pastikan belum dibayarkan."
        loading={remove.isPending}
      />
    </>
  );
}

function PaymentModal({
  payroll,
  onClose,
  onSubmit,
}: {
  payroll: any;
  onClose: () => void;
  onSubmit: (data: {
    paymentMethod: "transfer" | "cash" | "other";
    paymentReference?: string;
    paidAt: string;
  }) => void;
}) {
  const [method, setMethod] = useState<"transfer" | "cash" | "other">(
    "transfer"
  );
  const [ref, setRef] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  return (
    <Modal
      open
      onClose={onClose}
      title={`Mark sebagai Paid — ${payroll.fullName}`}
      size="md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            paymentMethod: method,
            paymentReference: ref || undefined,
            paidAt,
          });
        }}
        className="space-y-3 p-5"
      >
        <div className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900">
          <p className="font-semibold">{payroll.fullName}</p>
          <p>
            Take Home: <span className="font-mono font-bold">{formatCurrency(payroll.netSalary)}</span>
          </p>
          {payroll.bankName && (
            <p className="text-xs">
              Tujuan: {payroll.bankName} ****
              {String(payroll.bankAccount ?? "").slice(-4)}
            </p>
          )}
        </div>
        <div>
          <label className="label">Metode Pembayaran</label>
          <select
            className="input"
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
          >
            <option value="transfer">Transfer Bank</option>
            <option value="cash">Tunai</option>
            <option value="other">Lainnya</option>
          </select>
        </div>
        <div>
          <label className="label">No. Referensi / Bukti Transfer</label>
          <input
            className="input"
            placeholder="opsional · mis. TRX1234567"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Tanggal Bayar</label>
          <input
            type="date"
            className="input"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit">
            <Wallet className="h-4 w-4" /> Mark Paid
          </Button>
        </div>
      </form>
    </Modal>
  );
}


function HistoryModal({
  payroll,
  onClose,
}: {
  payroll: any;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["payroll-revisions", payroll.id],
    queryFn: () => api.adminPayrollRevisions(payroll.id),
  });

  const items = data?.items ?? [];

  return (
    <Modal
      open
      onClose={onClose}
      title={`History Revisi — ${payroll.fullName} (${payroll.period})`}
      size="lg"
    >
      <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
        {isLoading && (
          <p className="text-center text-sm text-ink-500">Memuat...</p>
        )}
        {!isLoading && items.length === 0 && (
          <p className="rounded-2xl bg-ink-50 p-4 text-center text-sm text-ink-500">
            Belum ada history revisi.
          </p>
        )}
        {items.map((rev: any) => (
          <div
            key={rev.id}
            className="rounded-2xl border border-ink-100 bg-white p-4 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <Badge
                variant={
                  rev.action === "create"
                    ? "brand"
                    : rev.action === "approve"
                      ? "success"
                      : rev.action === "paid"
                        ? "success"
                        : rev.action === "delete" || rev.action === "cancel"
                          ? "danger"
                          : "warning"
                }
              >
                {rev.action.toUpperCase()}
              </Badge>
              <div className="text-right text-[11px] text-ink-500">
                <p>{new Date(rev.createdAt).toLocaleString("id-ID")}</p>
                <p>{rev.revisedByEmail ?? "system"}</p>
              </div>
            </div>
            {rev.notes && (
              <p className="mt-2 text-xs text-ink-600 italic">
                &ldquo;{rev.notes}&rdquo;
              </p>
            )}
            {rev.diff && Object.keys(rev.diff).length > 0 && (
              <div className="mt-3 overflow-x-auto rounded-xl bg-ink-50 p-3">
                <table className="text-xs">
                  <thead>
                    <tr className="text-ink-500">
                      <th className="pr-4 text-left">Field</th>
                      <th className="pr-4 text-left">Sebelum</th>
                      <th className="text-left">Sesudah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(rev.diff).map(([k, v]: any) => (
                      <tr key={k}>
                        <td className="pr-4 font-mono">{k}</td>
                        <td className="pr-4 text-danger-600 line-through">
                          {formatVal(v.old)}
                        </td>
                        <td className="text-emerald-700">{formatVal(v.new)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}

function formatVal(v: any): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return v.toLocaleString("id-ID");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}


function DetailModal({
  payrollId,
  onClose,
}: {
  payrollId: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["payroll-detail", payrollId],
    queryFn: () => api.adminPayrollDetail(payrollId),
  });

  const b = data?.breakdown;
  const att = data?.attendanceSummary;
  const emp = data?.employee;
  const comps = data?.activeComponents ?? [];
  const settings = data?.settings;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Verifikasi Payroll — ${emp?.fullName ?? "..."}`}
      size="lg"
    >
      <div className="max-h-[75vh] overflow-y-auto p-5 space-y-4">
        {isLoading && (
          <p className="text-center text-sm text-ink-500 py-8">Memuat...</p>
        )}
        {b && (
          <>
            {/* Info pegawai */}
            <div className="rounded-2xl bg-ink-50 p-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-ink-400">Nama</span>
                  <p className="font-bold">{emp?.fullName}</p>
                </div>
                <div>
                  <span className="text-ink-400">Kode</span>
                  <p className="font-bold">{emp?.employeeCode}</p>
                </div>
                <div>
                  <span className="text-ink-400">PTKP / NPWP</span>
                  <p className="font-bold">
                    {emp?.ptkpStatus} · {emp?.npwp ? "NPWP" : "non-NPWP"}
                  </p>
                </div>
                <div>
                  <span className="text-ink-400">Bank</span>
                  <p className="font-bold">
                    {emp?.bankName ?? "-"} {emp?.bankAccount ? `****${emp.bankAccount.slice(-4)}` : ""}
                  </p>
                </div>
                <div>
                  <span className="text-ink-400">Metode PPh</span>
                  <p className="font-bold">{settings?.taxMethod ?? "TER"}</p>
                </div>
                <div>
                  <span className="text-ink-400">Pola Gajian</span>
                  <p className="font-bold capitalize">
                    {settings?.cycle?.replace(/_/g, " ") ?? "end of month"}
                    {settings?.cutoffDay > 0 ? ` (cut-off tgl ${settings.cutoffDay})` : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Absensi summary */}
            <div className="rounded-2xl border border-ink-100 p-4">
              <p className="font-bold text-sm mb-2">📊 Data Absensi</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl bg-emerald-50 p-2 text-center">
                  <p className="text-emerald-700 font-bold text-lg">{att?.present ?? 0}</p>
                  <p className="text-emerald-600">Hadir</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-2 text-center">
                  <p className="text-amber-700 font-bold text-lg">{att?.late ?? 0}</p>
                  <p className="text-amber-600">Telat</p>
                </div>
                <div className="rounded-xl bg-brand-50 p-2 text-center">
                  <p className="text-brand-700 font-bold text-lg">{att?.totalDays ?? 0}</p>
                  <p className="text-brand-600">Total</p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-ink-500">
                Range: {att?.range?.from} → {att?.range?.to} · 
                Telat total {att?.totalLateMinutes ?? 0} menit · 
                OT {att?.totalOvertimeMinutes ?? 0} menit
              </p>
            </div>

            {/* Breakdown */}
            <div className="rounded-2xl border border-ink-100 p-4">
              <p className="font-bold text-sm mb-2">💰 Breakdown Perhitungan</p>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-ink-100">
                  <Row2 label="Gaji Pokok" value={b.baseSalary} />
                  <Row2 label="Tunjangan" value={b.allowance} />
                  <Row2 label={`Lembur (${b.overtimeHours ?? 0} jam)`} value={b.overtimePay} />
                  {b.bonus > 0 && <Row2 label="Bonus" value={b.bonus} />}
                  {b.thr > 0 && <Row2 label="THR" value={b.thr} />}
                  <Row2 label="TOTAL PENDAPATAN" value={b.grossTotal} bold green />
                  <Row2 label="BPJS Kesehatan (1%)" value={b.bpjsKesehatan} neg />
                  <Row2 label="BPJS JHT (2%)" value={b.bpjsJht} neg />
                  <Row2 label="BPJS JP (1%)" value={b.bpjsJp} neg />
                  <Row2 label={`PPh 21 (${b.ptkpStatus})`} value={b.taxDeduction} neg />
                  <Row2 label={`Potongan Telat (${b.lateMinutes}m)`} value={b.attendanceDeduction} neg />
                  <Row2 label="TOTAL POTONGAN" value={b.totalDeduction} bold neg />
                  <Row2 label="TAKE HOME PAY" value={b.netSalary} bold />
                </tbody>
              </table>
              <p className="mt-2 text-[11px] text-ink-500">
                Kontribusi BPJS perusahaan: {formatCurrency(b.employerBpjs)} (tidak potong take-home)
              </p>
            </div>

            {/* Komponen aktif */}
            {comps.length > 0 && (
              <div className="rounded-2xl border border-ink-100 p-4">
                <p className="font-bold text-sm mb-2">📋 Komponen Aktif</p>
                <ul className="space-y-1 text-xs">
                  {comps.map((c: any) => (
                    <li key={c.id} className="flex justify-between">
                      <span>
                        {c.type === "earning" ? "+" : "-"} {c.name} ({c.category})
                      </span>
                      <span className="font-mono">
                        {formatCurrency(c.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-800">
              💡 <strong>Verifikasi</strong>: Periksa breakdown di atas. Jika ada
              ketidaksesuaian, Anda bisa edit bonus/potongan manual via tombol
              PATCH (status masih draft), atau re-generate payroll setelah
              koreksi data absensi/komponen.
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function Row2({
  label,
  value,
  bold,
  neg,
  green,
}: {
  label: string;
  value: number;
  bold?: boolean;
  neg?: boolean;
  green?: boolean;
}) {
  return (
    <tr>
      <td className={`py-1.5 ${bold ? "font-bold" : ""}`}>{label}</td>
      <td
        className={`py-1.5 text-right font-mono ${bold ? "font-bold" : ""} ${
          neg ? "text-danger-600" : green ? "text-emerald-600" : ""
        }`}
      >
        {neg ? "- " : ""}
        {formatCurrency(value)}
      </td>
    </tr>
  );
}
