"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/admin/TopBar";
import { Icon3D } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import { Edit2, RefreshCw, Search } from "lucide-react";

const TYPES = ["annual", "sick", "permission", "emergency"] as const;
const TYPE_LABEL: Record<string, string> = {
  annual: "Cuti Tahunan",
  sick: "Sakit",
  permission: "Izin",
  emergency: "Darurat",
};

export default function LeaveQuotasPage() {
  const qc = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<{
    employeeId: string;
    fullName: string;
    type: string;
    total: number;
    used: number;
  } | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["leave-quotas", year],
    queryFn: () => api.adminLeaveQuotas(year),
  });

  const { data: empData } = useQuery({
    queryKey: ["admin-employees"],
    queryFn: () => api.adminEmployees(),
  });

  // Merge employees yang belum punya quota → tampil semuanya
  const allEmployees = empData?.items ?? [];
  const quotaMap = new Map(
    (data?.items ?? []).map((it: any) => [it.employeeId, it])
  );
  const merged = allEmployees.map((e: any) => {
    const existing = quotaMap.get(e.id);
    return existing ?? {
      employeeId: e.id,
      fullName: e.fullName,
      employeeCode: e.employeeCode,
      quotas: {},
    };
  });

  const filtered = merged.filter((e: any) =>
    q
      ? e.fullName?.toLowerCase().includes(q.toLowerCase()) ||
        e.employeeCode?.toLowerCase().includes(q.toLowerCase())
      : true
  );

  return (
    <>
      <TopBar
        title="Kuota Cuti Pegawai"
        subtitle={`Tahun ${year}`}
        actions={
          <>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <Button onClick={() => setBulkOpen(true)}>
              <RefreshCw className="h-4 w-4" /> Set Massal
            </Button>
          </>
        }
      />

      <div className="space-y-4 p-6">
        <div className="rounded-2xl bg-cyan-50 p-4 text-sm text-cyan-900">
          <strong>Tips:</strong> Klik tombol edit di setiap kolom untuk
          mengubah kuota per pegawai. Pakai <strong>Set Massal</strong> untuk
          reset semua pegawai sekaligus dengan default value.
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-3xl bg-white p-3 shadow-soft border border-ink-100">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari pegawai..."
              className="w-full rounded-2xl border border-ink-200 bg-ink-50/60 pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-card border border-ink-100">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-3">Pegawai</th>
                  {TYPES.map((t) => (
                    <th key={t} className="px-5 py-3 text-center">
                      {TYPE_LABEL[t]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-6 text-center text-ink-500"
                    >
                      Tidak ada pegawai.
                    </td>
                  </tr>
                )}
                {filtered.map((e: any) => (
                  <tr
                    key={e.employeeId}
                    className="border-t border-ink-100 hover:bg-ink-50/60"
                  >
                    <td className="px-5 py-3">
                      <p className="font-semibold">{e.fullName}</p>
                      <p className="text-[11px] text-ink-500">
                        {e.employeeCode}
                      </p>
                    </td>
                    {TYPES.map((t) => {
                      const q = e.quotas[t];
                      const remaining = q ? q.total - q.used : 0;
                      const pct = q && q.total ? (remaining / q.total) * 100 : 0;
                      return (
                        <td key={t} className="px-5 py-3 text-center">
                          {q ? (
                            <button
                              onClick={() =>
                                setEditing({
                                  employeeId: e.employeeId,
                                  fullName: e.fullName,
                                  type: t,
                                  total: q.total,
                                  used: q.used,
                                })
                              }
                              className="group inline-flex flex-col items-center gap-1"
                            >
                              <p className="font-mono font-bold">
                                <span
                                  className={
                                    pct < 30
                                      ? "text-danger-600"
                                      : pct < 60
                                        ? "text-warning-600"
                                        : "text-success-600"
                                  }
                                >
                                  {remaining}
                                </span>
                                <span className="text-ink-400">
                                  /{q.total}
                                </span>
                              </p>
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-100">
                                <div
                                  className="h-1.5 rounded-full bg-brand-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-ink-400 group-hover:text-brand-600">
                                Edit
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                setEditing({
                                  employeeId: e.employeeId,
                                  fullName: e.fullName,
                                  type: t,
                                  total: t === "annual" ? 12 : t === "sick" ? 14 : t === "permission" ? 6 : 3,
                                  used: 0,
                                })
                              }
                              className="text-[11px] font-semibold text-brand-600 hover:underline"
                            >
                              + Set Kuota
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editing && (
        <EditQuotaModal
          year={year}
          {...editing}
          onClose={() => setEditing(null)}
        />
      )}
      {bulkOpen && (
        <BulkResetModal
          year={year}
          onClose={() => setBulkOpen(false)}
        />
      )}
    </>
  );
}

function EditQuotaModal({
  employeeId,
  fullName,
  type,
  total,
  used,
  year,
  onClose,
}: {
  employeeId: string;
  fullName: string;
  type: string;
  total: number;
  used: number;
  year: number;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ total, used });
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      api.adminLeaveQuotaUpdate({
        employeeId,
        type: type as any,
        total: Number(form.total),
        used: Number(form.used),
        year,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave-quotas"] });
      onClose();
    },
    onError: (e: any) => setError(e.message),
  });

  const remaining = Number(form.total) - Number(form.used);

  return (
    <Modal
      open
      onClose={onClose}
      title={`${TYPE_LABEL[type]} · ${fullName}`}
      description={`Tahun ${year}`}
      size="sm"
    >
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
          <label className="label">Total Kuota (hari)</label>
          <input
            type="number"
            min="0"
            required
            className="input"
            value={form.total}
            onChange={(e) =>
              setForm({ ...form, total: Number(e.target.value) || 0 })
            }
          />
        </div>
        <div>
          <label className="label">Sudah Terpakai</label>
          <input
            type="number"
            min="0"
            max={form.total}
            required
            className="input"
            value={form.used}
            onChange={(e) =>
              setForm({ ...form, used: Number(e.target.value) || 0 })
            }
          />
          <p className="mt-1 text-[11px] text-ink-500">
            Sisa kuota:{" "}
            <strong className={remaining < 0 ? "text-danger-600" : ""}>
              {remaining} hari
            </strong>
          </p>
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

function BulkResetModal({
  year,
  onClose,
}: {
  year: number;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    annual: 12,
    sick: 14,
    permission: 6,
    emergency: 3,
    resetUsed: false,
  });
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      api.adminLeaveQuotaBulk({
        year,
        defaults: {
          annual: Number(form.annual),
          sick: Number(form.sick),
          permission: Number(form.permission),
          emergency: Number(form.emergency),
        },
        resetUsed: form.resetUsed,
      }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["leave-quotas"] });
      alert(res.message);
      onClose();
    },
    onError: (e: any) => setError(e.message),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Set Kuota Massal"
      description={`Berlaku untuk semua pegawai · tahun ${year}`}
      size="md"
    >
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
        <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900">
          Akan diterapkan ke <strong>SEMUA pegawai</strong> di company.
          Pegawai yang sudah punya kuota akan diupdate, yang belum akan
          dibuatkan baru.
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(["annual", "sick", "permission", "emergency"] as const).map((t) => (
            <div key={t}>
              <label className="label">{TYPE_LABEL[t]} (hari)</label>
              <input
                type="number"
                min="0"
                required
                className="input"
                value={form[t]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [t]: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-2xl bg-rose-50 p-3 text-sm">
          <input
            type="checkbox"
            checked={form.resetUsed}
            onChange={(e) => setForm({ ...form, resetUsed: e.target.checked })}
          />
          <div className="flex-1">
            <p className="font-semibold">Reset jumlah terpakai ke 0</p>
            <p className="text-xs text-ink-500">
              Centang untuk reset penuh awal tahun (HATI-HATI: data lama hilang)
            </p>
          </div>
        </label>
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
            {save.isPending ? "Menerapkan..." : "Terapkan ke Semua"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
