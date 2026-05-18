"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/admin/TopBar";
import { Icon3D } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { QrGenerator } from "@/components/admin/QrGenerator";
import { api } from "@/lib/api";
import { Edit2, Plus, Trash2 } from "lucide-react";

const LiveMap = dynamic(
  () => import("@/components/admin/LiveMap").then((m) => m.LiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center bg-gradient-to-br from-brand-50 to-cyan-50">
        <div className="text-sm text-ink-500">Memuat peta...</div>
      </div>
    ),
  }
);

export default function BranchesPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-branches"],
    queryFn: () => api.adminBranches(),
  });
  const branches = data?.items ?? [];

  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [qrBranch, setQrBranch] = useState<any | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => api.adminBranchDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-branches"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setDeleteId(null);
    },
  });

  return (
    <>
      <TopBar
        title="Cabang & GPS Management"
        subtitle="Kelola lokasi kantor dan radius geofence"
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Tambah Cabang
          </Button>
        }
      />
      <div className="space-y-4 p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 relative overflow-hidden rounded-3xl shadow-card border border-ink-100 min-h-[420px]">
            <LiveMap
              branches={branches.map((b: any) => ({
                id: b.id,
                name: b.name,
                city: b.city ?? undefined,
                latitude: b.latitude,
                longitude: b.longitude,
                radiusMeters: b.radiusMeters ?? 100,
                employees: b.employeeCount,
              }))}
              employees={[]}
            />
            <div className="pointer-events-none absolute right-4 top-4 z-[1000] flex gap-2">
              <Badge variant="brand" className="pointer-events-auto">
                {branches.length} Cabang
              </Badge>
              <Badge variant="success" className="pointer-events-auto">
                Geofence Aktif
              </Badge>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-card border border-ink-100">
            <div className="flex items-center gap-3">
              <Icon3D name="satellite" size={56} />
              <div>
                <p className="font-display font-bold">Pengaturan GPS</p>
                <p className="text-xs text-ink-500">Berlaku global</p>
              </div>
            </div>
            <ul className="mt-4 space-y-3">
              {[
                { k: "Validasi GPS Wajib", v: true },
                { k: "Deteksi Mock GPS", v: true },
                { k: "VPN Detection", v: true },
                { k: "Multi-lokasi Office", v: true },
                { k: "Live Tracking", v: false },
              ].map((s) => (
                <li
                  key={s.k}
                  className="flex items-center justify-between rounded-2xl bg-ink-50 p-3 text-sm"
                >
                  <span className="font-medium">{s.k}</span>
                  <span
                    className={`relative h-6 w-11 rounded-full transition ${
                      s.v ? "bg-brand-600" : "bg-ink-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        s.v ? "left-5" : "left-0.5"
                      }`}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {branches.length === 0 && (
            <div className="col-span-full rounded-3xl bg-white p-8 text-center text-sm text-ink-500 shadow-soft border border-ink-100">
              Belum ada cabang.
            </div>
          )}
          {branches.map((b: any) => (
            <div
              key={b.id}
              className="rounded-3xl bg-white p-5 shadow-card border border-ink-100"
            >
              <div className="flex items-start gap-3">
                <Icon3D name="buildings" size={56} />
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold truncate">{b.name}</p>
                  <p className="text-xs text-ink-500">{b.city}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setQrBranch(b)}
                    className="rounded-lg p-1.5 hover:bg-brand-50"
                    title="Generate QR Check-in"
                  >
                    <Icon3D name="qrcode" size={18} />
                  </button>
                  <button
                    onClick={() => setEditing(b)}
                    className="rounded-lg p-1.5 hover:bg-ink-100"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-ink-600" />
                  </button>
                  <button
                    onClick={() => setDeleteId(b.id)}
                    className="rounded-lg p-1.5 hover:bg-danger-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-danger-600" />
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-ink-600">
                <Row k="Latitude" v={b.latitude?.toFixed(4)} />
                <Row k="Longitude" v={b.longitude?.toFixed(4)} />
                <Row k="Radius" v={`${b.radiusMeters} m`} />
                <Row k="Pegawai" v={String(b.employeeCount)} bold />
              </div>
            </div>
          ))}
        </div>
      </div>

      <BranchModal
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
        title="Hapus cabang?"
        description="Pegawai di cabang ini akan kehilangan referensi cabang."
        loading={remove.isPending}
      />
      <QrGenerator
        open={!!qrBranch}
        onClose={() => setQrBranch(null)}
        branchId={qrBranch?.id ?? ""}
        branchName={qrBranch?.name}
      />
    </>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-400">{k}</span>
      <span className={bold ? "font-bold" : "font-mono"}>{v}</span>
    </div>
  );
}

function BranchModal({
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
    city: existing?.city ?? "",
    address: existing?.address ?? "",
    latitude: existing?.latitude ?? -6.2088,
    longitude: existing?.longitude ?? 106.8456,
    radiusMeters: existing?.radiusMeters ?? 100,
  });

  // sync when editing target changes
  if (existing && form.name !== existing.name && open) {
    setForm({
      name: existing.name ?? "",
      city: existing.city ?? "",
      address: existing.address ?? "",
      latitude: existing.latitude ?? -6.2088,
      longitude: existing.longitude ?? 106.8456,
      radiusMeters: existing.radiusMeters ?? 100,
    });
  }

  const save = useMutation({
    mutationFn: () =>
      existing
        ? api.adminBranchUpdate(existing.id, {
            ...form,
            latitude: Number(form.latitude),
            longitude: Number(form.longitude),
            radiusMeters: Number(form.radiusMeters),
          })
        : api.adminBranchCreate({
            ...form,
            latitude: Number(form.latitude),
            longitude: Number(form.longitude),
            radiusMeters: Number(form.radiusMeters),
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-branches"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      onClose();
    },
    onError: (e: any) => setError(e.message),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? "Edit Cabang" : "Tambah Cabang"}
      description="Atur lokasi & radius geofence"
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
        <Field label="Nama Cabang">
          <input
            required
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Kota">
          <input
            className="input"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </Field>
        <Field label="Alamat">
          <input
            className="input"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude">
            <input
              required
              type="number"
              step="any"
              className="input"
              value={form.latitude}
              onChange={(e) =>
                setForm({ ...form, latitude: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Longitude">
            <input
              required
              type="number"
              step="any"
              className="input"
              value={form.longitude}
              onChange={(e) =>
                setForm({ ...form, longitude: Number(e.target.value) })
              }
            />
          </Field>
        </div>
        <Field label="Radius (meter)">
          <input
            required
            type="number"
            min="10"
            className="input"
            value={form.radiusMeters}
            onChange={(e) =>
              setForm({ ...form, radiusMeters: Number(e.target.value) })
            }
          />
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
