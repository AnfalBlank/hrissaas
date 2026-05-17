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
import { Plus, Trash2 } from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  national: "Nasional",
  company: "Perusahaan",
  religious: "Keagamaan",
};

export default function HolidaysPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["holidays"],
    queryFn: () => api.adminHolidays(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.adminHolidayDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holidays"] });
      setDeleteId(null);
    },
  });

  const items = data?.items ?? [];

  return (
    <>
      <TopBar
        title="Hari Libur"
        subtitle="Kalender libur untuk hitung lembur weekend/holiday"
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Tambah Libur
          </Button>
        }
      />
      <div className="space-y-4 p-6">
        <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Tip:</strong> Tanggal yang masuk daftar ini akan otomatis
          dianggap hari libur saat menghitung tarif lembur. Centang &ldquo;Berulang
          tiap tahun&rdquo; untuk libur yang fixed (mis. Tahun Baru).
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-card border border-ink-100">
          <ul className="divide-y divide-ink-100">
            {items.length === 0 && (
              <li className="p-8 text-center text-sm text-ink-500">
                Belum ada hari libur tercatat.
              </li>
            )}
            {items.map((h: any) => (
              <li
                key={h.id}
                className="flex items-center gap-4 p-4"
              >
                <Icon3D name="party" size={48} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{h.name}</p>
                  <p className="text-xs text-ink-500">
                    {new Date(h.date).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Badge variant="brand">{TYPE_LABEL[h.type] ?? h.type}</Badge>
                {h.recurringYearly && (
                  <Badge variant="success">Tahunan</Badge>
                )}
                <button
                  onClick={() => setDeleteId(h.id)}
                  className="rounded-lg p-2 hover:bg-danger-500/10"
                >
                  <Trash2 className="h-4 w-4 text-danger-600" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {creating && <HolidayModal onClose={() => setCreating(false)} />}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove.mutate(deleteId)}
        title="Hapus hari libur?"
        loading={remove.isPending}
      />
    </>
  );
}

function HolidayModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    name: "",
    type: "national" as "national" | "company" | "religious",
    recurringYearly: false,
  });

  const create = useMutation({
    mutationFn: () => api.adminHolidayCreate(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holidays"] });
      onClose();
    },
    onError: (e: any) => setError(e.message),
  });

  return (
    <Modal open onClose={onClose} title="Tambah Hari Libur" size="md">
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
          <label className="label">Tanggal</label>
          <input
            required
            type="date"
            className="input"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Nama Libur</label>
          <input
            required
            className="input"
            placeholder="mis. Idul Fitri 1447H"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Jenis</label>
          <select
            className="input"
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as any })
            }
          >
            <option value="national">Nasional</option>
            <option value="religious">Keagamaan</option>
            <option value="company">Perusahaan</option>
          </select>
        </div>
        <label className="flex items-center gap-2 rounded-2xl bg-ink-50 p-3 text-sm">
          <input
            type="checkbox"
            checked={form.recurringYearly}
            onChange={(e) =>
              setForm({ ...form, recurringYearly: e.target.checked })
            }
          />
          <span>Berulang tiap tahun (untuk tanggal fixed)</span>
        </label>
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
