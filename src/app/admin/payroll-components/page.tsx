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
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

const CATEGORY_OPTIONS = {
  earning: [
    { v: "bonus", l: "Bonus" },
    { v: "incentive", l: "Insentif" },
    { v: "commission", l: "Komisi" },
    { v: "allowance", l: "Tunjangan Tambahan" },
    { v: "thr", l: "THR" },
    { v: "other", l: "Lainnya" },
  ],
  deduction: [
    { v: "loan", l: "Cicilan Pinjaman" },
    { v: "savings", l: "Tabungan" },
    { v: "insurance", l: "Asuransi" },
    { v: "fine", l: "Denda" },
    { v: "advance", l: "Kasbon" },
    { v: "other", l: "Lainnya" },
  ],
};

export default function PayrollComponentsPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["payroll-components"],
    queryFn: () => api.adminPayrollComponents(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.adminPayrollComponentDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-components"] });
      setDeleteId(null);
    },
  });

  const items = data?.items ?? [];

  return (
    <>
      <TopBar
        title="Komponen Payroll"
        subtitle="Pendapatan tambahan & potongan tetap per pegawai"
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Tambah Komponen
          </Button>
        }
      />
      <div className="space-y-4 p-6">
        <div className="rounded-2xl bg-cyan-50 p-4 text-sm text-cyan-900">
          <strong>Komponen tambahan</strong> akan otomatis ikut diperhitungkan
          saat generate payroll. Centang <strong>recurring</strong> untuk
          komponen tetap (mis. cicilan pinjaman) yang berlaku terus dari
          startPeriod sampai endPeriod.
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-card border border-ink-100">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-3">Pegawai</th>
                  <th className="px-5 py-3">Jenis</th>
                  <th className="px-5 py-3">Kategori</th>
                  <th className="px-5 py-3">Nama</th>
                  <th className="px-5 py-3 text-right">Jumlah</th>
                  <th className="px-5 py-3">Periode</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-6 text-center text-ink-500"
                    >
                      Belum ada komponen.
                    </td>
                  </tr>
                )}
                {items.map((c: any) => (
                  <tr
                    key={c.id}
                    className="border-t border-ink-100 hover:bg-ink-50/60"
                  >
                    <td className="px-5 py-3">
                      <p className="font-semibold">{c.employeeName}</p>
                      <p className="text-[10px] text-ink-500">
                        {c.employeeCode}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={c.type === "earning" ? "success" : "danger"}
                      >
                        {c.type === "earning" ? "Pendapatan" : "Potongan"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 capitalize">{c.category}</td>
                    <td className="px-5 py-3">{c.name}</td>
                    <td className="px-5 py-3 text-right font-mono">
                      {formatCurrency(c.amount)}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {c.recurring ? (
                        <Badge variant="brand">
                          {c.startPeriod ?? "—"} →{" "}
                          {c.endPeriod ?? "berkelanjutan"}
                        </Badge>
                      ) : (
                        <span className="text-ink-500">
                          {c.startPeriod ?? "satu kali"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setDeleteId(c.id)}
                        className="rounded-lg p-1.5 hover:bg-danger-500/10"
                      >
                        <Trash2 className="h-4 w-4 text-danger-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {creating && <ComponentModal onClose={() => setCreating(false)} />}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove.mutate(deleteId)}
        title="Hapus komponen?"
        description="Komponen tidak akan ikut di payroll setelah dihapus."
        loading={remove.isPending}
      />
    </>
  );
}

function ComponentModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    employeeId: "",
    type: "earning" as "earning" | "deduction",
    category: "bonus",
    name: "",
    amount: 0,
    recurring: false,
    startPeriod: "",
    endPeriod: "",
    notes: "",
  });

  const { data: employees } = useQuery({
    queryKey: ["admin-employees"],
    queryFn: () => api.adminEmployees(),
  });

  const create = useMutation({
    mutationFn: () =>
      api.adminPayrollComponentCreate({
        ...form,
        amount: Number(form.amount),
        startPeriod: form.startPeriod || undefined,
        endPeriod: form.endPeriod || undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-components"] });
      onClose();
    },
    onError: (e: any) => setError(e.message),
  });

  const categories = CATEGORY_OPTIONS[form.type as "earning" | "deduction"];

  return (
    <Modal open onClose={onClose} title="Tambah Komponen Payroll" size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="space-y-3 p-5"
      >
        {error && (
          <p className="rounded-xl bg-danger-500/10 p-3 text-xs text-danger-600">
            {error}
          </p>
        )}
        <div>
          <label className="label">Pegawai</label>
          <select
            required
            className="input"
            value={form.employeeId}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
          >
            <option value="">— pilih pegawai —</option>
            {(employees?.items ?? []).map((e: any) => (
              <option key={e.id} value={e.id}>
                {e.fullName} ({e.employeeCode})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Jenis</label>
            <select
              className="input"
              value={form.type}
              onChange={(e) => {
                const t = e.target.value as "earning" | "deduction";
                setForm({
                  ...form,
                  type: t,
                  category: CATEGORY_OPTIONS[t][0].v,
                });
              }}
            >
              <option value="earning">Pendapatan</option>
              <option value="deduction">Potongan</option>
            </select>
          </div>
          <div>
            <label className="label">Kategori</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.v} value={c.v}>
                  {c.l}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Nama / Deskripsi</label>
          <input
            required
            className="input"
            placeholder="mis. Cicilan Pinjaman Koperasi"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Jumlah (Rp)</label>
          <input
            required
            type="number"
            className="input"
            value={form.amount}
            onChange={(e) =>
              setForm({ ...form, amount: e.target.value as any })
            }
          />
        </div>
        <label className="flex items-center gap-2 rounded-2xl bg-brand-50 p-3 text-sm">
          <input
            type="checkbox"
            checked={form.recurring}
            onChange={(e) =>
              setForm({ ...form, recurring: e.target.checked })
            }
          />
          <div className="flex-1">
            <p className="font-semibold">Berulang setiap bulan</p>
            <p className="text-xs text-ink-500">
              Centang jika ini cicilan tetap atau allowance bulanan
            </p>
          </div>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Mulai (YYYY-MM)</label>
            <input
              type="month"
              className="input"
              value={form.startPeriod}
              onChange={(e) =>
                setForm({ ...form, startPeriod: e.target.value })
              }
            />
          </div>
          <div>
            <label className="label">Sampai (YYYY-MM, opsional)</label>
            <input
              type="month"
              className="input"
              value={form.endPeriod}
              onChange={(e) =>
                setForm({ ...form, endPeriod: e.target.value })
              }
            />
          </div>
        </div>
        <div>
          <label className="label">Catatan</label>
          <textarea
            className="input min-h-[64px]"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={create.isPending}
          >
            Batal
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
