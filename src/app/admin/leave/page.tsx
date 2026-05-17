"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/admin/TopBar";
import { Icon3D } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { downloadFile } from "@/lib/download";
import { useRealtime } from "@/lib/realtime";
import { Check, FileSpreadsheet, FileText, X } from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  annual: "Cuti Tahunan",
  sick: "Sakit",
  permission: "Izin",
  emergency: "Darurat",
};

export default function LeaveAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-leave"],
    queryFn: () => api.adminLeave(),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin-leave"] });
  useRealtime("leave:applied", invalidate);
  useRealtime("leave:decided", invalidate);

  const decide = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "approved" | "rejected";
    }) => api.adminLeaveDecide(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-leave"] }),
  });

  const [exporting, setExporting] = useState<"" | "pdf" | "xlsx">("");
  async function handleExport(format: "pdf" | "xlsx") {
    setExporting(format);
    try {
      await downloadFile(`/api/admin/leave/export?format=${format}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setExporting("");
    }
  }

  const items = data?.items ?? [];
  const summary = data?.summary ?? { pending: 0, approved: 0, rejected: 0, total: 0 };

  return (
    <>
      <TopBar
        title="Persetujuan Cuti"
        subtitle="Approval & monitoring pengajuan cuti"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => handleExport("xlsx")}
              disabled={!!exporting}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {exporting === "xlsx" ? "Mengunduh..." : "Excel"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport("pdf")}
              disabled={!!exporting}
            >
              <FileText className="h-4 w-4" />
              {exporting === "pdf" ? "Mengunduh..." : "PDF"}
            </Button>
          </>
        }
      />
      <div className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { l: "Menunggu", v: summary.pending, i: "history" },
            { l: "Disetujui", v: summary.approved, i: "check" },
            { l: "Ditolak", v: summary.rejected, i: "cross" },
            { l: "Total", v: summary.total, i: "scroll" },
          ].map((s) => (
            <div
              key={s.l}
              className="flex items-center gap-3 rounded-3xl bg-white p-5 shadow-soft border border-ink-100"
            >
              <Icon3D name={s.i as any} size={48} />
              <div>
                <p className="text-xs text-ink-500">{s.l}</p>
                <p className="font-display text-2xl font-extrabold">{s.v}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-white shadow-card border border-ink-100 overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-4 flex items-center justify-between">
            <p className="font-display font-bold">Pengajuan Terbaru</p>
            <Badge variant="brand">{summary.pending} menunggu</Badge>
          </div>
          <ul className="divide-y divide-ink-100">
            {items.length === 0 && (
              <li className="p-8 text-center text-sm text-ink-500">
                Belum ada pengajuan cuti.
              </li>
            )}
            {items.map((l: any) => {
              const variant =
                l.status === "approved" ? "success" :
                l.status === "rejected" ? "danger" : "warning";
              const label =
                l.status === "approved" ? "Disetujui" :
                l.status === "rejected" ? "Ditolak" : "Menunggu";
              return (
                <li key={l.id} className="flex flex-wrap items-center gap-4 p-5">
                  <Icon3D name="beach" size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{l.fullName}</p>
                      <Badge variant={variant as any}>{label}</Badge>
                    </div>
                    <p className="text-xs text-ink-500">
                      {TYPE_LABEL[l.type] ?? l.type} · {l.fromDate} → {l.toDate}{" "}
                      · {l.days} hari
                    </p>
                    {l.reason && (
                      <p className="mt-1 text-xs text-ink-600">
                        Alasan: {l.reason}
                      </p>
                    )}
                  </div>
                  {l.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={decide.isPending}
                        onClick={() =>
                          decide.mutate({ id: l.id, status: "rejected" })
                        }
                      >
                        <X className="h-4 w-4" /> Tolak
                      </Button>
                      <Button
                        size="sm"
                        disabled={decide.isPending}
                        onClick={() =>
                          decide.mutate({ id: l.id, status: "approved" })
                        }
                      >
                        <Check className="h-4 w-4" /> Setujui
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}
