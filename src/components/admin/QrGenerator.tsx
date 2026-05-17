"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Icon3D } from "@/components/Icon3D";
import { RefreshCw } from "lucide-react";

export function QrGenerator({
  open,
  onClose,
  branchId,
  branchName,
}: {
  open: boolean;
  onClose: () => void;
  branchId: string;
  branchName?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.adminQrToken(branchId);
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, data.token, {
          width: 280,
          margin: 1,
          color: { dark: "#1B1F2C", light: "#FFFFFF" },
        });
      }
      setSecondsLeft(data.expiresInSec ?? 60);
    } catch (e: any) {
      setError(e.message || "Gagal generate QR");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, branchId]);

  // Countdown
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          refresh();
          return 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="QR Check-in"
      description={branchName ?? "Cabang"}
      size="md"
    >
      <div className="p-5">
        <div className="rounded-3xl bg-gradient-to-br from-brand-50 to-cyan-50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon3D name="qrcode" size={48} />
              <div>
                <p className="font-display font-bold">QR Aktif</p>
                <p className="text-xs text-ink-500">
                  Dynamic · expired otomatis
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-ink-500 uppercase">Habis dalam</p>
              <p className="font-display text-3xl font-extrabold text-brand-600 tabular-nums">
                {secondsLeft}
                <span className="text-sm font-normal text-ink-400">s</span>
              </p>
            </div>
          </div>
          <div className="mt-4 grid place-items-center rounded-2xl bg-white p-4">
            <canvas ref={canvasRef} className="rounded-xl" />
          </div>
          {error && (
            <p className="mt-3 rounded-xl bg-danger-500/10 p-2 text-center text-xs text-danger-600">
              {error}
            </p>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Refresh
          </Button>
          <Button onClick={onClose}>Tutup</Button>
        </div>
        <p className="mt-3 text-center text-[11px] text-ink-500">
          Pegawai scan QR ini lewat menu QR Check-in di app.
        </p>
      </div>
    </Modal>
  );
}
