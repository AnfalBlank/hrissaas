"use client";

import dynamic from "next/dynamic";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Icon3D } from "@/components/Icon3D";
import { Camera, MapPin, ExternalLink } from "lucide-react";

const PointMap = dynamic(
  () => import("@/components/admin/LiveMap").then((m) => m.PointMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center bg-ink-100 text-xs text-ink-500">
        Memuat peta...
      </div>
    ),
  }
);

export function AttendanceDetail({
  open,
  onClose,
  attendance,
}: {
  open: boolean;
  onClose: () => void;
  attendance: any | null;
}) {
  if (!open || !attendance) return null;

  const fmtT = (ts: any) =>
    ts
      ? new Date(ts).toLocaleString("id-ID", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "—";

  const variant =
    attendance.status === "present"
      ? "success"
      : attendance.status === "late"
        ? "warning"
        : attendance.status === "leave" || attendance.status === "sick"
          ? "brand"
          : "default";
  const label =
    attendance.status === "present"
      ? "Hadir"
      : attendance.status === "late"
        ? `Telat ${attendance.lateMinutes ?? 0}m`
        : attendance.status;

  const hasGps =
    attendance.checkInLat != null && attendance.checkInLng != null;
  const hasBranch =
    attendance.branchLatitude != null && attendance.branchLongitude != null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={attendance.fullName}
      description={`${attendance.employeeCode} · ${attendance.date}`}
      size="lg"
    >
      <div className="grid gap-4 p-5 lg:grid-cols-2">
        {/* Selfie */}
        <div className="rounded-2xl bg-ink-50 p-3">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-500">
            <Camera className="h-3.5 w-3.5" />
            Foto Selfie Check-in
          </p>
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-ink-200">
            {attendance.checkInPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={attendance.checkInPhotoUrl}
                alt="selfie check-in"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-xs text-ink-500">
                <div className="text-center">
                  <Icon3D name="camera" size={56} className="mx-auto opacity-50" />
                  <p className="mt-2">Tidak ada foto selfie</p>
                  <p className="mt-0.5 text-[10px]">
                    {attendance.checkInMethod === "qr"
                      ? "Check-in via QR (tanpa foto)"
                      : "Foto belum dikirim"}
                  </p>
                </div>
              </div>
            )}
            {attendance.checkInConfidence != null && (
              <div className="absolute bottom-2 left-2 rounded-full bg-success-500 px-2 py-0.5 text-[10px] font-bold text-white">
                Confidence {Math.round(attendance.checkInConfidence * 100)}%
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="rounded-2xl bg-ink-50 p-3">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-500">
            <MapPin className="h-3.5 w-3.5" />
            Lokasi Check-in
          </p>
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-ink-200">
            {hasGps ? (
              <PointMap
                lat={attendance.checkInLat}
                lng={attendance.checkInLng}
                branchLat={
                  hasBranch ? attendance.branchLatitude : undefined
                }
                branchLng={
                  hasBranch ? attendance.branchLongitude : undefined
                }
                branchRadius={attendance.branchRadiusMeters}
                branchName={attendance.branchName}
                pointTitle={`${attendance.fullName} · ${new Date(attendance.checkInAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`}
              />
            ) : (
              <div className="grid h-full place-items-center text-xs text-ink-500">
                <div className="text-center">
                  <Icon3D name="pin" size={56} className="mx-auto opacity-50" />
                  <p className="mt-2">Lokasi GPS tidak tercatat</p>
                </div>
              </div>
            )}
          </div>
          {hasGps && (
            <a
              href={`https://www.google.com/maps?q=${attendance.checkInLat},${attendance.checkInLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline"
            >
              Buka di Google Maps <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Detail card */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-ink-100 p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Detail label="Status" value={<Badge variant={variant as any}>{label}</Badge>} />
            <Detail
              label="Cabang"
              value={attendance.branchName ?? "-"}
            />
            <Detail
              label="Metode"
              value={
                <span className="inline-flex items-center gap-1 capitalize">
                  <Icon3D
                    name={
                      attendance.checkInMethod === "qr"
                        ? "qrcode"
                        : attendance.checkInMethod === "manual"
                          ? "pen"
                          : "face"
                    }
                    size={20}
                  />
                  {attendance.checkInMethod ?? "-"}
                </span>
              }
            />
            <Detail
              label="Lembur"
              value={
                attendance.overtimeMinutes
                  ? `${attendance.overtimeMinutes} menit`
                  : "—"
              }
            />
            <Detail label="Check-in" value={fmtT(attendance.checkInAt)} />
            <Detail label="Check-out" value={fmtT(attendance.checkOutAt)} />
            <Detail
              label="Telat"
              value={
                attendance.lateMinutes
                  ? `${attendance.lateMinutes} menit`
                  : "—"
              }
            />
            <Detail
              label="Koordinat"
              value={
                hasGps
                  ? `${attendance.checkInLat.toFixed(5)}, ${attendance.checkInLng.toFixed(5)}`
                  : "—"
              }
            />
          </div>
          {attendance.notes && (
            <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
              <strong>Catatan koreksi:</strong> {attendance.notes}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
        {label}
      </p>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
