"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { PageHeader } from "@/components/employee/PageHeader";
import { Icon3D, type Icon3DName } from "@/components/Icon3D";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { ChevronRight, LogOut } from "lucide-react";

type Action = "edit" | "password" | null;

export default function ProfilePage() {
  const router = useRouter();
  const [action, setAction] = useState<Action>(null);

  const { data } = useQuery({ queryKey: ["me"], queryFn: () => api.me() });
  const user = data?.user;
  const employee = data?.employee;
  const initials =
    employee?.fullName
      ?.split(" ")
      .map((s: string) => s[0])
      .slice(0, 2)
      .join("") ?? "U";

  async function handleLogout() {
    try {
      await api.logout();
    } catch {}
    router.push("/login");
    router.refresh();
  }

  const SECTIONS: {
    title: string;
    items: {
      icon: Icon3DName;
      label: string;
      sub?: string;
      onClick?: () => void;
    }[];
  }[] = [
    {
      title: "Akun",
      items: [
        {
          icon: "card",
          label: "Edit Profil",
          sub: "Nama, telepon, bank",
          onClick: () => setAction("edit"),
        },
        {
          icon: "key",
          label: "Ubah Password",
          sub: "Update kredensial",
          onClick: () => setAction("password"),
        },
        {
          icon: "face",
          label: "Daftar Wajah Ulang",
          sub: "Re-register face data via kamera",
          onClick: () => router.push("/app/attendance"),
        },
      ],
    },
    {
      title: "Aktivitas",
      items: [
        {
          icon: "history",
          label: "Riwayat Absensi",
          sub: "Daily check-in/out",
          onClick: () => router.push("/app/history"),
        },
        {
          icon: "stopwatch",
          label: "Timesheet",
          sub: "Jam kerja bulanan",
          onClick: () => router.push("/app/timesheet"),
        },
        {
          icon: "fire",
          label: "Lembur Saya",
          sub: "Pengajuan & riwayat",
          onClick: () => router.push("/app/overtime"),
        },
        {
          icon: "beach",
          label: "Cuti Saya",
          sub: "Kuota + pengajuan",
          onClick: () => router.push("/app/leave"),
        },
        {
          icon: "payroll",
          label: "Slip Gaji",
          sub: "Download PDF",
          onClick: () => router.push("/app/payroll"),
        },
      ],
    },
    {
      title: "Lainnya",
      items: [
        {
          icon: "bell",
          label: "Notifikasi",
          sub: "Inbox push & WhatsApp",
          onClick: () => router.push("/app/notifications"),
        },
        {
          icon: "newspaper",
          label: "Informasi Perusahaan",
          sub: "Pengumuman & artikel",
          onClick: () => router.push("/app/news"),
        },
        {
          icon: "chat",
          label: "Chat HR",
          sub: "Live support",
          onClick: () => router.push("/app/chat"),
        },
        {
          icon: "qrcode",
          label: "QR Check-in",
          sub: "Scan QR untuk absensi",
          onClick: () => router.push("/app/qr"),
        },
      ],
    },
  ];

  return (
    <div className="px-4 pt-4">
      <PageHeader title="Akun Saya" />

      <div className="rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 p-5 text-white shadow-card">
        <div className="flex items-center gap-4">
          <div className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-white/20 text-2xl font-extrabold ring-2 ring-white/30 backdrop-blur">
            {employee?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={employee.avatarUrl}
                alt="avatar"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-extrabold">
              {employee?.fullName ?? "Loading..."}
            </p>
            <p className="text-xs text-white/80">{employee?.position}</p>
            <p className="mt-1 text-[11px] text-white/70">
              {employee?.employeeCode} · Divisi {employee?.division}
            </p>
          </div>
          <Icon3D name="employee" size={56} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ["Email", user?.email?.split("@")[0] ?? "-"],
            ["Role", user?.role ?? "-"],
            ["Status", employee?.status ?? "-"],
          ].map(([l, v]) => (
            <div
              key={l}
              className="rounded-2xl bg-white/15 p-2 backdrop-blur-sm overflow-hidden"
            >
              <p className="text-[10px] text-white/80">{l}</p>
              <p className="truncate font-bold text-sm">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <p className="section-title px-1">{s.title}</p>
            <ul className="mt-2 overflow-hidden rounded-3xl bg-white shadow-soft border border-ink-100">
              {s.items.map((it, i) => (
                <li
                  key={it.label}
                  onClick={it.onClick}
                  className={`flex items-center gap-3 px-3 py-3 ${
                    i > 0 ? "border-t border-ink-100" : ""
                  } ${it.onClick ? "cursor-pointer hover:bg-ink-50 active:scale-[0.99] transition" : ""}`}
                >
                  <Icon3D name={it.icon} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{it.label}</p>
                    {it.sub && (
                      <p className="text-[11px] text-ink-500">{it.sub}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink-400" />
                </li>
              ))}
            </ul>
          </div>
        ))}

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-danger-600 shadow-soft border border-ink-100"
        >
          <LogOut className="h-4 w-4" /> Keluar dari akun
        </button>
        <p className="pb-4 text-center text-[11px] text-ink-400">
          Manggala v2.4 · Build 2026.05
        </p>
      </div>

      <EditProfileModal
        open={action === "edit"}
        onClose={() => setAction(null)}
        employee={employee}
      />
      <ChangePasswordModal
        open={action === "password"}
        onClose={() => setAction(null)}
      />
    </div>
  );
}

function EditProfileModal({
  open,
  onClose,
  employee,
}: {
  open: boolean;
  onClose: () => void;
  employee: any;
}) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    fullName: employee?.fullName ?? "",
    phone: employee?.phone ?? "",
    bankName: employee?.bankName ?? "",
    bankAccount: employee?.bankAccount ?? "",
    avatarUrl: employee?.avatarUrl ?? "",
  });

  if (employee && form.fullName === "" && open) {
    setForm({
      fullName: employee.fullName ?? "",
      phone: employee.phone ?? "",
      bankName: employee.bankName ?? "",
      bankAccount: employee.bankAccount ?? "",
      avatarUrl: employee.avatarUrl ?? "",
    });
  }

  async function handleAvatarUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.onerror = reject;
        fr.readAsDataURL(file);
      });
      const result = await api.uploadDataUrl(dataUrl, file.name, "avatar");
      setForm((f) => ({ ...f, avatarUrl: result.url }));
    } catch (e: any) {
      setError(e.message || "Upload gagal");
    } finally {
      setUploading(false);
    }
  }

  const save = useMutation({
    mutationFn: () => api.updateProfile(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      onClose();
      setError(null);
    },
    onError: (e: any) => setError(e.message),
  });

  return (
    <Modal open={open} onClose={onClose} title="Edit Profil" size="md">
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
        <div className="flex items-center gap-3">
          <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-brand-100 text-xl font-extrabold text-brand-700 overflow-hidden">
            {form.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.avatarUrl}
                alt="avatar"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              form.fullName
                ?.split(" ")
                .map((s: string) => s[0])
                .slice(0, 2)
                .join("")
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs text-ink-500">Foto Profil</p>
            <label className="mt-1 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
              {uploading ? "Mengupload..." : "Pilih Foto"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatarUpload(f);
                }}
              />
            </label>
          </div>
        </div>
        <Field label="Nama Lengkap">
          <input
            required
            className="input"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </Field>
        <Field label="Nomor Telepon (untuk WhatsApp)">
          <input
            className="input"
            placeholder="08xxx atau 628xxx"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>
        <Field label="Bank">
          <input
            className="input"
            value={form.bankName}
            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
          />
        </Field>
        <Field label="Nomor Rekening">
          <input
            className="input"
            value={form.bankAccount}
            onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
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

function ChangePasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    current: "",
    newPwd: "",
    confirm: "",
  });

  const save = useMutation({
    mutationFn: () => api.changePassword(form.current, form.newPwd),
    onSuccess: () => {
      onClose();
      setForm({ current: "", newPwd: "", confirm: "" });
      setError(null);
    },
    onError: (e: any) => setError(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPwd !== form.confirm) {
      setError("Konfirmasi password tidak cocok");
      return;
    }
    save.mutate();
  }

  return (
    <Modal open={open} onClose={onClose} title="Ubah Password" size="sm">
      <form onSubmit={submit} className="space-y-3 p-5">
        {error && (
          <p className="rounded-xl bg-danger-500/10 p-3 text-xs text-danger-600">
            {error}
          </p>
        )}
        <Field label="Password Lama">
          <input
            type="password"
            required
            className="input"
            value={form.current}
            onChange={(e) => setForm({ ...form, current: e.target.value })}
          />
        </Field>
        <Field label="Password Baru">
          <input
            type="password"
            required
            minLength={6}
            className="input"
            value={form.newPwd}
            onChange={(e) => setForm({ ...form, newPwd: e.target.value })}
          />
        </Field>
        <Field label="Konfirmasi Password Baru">
          <input
            type="password"
            required
            className="input"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
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
            {save.isPending ? "Menyimpan..." : "Ubah"}
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
