"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import jsQR from "jsqr";
import { PageHeader } from "@/components/employee/PageHeader";
import { Icon3D } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { AlertCircle, CheckCircle2, Camera } from "lucide-react";

type Step = "scan" | "submit" | "success" | "error";

export default function QrAttendancePage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [step, setStep] = useState<Step>("scan");
  const [coords, setCoords] = useState<GeolocationPosition | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanRafRef = useRef<number | null>(null);
  const lockRef = useRef(false);

  // Get GPS
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords(pos),
      () => {},
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }, []);

  // Camera + scanning loop
  useEffect(() => {
    if (step !== "scan") return;
    let cancelled = false;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
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
        scan();
      } catch {
        setErrorMsg("Tidak bisa mengakses kamera. Pastikan izin diaktifkan.");
        setStep("error");
      }
    })();

    function scan() {
      const v = videoRef.current;
      const c = canvasRef.current;
      if (!v || !c || lockRef.current) {
        scanRafRef.current = requestAnimationFrame(scan);
        return;
      }
      if (v.readyState !== v.HAVE_ENOUGH_DATA) {
        scanRafRef.current = requestAnimationFrame(scan);
        return;
      }
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(v, 0, 0, c.width, c.height);
      const img = ctx.getImageData(0, 0, c.width, c.height);
      const code = jsQR(img.data, img.width, img.height, {
        inversionAttempts: "dontInvert",
      });
      if (code?.data) {
        lockRef.current = true;
        handleQrToken(code.data);
        return;
      }
      scanRafRef.current = requestAnimationFrame(scan);
    }

    return () => {
      cancelled = true;
      if (scanRafRef.current) cancelAnimationFrame(scanRafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [step]);

  async function handleQrToken(token: string) {
    if (!coords) {
      setErrorMsg("GPS belum siap. Tunggu sebentar lalu coba lagi.");
      setStep("error");
      return;
    }
    setStep("submit");
    try {
      const data = await api.qrCheckIn({
        token,
        latitude: coords.coords.latitude,
        longitude: coords.coords.longitude,
      });
      setResult(data);
      setStep("success");
      qc.invalidateQueries({ queryKey: ["attendance-me"] });
    } catch (e: any) {
      setErrorMsg(e.message || "QR Code tidak valid");
      setStep("error");
    }
  }

  return (
    <div className="px-4 pt-4">
      <PageHeader title="QR Check-in" subtitle="Scan QR di lokasi kantor" />

      {step === "scan" && (
        <>
          <div className="rounded-3xl bg-ink-900 p-3 text-white shadow-card">
            <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-2xl bg-ink-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="h-3/5 w-3/5 rounded-2xl border-2 border-dashed border-white/70" />
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
            </div>
            <p className="mt-3 text-center text-xs text-white/80">
              Arahkan kamera ke QR Code yang diberikan admin
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat
              icon="satellite"
              title="GPS"
              value={coords ? "Aktif" : "Loading..."}
              hint={
                coords ? `±${Math.round(coords.coords.accuracy)}m` : "—"
              }
              ok={!!coords}
            />
            <Stat
              icon="camera"
              title="Kamera"
              value="Aktif"
              hint="auto-scan"
              ok
            />
          </div>

          <Button
            block
            variant="secondary"
            className="mt-4"
            onClick={() => router.push("/app/attendance")}
          >
            <Camera className="h-4 w-4" /> Pakai Face Recognition
          </Button>
        </>
      )}

      {step === "submit" && (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
          <p className="mt-4 text-sm text-ink-600">Memvalidasi QR Code...</p>
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
            Check-in Berhasil!
          </h2>
          <p className="mt-1 text-sm text-ink-600">via QR Code</p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-left">
            <div className="rounded-2xl bg-white p-3 shadow-soft border border-ink-100">
              <p className="text-[11px] text-ink-500">Waktu</p>
              <p className="font-bold">
                {new Date().toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-3 shadow-soft border border-ink-100">
              <p className="text-[11px] text-ink-500">Status</p>
              <Badge
                variant={result?.status === "late" ? "warning" : "success"}
              >
                {result?.status === "late"
                  ? `Telat ${result.lateMinutes}m`
                  : "Tepat waktu"}
              </Badge>
            </div>
          </div>
          <Button block className="mt-5" onClick={() => router.push("/app")}>
            Selesai
          </Button>
        </div>
      )}

      {step === "error" && (
        <div className="text-center">
          <div className="mx-auto mt-4 grid h-24 w-24 place-items-center rounded-full bg-danger-500 text-white">
            <AlertCircle className="h-12 w-12" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-extrabold">
            Gagal Scan QR
          </h2>
          <p className="mt-1 text-sm text-ink-600">{errorMsg}</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => router.push("/app")}>
              Batal
            </Button>
            <Button
              onClick={() => {
                lockRef.current = false;
                setErrorMsg(null);
                setStep("scan");
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
