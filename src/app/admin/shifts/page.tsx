"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/admin/TopBar";
import { Icon3D, type Icon3DName } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { api } from "@/lib/api";
import { Edit2, Plus, Trash2 } from "lucide-react";

const STYLE: Record<string, { color: string; icon: Icon3DName }> = {
  Pagi: { color: "from-amber-200 to-amber-100", icon: "clock" },
  Siang: { color: "from-orange-200 to-orange-100", icon: "fire" },
  Malam: { color: "from-violet-200 to-violet-100", icon: "sparkles" },
  Flexible: { color: "from-cyan-200 to-cyan-100", icon: "bolt" },
};

export default function ShiftsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-shifts"],
    queryFn: () => api.adminShifts(),
  });
  const shifts = data?.items ?? [];

  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => api.adminShiftDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shifts"] });
      setDeleteId(null);
    },
  });

  return (
    <>
      <TopBar
        title="Manajemen Shift"
        subtitle="Atur shift kerja & rotasi tim"
        actions={
          <>
            <Button variant="secondary">
              <Icon3D name="sparkles" size={20} /> AI Auto Shift
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Tambah Shift
            </Button>
          </>
        }
      />
      <div className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shifts.length === 0 && (
            <div className="col-span-full rounded-3xl bg-white p-8 text-center text-sm text-ink-500 shadow-soft border border-ink-100">
              Belum ada shift.
            </div>
          )}
          {shifts.map((s: any) => {
            const style = STYLE[s.name] ?? {
              color: "from-ink-100 to-ink-50",
              icon: "clock" as Icon3DName,
            };
            return (
              <div
                key={s.id}
                className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${style.color} p-5 shadow-soft`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-lg font-bold">{s.name}</p>
                    <p className="text-xs text-ink-600">
                      {s.startTime} - {s.endTime}
                    </p>
                    <p className="mt-1 text-[10px] text-ink-500">
                      Toleransi {s.graceMinutes ?? 0}m
                    </p>
                  </div>
                  <Icon3D name={style.icon} size={56} />
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <p className="font-display text-3xl font-extrabold">
                    {s.employeeCount}
                  </p>
                  <Badge>pegawai</Badge>
                </div>
                <div className="mt-3 flex gap-1 border-t border-white/40 pt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditing(s)}
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(s.id)}
                    className="text-danger-600 hover:bg-danger-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ShiftModal
        open={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        existing={editing}
      />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove.mutate(deleteId)}
        title="Hapus shift?"
        description="Pegawai pada shift ini akan kehilangan referensi shift."
        loading={remove.isPending}
      />
    </>
  );
}

function ShiftModal({
  open,
  onClose,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: any;
}) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    startTime: existing?.startTime ?? "08:00",
    endTime: existing?.endTime ?? "17:00",
    graceMinutes: existing?.graceMinutes ?? 5,
    type: existing?.type ?? "regular",
  });

  if (existing && form.name !== existing.name && open) {
    setForm({
      name: existing.name ?? "",
      startTime: existing.startTime ?? "08:00",
      endTime: existing.endTime ?? "17:00",
      graceMinutes: existing.graceMinutes ?? 5,
      type: existing.type ?? "regular",
    });
  }

  const save = useMutation({
    mutationFn: () =>
      existing
        ? api.adminShiftUpdate(existing.id, {
            ...form,
            graceMinutes: Number(form.graceMinutes),
          })
        : api.adminShiftCreate({
            ...form,
            graceMinutes: Number(form.graceMinutes),
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shifts"] });
      onClose();
    },
    onError: (e: any) => setError(e.message),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? "Edit Shift" : "Tambah Shift"}
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
        <Field label="Nama Shift">
          <input
            required
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Mulai">
            <input
              required
              type="time"
              className="input"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </Field>
          <Field label="Selesai">
            <input
              required
              type="time"
              className="input"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Toleransi Telat (menit)">
          <input
            type="number"
            min="0"
            className="input"
            value={form.graceMinutes}
            onChange={(e) =>
              setForm({ ...form, graceMinutes: Number(e.target.value) })
            }
          />
        </Field>
        <Field label="Tipe">
          <select
            className="input"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="regular">Regular</option>
            <option value="night">Night</option>
            <option value="flexible">Flexible</option>
          </select>
        </Field>
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
