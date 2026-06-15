"use client";

import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { PageHeader } from "@/components/employee/PageHeader";
import { Icon3D } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { api } from "@/lib/api";
import { calculateDailyOvertimePay, formatHours } from "@/lib/duration";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { Plus, Trash2 } from "lucide-react";

export default function OvertimePage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["overtime-me"],
    queryFn: () => api.overtimeMe(),
  });
  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
  });
  const baseSalary = meData?.employee?.baseSalary ?? 0;

  const cancel = useMutation({
    mutationFn: (id: string) => api.cancelOvertime(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["overtime-me"] });
      setCancelId(null);
    },
  });

  const items = data?.items ?? [];
  const totalHours = items
    .filter((i: any) => i.status === "approved")
    .reduce((s: number, i: any) => s + (i.hours || 0), 0);
  const pending = items.filter((i: any) => i.status === "pending").length;

  return (
    <div className="px-4 pt-4">
      <PageHeader title="Lembur" subtitle="Pengajuan & riwayat lembur" />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-gradient-to-br from-orange-100 to-orange-50 p-4 shadow-soft">
          <Icon3D name="fire" size={48} />
          <p className="mt-1 text-xs text-ink-600">Total Jam Disetujui</p>
          <p className="font-display text-2xl font-extrabold">
            {totalHours}
            <span className="text-base font-normal text-ink-400">j</span>
          </p>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-amber-100 to-amber-50 p-4 shadow-soft">
          <Icon3D name="hourglass" size={48} />
          <p className="mt-1 text-xs text-ink-600">Menunggu Approval</p>
          <p className="font-display text-2xl font-extrabold">{pending}</p>
        </div>
      </div>

      <Button block size="lg" className="mt-4" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Ajukan Lembur
      </Button>

      <div className="mt-5">
        <p className="section-title px-1">Riwayat Pengajuan</p>
        <ul className="mt-2 space-y-2">
          {items.length === 0 && (
            <li className="rounded-2xl bg-white p-6 text-center text-sm text-ink-500 shadow-soft border border-ink-100">
              Belum ada pengajuan lembur.
            </li>
          )}
          {items.map((l: any) => {
            const variant: any =
              l.status === "approved"
                ? "success"
                : l.status === "rejected"
                  ? "danger"
                  : "warning";
            const labelStatus =
              l.status === "approved"
                ? "Disetujui"
                : l.status === "rejected"
                  ? "Ditolak"
                  : "Menunggu";

            // Hitung estimasi pendapatan
            const monthlyGross = baseSalary + Math.round(baseSalary * 0.27);
            const otCalc = baseSalary
              ? calculateDailyOvertimePay({
                  hours: l.hours || 0,
                  monthlyGross,
                  isHoliday: !!l.isHoliday,
                })
              : null;

            return (
              <li
                key={l.id}
                className="rounded-2xl bg-white p-3 shadow-soft border border-ink-100"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <Icon3D name="fire" size={48} />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {l.date} · {formatHours(l.hours || 0)}
                      </p>
                      <p className="text-xs text-ink-500">
                        {l.startTime} - {l.endTime}
                        {l.isHoliday && (
                          <span className="ml-2 rounded bg-rose-100 px-1.5 text-[9px] font-bold text-rose-700">
                            HARI LIBUR
                          </span>
                        )}
                      </p>
                      {l.description && (
                        <p className="text-[10px] text-ink-400 line-clamp-2 mt-0.5">
                          {l.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={variant}>{labelStatus}</Badge>
                    {l.status === "pending" && (
                      <button
                        onClick={() => setCancelId(l.id)}
                        className="rounded-lg p-1.5 text-danger-600 hover:bg-danger-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Estimasi pendapatan */}
                {otCalc && otCalc.pay > 0 && l.status !== "rejected" && (
                  <div className="mt-2 rounded-xl bg-amber-50 p-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-700">
                        Estimasi pendapatan {l.status === "approved" ? "(approved)" : "(jika disetujui)"}
                      </span>
                      <span className="font-mono font-bold text-amber-900">
                        {formatCurrency(otCalc.pay)}
                      </span>
                    </div>
                    <div className="mt-1 space-y-0.5 text-[10px] text-amber-800">
                      {otCalc.breakdown.map((b, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{b.label} × {b.hours.toFixed(2)}j</span>
                          <span className="font-mono">{formatCurrency(b.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {open && <OvertimeModal onClose={() => setOpen(false)} />}
      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={() => cancelId && cancel.mutate(cancelId)}
        title="Batalkan pengajuan lembur?"
        confirmLabel="Batalkan"
        loading={cancel.isPending}
      />
    </div>
  );
}

function OvertimeModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    startTime: "17:00",
    endTime: "20:00",
    description: "",
    isHoliday: false,
  });
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => api.applyOvertime(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["overtime-me"] });
      toast.success(
        "Pengajuan lembur terkirim! 🔥",
        "Menunggu persetujuan atasan. Estimasi pendapatan lembur sudah dihitung."
      );
      onClose();
    },
    onError: (e: any) => setError(e.message),
  });

  return (
    <Modal open onClose={onClose} title="Ajukan Lembur" size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
        className="space-y-3 p-5"
      >
        {error && (
          <p className="rounded-xl bg-danger-500/10 p-3 text-xs text-danger-600">
            {error}
          </p>
        )}
        <div>
          <label className="label">Tanggal</label>
          <input
            required
            type="date"
            className="input"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Mulai</label>
            <input
              required
              type="time"
              className="input"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Selesai</label>
            <input
              required
              type="time"
              className="input"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">Deskripsi Pekerjaan</label>
          <textarea
            className="input min-h-[88px]"
            placeholder="Contoh: Lembur deploy aplikasi versi 2.4..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 rounded-2xl bg-amber-50 p-3 text-sm">
          <input
            type="checkbox"
            checked={form.isHoliday}
            onChange={(e) => setForm({ ...form, isHoliday: e.target.checked })}
          />
          <div className="flex-1">
            <p className="font-semibold">Hari libur / weekend / nasional</p>
            <p className="text-xs text-ink-500">
              Tarif lembur: 2× jam 1-8, 3× jam 9, 4× jam 10+
            </p>
          </div>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={mut.isPending}
          >
            Batal
          </Button>
          <Button type="submit" disabled={mut.isPending}>
            {mut.isPending ? "Mengirim..." : "Kirim"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
