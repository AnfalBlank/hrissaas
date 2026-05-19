"use client";

import dynamic from "next/dynamic";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Icon3D } from "@/components/Icon3D";
import { Camera, MapPin, ExternalLink, LogIn, LogOut } from "lucide-react";

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

  const hasCheckInGps =
    attendance.checkInLat != null && attendance.checkInLng != null;
  const hasCheckOutGps =
    attendance.checkOutLat != null && attendance.checkOutLng != null;
  const hasBranch =
    attendance.branchLatitude != null && attendance.branchLongitude != null;

  // Hitung durasi kerja
  let workDuration = "";
  if (attendance.checkInAt && attendance.checkOutAt) {
    const ms =
      new Date(attendance.checkOutAt).getTime() -
      new Date(attendance.checkInAt).getTime();
    const totalMin = Math.round(ms / 60_000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    workDuration = `${h}j ${m}m`;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={attendance.fullName}
      description={`${attendance.employeeCode} · ${attendance.date}`}
      size="lg"
    >
      <div className="max-h-[80vh] overflow-y-auto p-5 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Detail
            label="Status"
            value={<Badge variant={variant as any}>{label}</Badge>}
          />
          <Detail label="Cabang" value={attendance.branchName ?? "-"} />
          <Detail
            label="Durasi Kerja"
            value={workDuration || "Belum check-out"}
          />
          <Detail
            label="Lembur"
            value={
              attendance.overtimeMinutes
                ? `${attendance.overtimeMinutes} menit`
                : "—"
            }
          />
        </div>

        {/* Check-in section */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-800 mb-3">
            <LogIn className="h-4 w-4" />
            Check-in · {fmtT(attendance.checkInAt)}
          </h3>
          <div className="grid gap-3 lg:grid-cols-2">
            {/* Selfie check-in */}
            <div className="rounded-xl bg-white p-2">
              <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase text-ink-400">
                <Camera className="h-3 w-3" /> Foto Selfie
              </p>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-ink-100">
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
                      <Icon3D name="camera" size={40} className="mx-auto opacity-50" />
                      <p className="mt-1">Tidak ada foto</p>
                    </div>
                  </div>
                )}
                {attendance.checkInConfidence != null && (
                  <div className="absolute bottom-1 left-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white">
                    {Math.round(attendance.checkInConfidence * 100)}%
                  </div>
                )}
              </div>
            </div>

            {/* Map check-in */}
            <div className="rounded-xl bg-white p-2">
              <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase text-ink-400">
                <MapPin className="h-3 w-3" /> Lokasi GPS
              </p>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-ink-100">
                {hasCheckInGps ? (
                  <PointMap
                    key={`in-${attendance.id}`}
                    lat={attendance.checkInLat}
                    lng={attendance.checkInLng}
                    branchLat={hasBranch ? attendance.branchLatitude : undefined}
                    branchLng={hasBranch ? attendance.branchLongitude : undefined}
                    branchRadius={attendance.branchRadiusMeters}
                    branchName={attendance.branchName}
                    pointTitle={`Check-in ${new Date(attendance.checkInAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`}
                  />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-ink-500">
                    GPS tidak tercatat
                  </div>
                )}
              </div>
              {hasCheckInGps && (
                <a
                  href={`https://www.google.com/maps?q=${attendance.checkInLat},${attendance.checkInLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-[10px] text-brand-600 hover:underline"
                >
                  Buka Maps <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
            <div>
              <span className="text-ink-400">Metode:</span>{" "}
              <span className="font-semibold capitalize">{attendance.checkInMethod ?? "-"}</span>
            </div>
            <div>
              <span className="text-ink-400">Telat:</span>{" "}
              <span className="font-semibold">
                {attendance.lateMinutes ? `${attendance.lateMinutes}m` : "Tidak"}
              </span>
            </div>
            <div>
              <span className="text-ink-400">Koordinat:</span>{" "}
              <span className="font-mono text-[10px]">
                {hasCheckInGps
                  ? `${attendance.checkInLat.toFixed(5)}, ${attendance.checkInLng.toFixed(5)}`
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Check-out section */}
        <div
          className={`rounded-2xl border p-4 ${
            attendance.checkOutAt
              ? "border-blue-200 bg-blue-50/50"
              : "border-ink-200 bg-ink-50/50"
          }`}
        >
          <h3
            className={`flex items-center gap-2 text-sm font-bold mb-3 ${
              attendance.checkOutAt ? "text-blue-800" : "text-ink-500"
            }`}
          >
            <LogOut className="h-4 w-4" />
            Check-out · {attendance.checkOutAt ? fmtT(attendance.checkOutAt) : "Belum check-out"}
          </h3>

          {attendance.checkOutAt ? (
            <>
              <div className="grid gap-3 lg:grid-cols-2">
                {/* Selfie check-out */}
                <div className="rounded-xl bg-white p-2">
                  <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase text-ink-400">
                    <Camera className="h-3 w-3" /> Foto Selfie Keluar
                  </p>
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-ink-100">
                    {attendance.checkOutPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={attendance.checkOutPhotoUrl}
                        alt="selfie check-out"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-ink-500">
                        <div className="text-center">
                          <Icon3D name="camera" size={40} className="mx-auto opacity-50" />
                          <p className="mt-1">Tidak ada foto keluar</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Map check-out */}
                <div className="rounded-xl bg-white p-2">
                  <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase text-ink-400">
                    <MapPin className="h-3 w-3" /> Lokasi GPS Keluar
                  </p>
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-ink-100">
                    {hasCheckOutGps ? (
                      <PointMap
                        key={`out-${attendance.id}`}
                        lat={attendance.checkOutLat}
                        lng={attendance.checkOutLng}
                        branchLat={hasBranch ? attendance.branchLatitude : undefined}
                        branchLng={hasBranch ? attendance.branchLongitude : undefined}
                        branchRadius={attendance.branchRadiusMeters}
                        branchName={attendance.branchName}
                        pointTitle={`Check-out ${new Date(attendance.checkOutAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`}
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-ink-500">
                        GPS tidak tercatat
                      </div>
                    )}
                  </div>
                  {hasCheckOutGps && (
                    <a
                      href={`https://www.google.com/maps?q=${attendance.checkOutLat},${attendance.checkOutLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[10px] text-brand-600 hover:underline"
                    >
                      Buka Maps <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <span className="text-ink-400">Metode:</span>{" "}
                  <span className="font-semibold capitalize">
                    {attendance.checkOutMethod ?? "-"}
                  </span>
                </div>
                <div>
                  <span className="text-ink-400">Lembur:</span>{" "}
                  <span className="font-semibold">
                    {attendance.overtimeMinutes
                      ? `${attendance.overtimeMinutes}m`
                      : "Tidak"}
                  </span>
                </div>
                <div>
                  <span className="text-ink-400">Koordinat:</span>{" "}
                  <span className="font-mono text-[10px]">
                    {hasCheckOutGps
                      ? `${attendance.checkOutLat.toFixed(5)}, ${attendance.checkOutLng.toFixed(5)}`
                      : "—"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-ink-500">
              Pegawai belum melakukan check-out hari ini.
            </p>
          )}
        </div>

        {/* Notes */}
        {attendance.notes && (
          <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
            <strong>Catatan koreksi:</strong> {attendance.notes}
          </div>
        )}
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
    <div className="rounded-xl bg-white border border-ink-100 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
        {label}
      </p>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
