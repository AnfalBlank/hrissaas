"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/admin/TopBar";
import { Icon3D } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useRealtime } from "@/lib/realtime";
import { Check, X } from "lucide-react";

export default function OvertimeAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-overtime"],
    queryFn: () => api.adminOvertime(),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin-overtime"] });
  useRealtime("overtime:applied", invalidate);
  useRealtime("overtime:decided", invalidate);

  const decide = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "approved" | "rejected";
    }) => api.adminOvertimeDecide(id, status),
    onSuccess: invalidate,
  });

  const items = data?.items ?? [];
  const summary = data?.summary ?? {
    pending: 0,
    approved: 0,
    rejected: 0,
    totalHours: 0,
  };

  return (
    <>
      <TopBar
        title="Manajemen Lembur"
        subtitle="Approval & monitoring lembur"
      />
      <div className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { l: "Menunggu", v: summary.pending, i: "history" as const },
            { l: "Disetujui", v: summary.approved, i: "check" as const },
            { l: "Ditolak", v: summary.rejected, i: "cross" as const },
            {
              l: "Total Jam",
              v: `${summary.totalHours}j`,
              i: "fire" as const,
            },
          ].map((s) => (
            <div
              key={s.l}
              className="flex items-center gap-3 rounded-3xl bg-white p-5 shadow-soft border border-ink-100"
            >
              <Icon3D name={s.i} size={48} />
              <div>
                <p className="text-xs text-ink-500">{s.l}</p>
                <p className="font-display text-2xl font-extrabold">{s.v}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-white shadow-card border border-ink-100 overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <p className="font-display font-bold">Pengajuan Lembur</p>
            <Badge variant="brand">{summary.pending} menunggu</Badge>
          </div>
          <ul className="divide-y divide-ink-100">
            {items.length === 0 && (
              <li className="p-8 text-center text-sm text-ink-500">
                Belum ada pengajuan lembur.
              </li>
            )}
            {items.map((l: any) => {
              const variant =
                l.status === "approved"
                  ? "success"
                  : l.status === "rejected"
                    ? "danger"
                    : "warning";
              const label =
                l.status === "approved"
                  ? "Disetujui"
                  : l.status === "rejected"
                    ? "Ditolak"
                    : "Menunggu";
              return (
                <li
                  key={l.id}
                  className="flex flex-wrap items-center gap-4 p-5"
                >
                  {l.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.avatarUrl}
                      alt={l.fullName}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                  ) : (
                    <Icon3D name="fire" size={48} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{l.fullName}</p>
                      <Badge variant={variant as any}>{label}</Badge>
                    </div>
                    <p className="text-xs text-ink-500">
                      {l.date} · {l.startTime} - {l.endTime} ({l.hours}j)
                    </p>
                    {l.description && (
                      <p className="mt-1 text-xs text-ink-600">
                        Deskripsi: {l.description}
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
