"use client";

import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { PageHeader } from "@/components/employee/PageHeader";
import { Icon3D, type Icon3DName } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { Plus, Trash2, Upload } from "lucide-react";

const QUOTA_META: Record<
  string,
  { label: string; icon: Icon3DName; color: string }
> = {
  annual: {
    label: "Cuti Tahunan",
    icon: "beach",
    color: "from-cyan-100 to-cyan-50",
  },
  sick: { label: "Sakit", icon: "bedSick", color: "from-rose-100 to-rose-50" },
  permission: {
    label: "Izin",
    icon: "envelope",
    color: "from-amber-100 to-amber-50",
  },
  emergency: {
    label: "Darurat",
    icon: "warning",
    color: "from-orange-100 to-orange-50",
  },
};

const TYPE_LABEL: Record<string, string> = {
  annual: "Cuti Tahunan",
  sick: "Sakit",
  permission: "Izin",
  emergency: "Darurat",
};

export default function LeavePage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["leave-me"],
    queryFn: () => api.leaveMe(),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => api.cancelLeave(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave-me"] });
      setCancelId(null);
    },
  });

  const quotas = data?.quotas ?? [];
  const leaves = data?.leaves ?? [];

  return (
    <div className="px-4 pt-4">
      <PageHeader title="Cuti" subtitle="Kelola pengajuan cuti Anda" />

      <div className="grid grid-cols-2 gap-3">
        {(["annual", "sick", "permission", "emergency"] as const).map((t) => {
          const q = quotas.find((x: any) => x.type === t);
          const meta = QUOTA_META[t];
          const used = q?.used ?? 0;
          const total = q?.total ?? 0;
          const remaining = total - used;
          return (
            <div
              key={t}
              className={`rounded-3xl bg-gradient-to-br ${meta.color} p-4 shadow-soft`}
            >
              <Icon3D name={meta.icon} size={48} />
              <p className="mt-1 text-xs text-ink-600">{meta.label}</p>
              <p className="font-display text-2xl font-extrabold">
                {remaining}
                <span className="text-base font-normal text-ink-400">
                  /{total}
                </span>
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-white/70">
                <div
                  className="h-1.5 rounded-full bg-brand-600"
                  style={{
                    width: total ? `${(remaining / total) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Button block size="lg" className="mt-4" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Ajukan Cuti
      </Button>

      <div className="mt-5">
        <p className="section-title px-1">Riwayat Pengajuan</p>
        <ul className="mt-2 space-y-2">
          {leaves.length === 0 && (
            <li className="rounded-2xl bg-white p-6 text-center text-sm text-ink-500 shadow-soft border border-ink-100">
              Belum ada pengajuan cuti.
            </li>
          )}
          {leaves.map((l: any) => {
            const variant: any =
              l.status === "approved"
                ? "success"
                : l.status === "rejected"
                  ? "danger"
                  : "warning";
            const label =
              l.status === "approved"
                ? "Disetujui"
                : l.status === "rejected"
                  ? "Ditolak"
                  : "Menunggu";
            return (
              <li
                key={l.id}
                className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-soft border border-ink-100"
              >
                <div className="flex items-center gap-3">
                  <Icon3D
                    name={QUOTA_META[l.type]?.icon ?? "beach"}
                    size={48}
                  />
                  <div>
                    <p className="font-semibold">
                      {TYPE_LABEL[l.type] ?? l.type}
                    </p>
                    <p className="text-xs text-ink-500">
                      {l.fromDate} → {l.toDate} · {l.days} hari
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={variant}>{label}</Badge>
                  {l.status === "pending" && (
                    <button
                      onClick={() => setCancelId(l.id)}
                      className="rounded-lg p-1.5 text-danger-600 hover:bg-danger-500/10"
                      title="Batalkan"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {open && <LeaveModal onClose={() => setOpen(false)} />}
      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={() => cancelId && cancel.mutate(cancelId)}
        title="Batalkan pengajuan?"
        description="Pengajuan cuti yang masih menunggu akan dihapus."
        confirmLabel="Batalkan Pengajuan"
        loading={cancel.isPending}
      />
    </div>
  );
}

function LeaveModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState({
    type: "annual" as "annual" | "sick" | "permission" | "emergency",
    fromDate: new Date().toISOString().slice(0, 10),
    toDate: new Date().toISOString().slice(0, 10),
    reason: "",
  });
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => api.applyLeave(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave-me"] });
      toast.success(
        "Pengajuan cuti terkirim! 📨",
        "Menunggu persetujuan atasan. Kamu akan dapat notifikasi setelah diputuskan."
      );
      onClose();
    },
    onError: (e: any) => setError(e.message || "Gagal mengajukan"),
  });

  return (
    <Modal open onClose={onClose} title="Ajukan Cuti" size="md">
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
          <label className="label">Jenis Cuti</label>
          <select
            className="input"
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as any })
            }
          >
            <option value="annual">Cuti Tahunan</option>
            <option value="sick">Sakit</option>
            <option value="permission">Izin</option>
            <option value="emergency">Darurat</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Dari</label>
            <input
              required
              className="input"
              type="date"
              value={form.fromDate}
              onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Sampai</label>
            <input
              required
              className="input"
              type="date"
              value={form.toDate}
              onChange={(e) => setForm({ ...form, toDate: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">Alasan</label>
          <textarea
            className="input min-h-[88px]"
            placeholder="Tuliskan alasan cuti..."
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Lampiran</label>
          <button
            type="button"
            className="input flex items-center justify-center gap-2 text-ink-500"
          >
            <Upload className="h-4 w-4" /> Upload dokumen pendukung
          </button>
        </div>
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
            {mut.isPending ? "Mengirim..." : "Kirim Pengajuan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
