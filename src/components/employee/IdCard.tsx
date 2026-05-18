"use client";

import { Modal } from "@/components/ui/Modal";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Calendar, Mail, MapPin, Phone, ShieldCheck, X } from "lucide-react";

export function IdCard({
  open,
  onClose,
  user,
  employee,
  branch,
  company,
}: {
  open: boolean;
  onClose: () => void;
  user: any;
  employee: any;
  branch?: any;
  company?: { name: string } | null;
}) {
  if (!open) return null;
  const initials =
    employee?.fullName
      ?.split(" ")
      .map((s: string) => s[0])
      .slice(0, 2)
      .join("") ?? "?";

  const fmtDate = (d: any) =>
    d
      ? new Date(d).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "-";

  return (
    <Modal open={open} onClose={onClose} size="md" sheetOnMobile={false}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-display text-lg font-bold">ID Card Pegawai</p>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-ink-500 hover:bg-ink-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Card */}
        <div className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-3xl shadow-card">
          {/* Top: brand gradient + logo */}
          <div className="relative bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 p-5 text-white">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
            <div className="absolute -left-8 bottom-0 h-20 w-20 rounded-full bg-white/10 blur-xl" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Logo size={32} className="ring-2 ring-white/40" />
                <div>
                  <p className="font-display text-sm font-extrabold leading-tight">
                    {company?.name ?? "Manggala"}
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-white/70">
                    Employee Card
                  </p>
                </div>
              </div>
              <ShieldCheck className="h-5 w-5 text-white/80" />
            </div>
          </div>

          {/* Avatar */}
          <div className="relative -mt-12 grid place-items-center">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-brand-100 shadow-lg">
              {employee?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={employee.avatarUrl}
                  alt={employee.fullName}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-2xl font-extrabold text-brand-700">
                  {initials}
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="bg-white px-5 pb-5 pt-3 text-center">
            <p className="font-display text-lg font-extrabold text-ink-900">
              {employee?.fullName ?? "-"}
            </p>
            <p className="text-xs text-ink-500">
              {employee?.position ?? "-"}
            </p>
            <p className="mt-1 inline-block rounded-full bg-brand-50 px-3 py-1 text-[11px] font-bold text-brand-700">
              {employee?.division ?? "Tanpa Divisi"}
            </p>

            {/* Divider */}
            <div className="my-4 h-px w-full bg-gradient-to-r from-transparent via-ink-200 to-transparent" />

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <Field
                icon={<MapPin className="h-3 w-3" />}
                label="ID"
                value={employee?.employeeCode ?? "-"}
              />
              <Field
                icon={<ShieldCheck className="h-3 w-3" />}
                label="Status"
                value={employee?.status === "active" ? "Aktif" : (employee?.status ?? "-")}
              />
              <Field
                icon={<Calendar className="h-3 w-3" />}
                label="Bergabung"
                value={fmtDate(employee?.joinDate)}
              />
              <Field
                icon={<MapPin className="h-3 w-3" />}
                label="Cabang"
                value={branch?.name ?? "-"}
              />
              <Field
                icon={<Mail className="h-3 w-3" />}
                label="Email"
                value={user?.email ?? "-"}
              />
              <Field
                icon={<Phone className="h-3 w-3" />}
                label="Telepon"
                value={employee?.phone ?? "-"}
              />
            </div>
          </div>

          {/* Bottom bar */}
          <div className="bg-gradient-to-r from-ink-900 to-ink-800 px-5 py-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
              {company?.name ?? "Manggala Attendance System"}
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          block
          className="mt-4"
          onClick={() => window.print()}
        >
          Cetak ID Card
        </Button>
      </div>
    </Modal>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-ink-50 p-2.5">
      <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-ink-400">
        {icon}
        {label}
      </div>
      <p className="mt-0.5 truncate text-xs font-semibold text-ink-800">
        {value}
      </p>
    </div>
  );
}
