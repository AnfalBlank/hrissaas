"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/admin/TopBar";
import { Icon3D } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Save, Zap } from "lucide-react";

export default function IntegrationsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-integrations"],
    queryFn: () => api.adminIntegrations(),
  });
  const { data: status } = useQuery({
    queryKey: ["system-status"],
    queryFn: () => api.adminSystemStatus(),
  });

  const [tgToken, setTgToken] = useState("");
  const [waToken, setWaToken] = useState("");
  const [waPhoneId, setWaPhoneId] = useState("");
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setTgToken(data.telegramBotToken ?? "");
      setWaToken(data.whatsappToken ?? "");
      setWaPhoneId(data.whatsappPhoneId ?? "");
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      api.adminIntegrationsUpdate({
        telegramBotToken: tgToken || null,
        whatsappToken: waToken || null,
        whatsappPhoneId: waPhoneId || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-integrations"] });
      qc.invalidateQueries({ queryKey: ["system-status"] });
      setSaved(true);
      setError(null);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e: any) => setError(e.message),
  });

  const testTg = useMutation({
    mutationFn: () => api.adminIntegrationsTestTelegram(tgToken),
    onSuccess: (res) => setTestResult(res),
    onError: (e: any) => setTestResult({ ok: false, error: e.message }),
  });

  return (
    <>
      <TopBar
        title="Integrasi"
        subtitle="Konfigurasi Telegram Bot & WhatsApp"
        actions={
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="h-4 w-4" />
            {save.isPending ? "Menyimpan..." : saved ? "Tersimpan ✓" : "Simpan"}
          </Button>
        }
      />
      <div className="space-y-4 p-6">
        {error && (
          <div className="rounded-2xl bg-danger-500/10 p-3 text-sm text-danger-600">
            {error}
          </div>
        )}

        {/* Telegram */}
        <div className="rounded-3xl bg-white p-5 shadow-card border border-ink-100">
          <div className="flex items-center gap-3">
            <Icon3D name="chat" size={56} />
            <div className="flex-1">
              <p className="font-display font-bold">Telegram Bot</p>
              <p className="text-xs text-ink-500">
                Kirim notifikasi ke pegawai via Telegram
              </p>
            </div>
            <Badge variant={status?.telegram ? "success" : "warning"}>
              {status?.telegram ? "Connected" : "Not configured"}
            </Badge>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-cyan-50 p-3 text-xs text-cyan-900">
              <strong>Cara setup:</strong>
              <ol className="mt-1 list-decimal pl-4 space-y-1">
                <li>Buka Telegram, cari @BotFather</li>
                <li>Kirim /newbot → ikuti instruksi → dapat token</li>
                <li>Paste token di bawah</li>
                <li>Pegawai chat ke bot → kirim /start → catat chat_id yang dikasih bot</li>
                <li>Set chat_id di form edit pegawai</li>
              </ol>
            </div>

            <div>
              <label className="label">Bot Token</label>
              <input
                className="input font-mono text-sm"
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                value={tgToken}
                onChange={(e) => setTgToken(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => testTg.mutate()}
                disabled={!tgToken || tgToken.startsWith("***") || testTg.isPending}
              >
                <Zap className="h-4 w-4" />
                {testTg.isPending ? "Testing..." : "Test Koneksi"}
              </Button>
              {testResult && (
                <Badge variant={testResult.ok ? "success" : "danger"}>
                  {testResult.ok
                    ? `✓ Bot: @${testResult.botName}`
                    : `✗ ${testResult.error}`}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="rounded-3xl bg-white p-5 shadow-card border border-ink-100">
          <div className="flex items-center gap-3">
            <Icon3D name="chat" size={56} />
            <div className="flex-1">
              <p className="font-display font-bold">WhatsApp Cloud API</p>
              <p className="text-xs text-ink-500">
                Kirim notifikasi ke pegawai via WhatsApp
              </p>
            </div>
            <Badge variant={status?.whatsapp ? "success" : "warning"}>
              {status?.whatsapp ? "Connected" : "Not configured"}
            </Badge>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-900">
              <strong>Cara setup:</strong>
              <ol className="mt-1 list-decimal pl-4 space-y-1">
                <li>Buka Meta Business Suite → WhatsApp → API Setup</li>
                <li>Buat Permanent Token</li>
                <li>Catat Phone Number ID</li>
                <li>Paste keduanya di bawah</li>
              </ol>
            </div>

            <div>
              <label className="label">Access Token</label>
              <input
                className="input font-mono text-sm"
                placeholder="EAABx..."
                value={waToken}
                onChange={(e) => setWaToken(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Phone Number ID</label>
              <input
                className="input font-mono text-sm"
                placeholder="1234567890"
                value={waPhoneId}
                onChange={(e) => setWaPhoneId(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Status overview */}
        <div className="rounded-3xl bg-white p-5 shadow-card border border-ink-100">
          <p className="font-display font-bold mb-3">Status Integrasi</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { l: "Telegram Bot", ok: status?.telegram },
              { l: "WhatsApp Cloud API", ok: status?.whatsapp },
              { l: "Cloudflare R2 Storage", ok: status?.r2 },
              { l: "Socket.IO Realtime", ok: status?.socketIO },
            ].map((s) => (
              <div
                key={s.l}
                className="flex items-center justify-between rounded-2xl bg-ink-50 p-3"
              >
                <span className="text-sm font-medium">{s.l}</span>
                <Badge variant={s.ok ? "success" : "warning"}>
                  {s.ok ? "Active" : "Off"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
