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

const TYPE_ICON: Record<string, Icon3DName> = {
  banner: "ticket",
  article: "graduationCap",
  announcement: "megaphone",
  promo: "party",
};
const TYPE_LABEL: Record<string, string> = {
  banner: "Banner",
  article: "Artikel",
  announcement: "Pengumuman",
  promo: "Promo",
};

export default function CmsPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: () => api.adminAnnouncements(),
  });
  const items = data?.items ?? [];

  const remove = useMutation({
    mutationFn: (id: string) => api.adminAnnouncementDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      qc.invalidateQueries({ queryKey: ["announcements"] });
      setDeleteId(null);
    },
  });

  const counts = {
    banner: items.filter((i: any) => i.type === "banner").length,
    article: items.filter((i: any) => i.type === "article").length,
    announcement: items.filter((i: any) => i.type === "announcement").length,
    promo: items.filter((i: any) => i.type === "promo").length,
  };

  return (
    <>
      <TopBar
        title="CMS Management"
        subtitle="Kelola banner, artikel, dan pengumuman"
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Konten Baru
          </Button>
        }
      />
      <div className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { l: "Banner", v: counts.banner, i: "ticket" as Icon3DName },
            { l: "Artikel", v: counts.article, i: "graduationCap" as Icon3DName },
            { l: "Pengumuman", v: counts.announcement, i: "megaphone" as Icon3DName },
            { l: "Promo", v: counts.promo, i: "party" as Icon3DName },
          ].map((s) => (
            <div
              key={s.l}
              className="flex items-center gap-3 rounded-3xl bg-white p-5 shadow-soft border border-ink-100"
            >
              <Icon3D name={s.i} size={56} />
              <div>
                <p className="text-xs text-ink-500">{s.l}</p>
                <p className="font-display text-2xl font-extrabold">{s.v}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-card border border-ink-100">
          <div className="border-b border-ink-100 px-5 py-4">
            <p className="font-display font-bold">Konten Terbaru</p>
          </div>
          <ul className="divide-y divide-ink-100">
            {items.length === 0 && (
              <li className="p-8 text-center text-sm text-ink-500">
                Belum ada konten.
              </li>
            )}
            {items.map((it: any) => (
              <li key={it.id} className="flex items-center gap-4 p-5">
                <Icon3D
                  name={TYPE_ICON[it.type] ?? "newspaper"}
                  size={56}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{it.title}</p>
                  <p className="text-xs text-ink-500 truncate">
                    {TYPE_LABEL[it.type] ?? it.type}
                    {it.createdAt &&
                      ` · ${new Date(it.createdAt).toLocaleDateString("id-ID")}`}
                  </p>
                </div>
                <Badge variant={it.status === "live" ? "success" : "default"}>
                  {it.status === "live" ? "Live" : "Draft"}
                </Badge>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing(it)}
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </Button>
                <button
                  onClick={() => setDeleteId(it.id)}
                  className="rounded-lg p-2 hover:bg-danger-500/10"
                >
                  <Trash2 className="h-4 w-4 text-danger-600" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <CmsModal
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
        title="Hapus konten?"
        description="Konten akan dihapus permanen dan tidak akan tampil di app pegawai."
        loading={remove.isPending}
      />
    </>
  );
}

function CmsModal({
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
    type: existing?.type ?? "announcement",
    title: existing?.title ?? "",
    excerpt: existing?.excerpt ?? "",
    content: existing?.content ?? "",
    imageUrl: existing?.imageUrl ?? "",
    category: existing?.category ?? "",
    status: existing?.status ?? "live",
  });

  if (existing && form.title !== existing.title && open) {
    setForm({
      type: existing.type,
      title: existing.title ?? "",
      excerpt: existing.excerpt ?? "",
      content: existing.content ?? "",
      imageUrl: existing.imageUrl ?? "",
      category: existing.category ?? "",
      status: existing.status ?? "live",
    });
  }

  const save = useMutation({
    mutationFn: () =>
      existing
        ? api.adminAnnouncementUpdate(existing.id, form)
        : api.adminAnnouncementCreate(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      qc.invalidateQueries({ queryKey: ["announcements"] });
      onClose();
    },
    onError: (e: any) => setError(e.message),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? "Edit Konten" : "Konten Baru"}
      size="lg"
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipe">
            <select
              className="input"
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as any })
              }
            >
              <option value="announcement">Pengumuman</option>
              <option value="article">Artikel</option>
              <option value="banner">Banner</option>
              <option value="promo">Promo</option>
            </select>
          </Field>
          <Field label="Status">
            <select
              className="input"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as any })
              }
            >
              <option value="live">Live</option>
              <option value="draft">Draft</option>
            </select>
          </Field>
        </div>
        <Field label="Judul">
          <input
            required
            className="input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Field>
        <Field label="Kategori (opsional)">
          <input
            className="input"
            placeholder="mis. Pengumuman, Promo"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </Field>
        <Field label="Ringkasan">
          <textarea
            className="input min-h-[64px]"
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          />
        </Field>
        <Field label="Konten Lengkap">
          <textarea
            className="input min-h-[120px]"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
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
