"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Icon3D } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/employee/PageHeader";
import { api } from "@/lib/api";
import { runLivenessDetection, type LivenessResult } from "@/lib/liveness";
import { formatMinutes } from "@/lib/duration";
import { useToast } from "@/components/ui/Toast";
import {
  CheckCircle2,
  Eye,
  MapPin,
  ScanFace,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

type Step = "intro" | "camera" | "liveness" | "scanning" | "success" | "error";

export default function AttendancePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();

  const { data: attData } = useQuery({
    queryKey: ["attendance-me"],
    queryFn: () => api.attendanceMe(),
  });

  const isCheckedIn = !!attData?.today?.checkInAt;
  const isCheckedOut = !!attData?.today?.checkOutAt;
  const action: "checkin" | "checkout" =
    isCheckedIn && !isCheckedOut ? "checkout" : "checkin";

  const [step, setStep] = useState<Step>("intro");
  const [progress, setProgress] = useState(0);
  const [coords, setCoords] = useState<GeolocationPosition | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [livenessResult, setLivenessResult] = useState<LivenessResult | null>(
    null
  );
  const [livenessProgress, setLivenessProgress] = useState(0);

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
  });
  const branch = meData?.branch;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("GPS tidak tersedia di device ini.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords(pos),
      (err) => setGpsError(err.message),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }, []);

  // Manage camera stream for camera + liveness steps
  useEffect(() => {
    if (step !== "camera" && step !== "liveness") return;
    let cancelled = false;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 480, height: 640 },
          audio: false,
        });
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        setErrorMsg(
          "Tidak bisa mengakses kamera. Pastikan izin kamera diaktifkan."
        );
        setStep("error");
      }
    })();
    return () => {
      cancelled = true;
      if (step === "camera") {
        // Don't stop stream if transitioning to liveness
      } else {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Liveness detection challenge
  useEffect(() => {
    if (step !== "liveness") return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let cancelled = false;
    setLivenessProgress(0);

    (async () => {
      // Beri sedikit waktu untuk user membaca instruksi
      await new Promise((r) => setTimeout(r, 800));
      if (cancelled) return;

      const result = await runLivenessDetection(video, canvas, {
        durationMs: 3500,
        onProgress: (pct) => {
          if (!cancelled) setLivenessProgress(pct);
        },
      });

      if (cancelled) return;
      setLivenessResult(result);

      if (result.passed) {
        // Liveness passed — capture selfie lalu submit
        capturePhoto();
        setStep("scanning");
      } else {
        // Gagal — tampilkan error
        setErrorMsg(
          result.motionDetected
            ? "Kedipan mata tidak terdeteksi. Pastikan wajah terlihat jelas dan kedipkan mata."
            : "Tidak ada gerakan terdeteksi. Pastikan bukan foto atau screenshot."
        );
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setStep("error");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Submit when scanning (upload foto + API call)
  useEffect(() => {
    if (step !== "scanning" || !coords || !selfieDataUrl) return;
    (async () => {
      try {
        setProgress(0);
        // Simulate upload progress
        const progressTimer = setInterval(() => {
          setProgress((p) => Math.min(90, p + 15));
        }, 200);

        let photoUrl: string | undefined;
        try {
          const up = await api.uploadDataUrl(
            selfieDataUrl,
            `selfie-${Date.now()}.jpg`,
            "selfie"
          );
          photoUrl = up.url;
        } catch {}

        clearInterval(progressTimer);
        setProgress(95);

        const confidence = livenessResult?.confidence ?? 0.7;
        const payload = {
          latitude: coords.coords.latitude,
          longitude: coords.coords.longitude,
          method: "face" as const,
          confidence,
        };
        const data =
          action === "checkin"
            ? await api.checkIn({ ...payload, photoUrl })
            : await api.checkOut({ ...payload, photoUrl });

        setProgress(100);
        setResult(data);
        setStep("success");
        qc.invalidateQueries({ queryKey: ["attendance-me"] });

        // Toast notif
        if (action === "checkin") {
          const isLate = (data as any)?.status === "late";
          toast.success(
            "Berhasil absen masuk! 👋",
            isLate
              ? `Anda tercatat telat ${formatMinutes((data as any).lateMinutes)}. Semangat bekerja!`
              : "Tepat waktu. Selamat bekerja, semoga harimu produktif!"
          );
        } else {
          toast.success(
            "Berhasil absen pulang! 🏠",
            "Terima kasih atas kerja kerasmu hari ini. Selamat beristirahat!"
          );
        }
      } catch (e: any) {
        setErrorMsg(e.message || "Gagal absen");
        setStep("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, coords, selfieDataUrl]);

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);
      try {
        const url = canvas.toDataURL("image/jpeg", 0.85);
        setSelfieDataUrl(url);
      } catch {}
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function startLiveness() {
    // Transition dari camera ke liveness (keep stream alive)
    setLivenessResult(null);
    setStep("liveness");
  }

  const confidencePct = livenessResult
    ? Math.round(livenessResult.confidence * 100)
    : 0;

  return (
    <div className="px-4 pt-4">
      <PageHeader
        title="Absensi"
        subtitle={
          action === "checkin"
            ? "Check-in dengan Liveness Detection"
            : "Check-out dengan Liveness Detection"
        }
      />

      {step === "intro" && (
        <>
          <div className="rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600 p-5 text-white shadow-card">
            <div className="flex items-center gap-3">
              <Icon3D name="face" size={64} />
              <div>
                <p className="text-xs text-white/80">Siap absen?</p>
                <p className="font-display text-xl font-extrabold">
                  {action === "checkin"
                    ? "Selfie & verifikasi hidup"
                    : "Check-out hari ini"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat
              icon="satellite"
              title="GPS"
              value={coords ? "Aktif" : gpsError ? "Error" : "Loading..."}
              hint={
                coords
                  ? `±${Math.round(coords.coords.accuracy)}m`
                  : gpsError ?? ""
              }
              ok={!!coords}
            />
            <Stat
              icon="shield"
              title="Liveness"
              value="Challenge"
              hint="Kedipkan mata"
              ok
            />
            <Stat
              icon="bullseye"
              title="Lokasi"
              value={coords ? "Terdeteksi" : "—"}
              hint={
                coords
                  ? `${coords.coords.latitude.toFixed(4)}, ${coords.coords.longitude.toFixed(4)}`
                  : "—"
              }
              ok={!!coords}
            />
            <Stat
              icon="warning"
              title="Anti-Spoof"
              value="Frame Diff"
              hint="Motion + blink"
              ok
            />
          </div>

          {gpsError && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-danger-500/10 p-3 text-sm text-danger-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">GPS tidak tersedia</p>
                <p className="text-xs">{gpsError}</p>
              </div>
            </div>
          )}

          <div className="mt-4 rounded-3xl bg-white p-4 shadow-card border border-ink-100">
            <p className="font-display font-bold">Lokasi Absen</p>
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-ink-50 p-3 text-sm">
              <MapPin className="h-5 w-5 text-brand-600" />
              <div>
                <p className="font-semibold text-ink-800">
                  {branch?.name ?? "Belum ada cabang"}
                </p>
                <p className="text-xs text-ink-500">
                  {branch?.address ?? branch?.city ?? "—"}
                </p>
              </div>
            </div>
          </div>

          <Button
            block
            size="xl"
            className="mt-5"
            disabled={!coords}
            onClick={() => setStep("camera")}
          >
            <ScanFace className="h-5 w-5" />
            {action === "checkin"
              ? "Mulai Liveness Check"
              : "Mulai Check-out"}
          </Button>
          <p className="mt-2 text-center text-[11px] text-ink-500">
            Anda akan diminta kedipkan mata untuk verifikasi.
          </p>
        </>
      )}

      {step === "camera" && (
        <div className="rounded-3xl bg-ink-900 p-4 text-white shadow-card">
          <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-2xl bg-ink-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="h-56 w-56 rounded-full border-2 border-dashed border-white/60" />
            </div>
            {[
              "left-3 top-3 border-l-4 border-t-4",
              "right-3 top-3 border-r-4 border-t-4",
              "left-3 bottom-3 border-l-4 border-b-4",
              "right-3 bottom-3 border-r-4 border-b-4",
            ].map((c, i) => (
              <div
                key={i}
                className={`pointer-events-none absolute h-7 w-7 ${c} rounded-md border-brand-400`}
              />
            ))}
            <div className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-black/50 px-3 py-1 text-xs">
              Posisikan wajah dalam lingkaran
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setStep("intro")}>
              Batal
            </Button>
            <Button onClick={startLiveness}>
              <Eye className="h-4 w-4" /> Mulai Verifikasi
            </Button>
          </div>
        </div>
      )}

      {step === "liveness" && (
        <div className="rounded-3xl bg-ink-900 p-4 text-white shadow-card">
          <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-2xl bg-ink-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            {/* Scanning overlay */}
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="relative h-56 w-56">
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-emerald-400 animate-spin [animation-duration:4s]" />
                <div className="absolute inset-0 grid place-items-center">
                  <div className="rounded-2xl bg-black/60 px-4 py-2 text-center backdrop-blur">
                    <Eye className="mx-auto h-6 w-6 text-emerald-400 animate-pulse" />
                    <p className="mt-1 text-sm font-bold">Kedipkan Mata</p>
                    <p className="text-[10px] text-white/70">
                      Deteksi sedang berjalan...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-white/80">
              <span>Liveness Detection</span>
              <span className="font-mono">{livenessProgress}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                style={{ width: `${livenessProgress}%` }}
              />
            </div>
            <ul className="mt-3 space-y-1 text-xs text-white/70">
              <li className={livenessProgress > 20 ? "text-emerald-400" : ""}>
                {livenessProgress > 20 ? "✓" : "○"} Mendeteksi gerakan wajah...
              </li>
              <li className={livenessProgress > 50 ? "text-emerald-400" : ""}>
                {livenessProgress > 50 ? "✓" : "○"} Mendeteksi kedipan mata...
              </li>
              <li className={livenessProgress > 80 ? "text-emerald-400" : ""}>
                {livenessProgress > 80 ? "✓" : "○"} Analisis anti-spoof...
              </li>
            </ul>
          </div>
        </div>
      )}

      {step === "scanning" && (
        <div className="rounded-3xl bg-ink-900 p-4 text-white shadow-card">
          <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-ink-700 to-ink-900">
            {selfieDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selfieDataUrl}
                alt="selfie"
                className="absolute inset-0 h-full w-full object-cover opacity-90"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <Icon3D name="face" size={120} className="animate-pulseSoft" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-black/50 px-3 py-1 text-xs">
              Mengirim data absensi...
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-white/80">
              <span>Upload & Submit</span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-brand-400 to-accent-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <ul className="mt-3 space-y-1 text-xs text-white/70">
              <li className="text-emerald-400">✓ Liveness passed ({confidencePct}%)</li>
              <li className={progress > 30 ? "text-emerald-400" : ""}>
                {progress > 30 ? "✓" : "○"} Upload foto selfie
              </li>
              <li className={progress > 80 ? "text-emerald-400" : ""}>
                {progress > 80 ? "✓" : "○"} Verifikasi GPS & submit
              </li>
            </ul>
          </div>
        </div>
      )}

      {step === "success" && (
        <div className="text-center">
          <div className="relative mx-auto mt-4 grid h-32 w-32 place-items-center">
            <div className="absolute inset-0 rounded-full bg-success-500/20 animate-pulseSoft" />
            <div className="grid h-24 w-24 place-items-center rounded-full bg-success-500 text-white">
              <CheckCircle2 className="h-12 w-12" />
            </div>
          </div>
          <h2 className="mt-5 font-display text-2xl font-extrabold">
            {action === "checkin" ? "Check-in" : "Check-out"} Berhasil!
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Liveness verified · Confidence {confidencePct}%
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 text-left">
            <div className="rounded-2xl bg-white p-3 shadow-soft border border-ink-100">
              <p className="text-[11px] text-ink-500">Waktu</p>
              <p className="font-bold">
                {new Date().toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-3 shadow-soft border border-ink-100">
              <p className="text-[11px] text-ink-500">Status</p>
              <Badge
                variant={result?.status === "late" ? "warning" : "success"}
              >
                {result?.status === "late"
                  ? `Telat ${formatMinutes(result.lateMinutes)}`
                  : action === "checkin"
                    ? "Tepat waktu"
                    : "Selesai"}
              </Badge>
            </div>
          </div>

          {livenessResult && (
            <div className="mt-3 rounded-2xl bg-ink-50 p-3 text-left text-xs border border-ink-100">
              <p className="font-semibold text-ink-700">Detail Verifikasi</p>
              <div className="mt-1 grid grid-cols-3 gap-2">
                <div>
                  <p className="text-ink-400">Motion</p>
                  <p className={livenessResult.motionDetected ? "text-emerald-600 font-bold" : "text-danger-600 font-bold"}>
                    {livenessResult.motionDetected ? "✓ Detected" : "✗ None"}
                  </p>
                </div>
                <div>
                  <p className="text-ink-400">Blink</p>
                  <p className={livenessResult.blinkDetected ? "text-emerald-600 font-bold" : "text-danger-600 font-bold"}>
                    {livenessResult.blinkDetected ? "✓ Detected" : "✗ None"}
                  </p>
                </div>
                <div>
                  <p className="text-ink-400">Score</p>
                  <p className="font-bold text-brand-700">{confidencePct}%</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={() => router.push("/app/history")}
            >
              Lihat Riwayat
            </Button>
            <Button onClick={() => router.push("/app")}>
              <ShieldCheck className="h-4 w-4" /> Selesai
            </Button>
          </div>
        </div>
      )}

      {step === "error" && (
        <div className="text-center">
          <div className="mx-auto mt-4 grid h-24 w-24 place-items-center rounded-full bg-danger-500 text-white">
            <AlertCircle className="h-12 w-12" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-extrabold">
            {errorMsg?.includes("kedipan") || errorMsg?.includes("gerakan")
              ? "Verifikasi Gagal"
              : "Absen Gagal"}
          </h2>
          <p className="mt-1 text-sm text-ink-600">{errorMsg}</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => router.push("/app")}>
              Batal
            </Button>
            <Button
              onClick={() => {
                setLivenessResult(null);
                setSelfieDataUrl(null);
                setErrorMsg(null);
                setStep("intro");
              }}
            >
              Coba Lagi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  title,
  value,
  hint,
  ok,
}: {
  icon: any;
  title: string;
  value: string;
  hint: string;
  ok?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft border border-ink-100">
      <Icon3D name={icon} size={40} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-ink-500">{title}</p>
        <p className="truncate font-bold">{value}</p>
        <p className="truncate text-[10px] text-ink-400">{hint}</p>
      </div>
      <div
        className={`h-2 w-2 rounded-full ${
          ok ? "bg-success-500" : "bg-warning-500"
        }`}
      />
    </div>
  );
}
