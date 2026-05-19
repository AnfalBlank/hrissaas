"use client";

import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { TopBar } from "@/components/admin/TopBar";
import { Icon3D, type Icon3DName } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { AttendanceDetail } from "@/components/admin/AttendanceDetail";
import { api } from "@/lib/api";
import { useRealtime } from "@/lib/realtime";
import { downloadFile } from "@/lib/download";
import {
  Edit2,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Search,
} from "lucide-react";

const todayStr = new Date().toISOString().slice(0, 10);

export default function AttendanceMgmt() {
  const qc = useQueryClient();
  const [date, setDate] = useState(todayStr);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [editing, setEditing] = useState<any | null>(null);
  const [viewing, setViewing] = useState<any | null>(null);
  const [exporting, setExporting] = useState<"" | "pdf" | "xlsx">("");

  const { data } = useQuery({
    queryKey: ["admin-attendance", date],
    queryFn: () => api.adminAttendance(date),
  });

  useRealtime("attendance:check-in", () =>
    qc.invalidateQueries({ queryKey: ["admin-attendance"] })
  );
  useRealtime("attendance:check-out", () =>
    qc.invalidateQueries({ queryKey: ["admin-attendance"] })
  );

  async function handleExport(format: "pdf" | "xlsx") {
    setExporting(format);
    try {
      await downloadFile(
        `/api/admin/attendance/export?date=${date}&format=${format}`
      );
    } catch (e: any) {
      alert(e.message);
    } finally {
      setExporting("");
    }
  }

  const all = data?.items ?? [];
  const items = all.filter((r: any) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (q) {
      const needle = q.toLowerCase();
      return (
        r.fullName?.toLowerCase().includes(needle) ||
        r.employeeCode?.toLowerCase().includes(needle) ||
        r.branchName?.toLowerCase().includes(needle)
      );
    }
    return true;
  });

  const summary = data?.summary ?? {
    present: 0,
    late: 0,
    leave: 0,
    sick: 0,
    alpha: 0,
  };

  const fmtT = (ts: any) =>
    ts
      ? new Date(ts).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <>
      <TopBar
        title="Monitoring Absensi"
        subtitle="Realtime kehadiran semua pegawai"
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { l: "Hadir", v: summary.present, k: "present", i: "check" as Icon3DName, c: "from-emerald-100 to-emerald-50" },
            { l: "Telat", v: summary.late, k: "late", i: "warning" as Icon3DName, c: "from-amber-100 to-amber-50" },
            { l: "Cuti", v: summary.leave, k: "leave", i: "beach" as Icon3DName, c: "from-cyan-100 to-cyan-50" },
            { l: "Sakit", v: summary.sick, k: "sick", i: "bedSick" as Icon3DName, c: "from-rose-100 to-rose-50" },
            { l: "Alpha", v: summary.alpha, k: "alpha", i: "cross" as Icon3DName, c: "from-red-100 to-red-50" },
          ].map((s) => (
            <button
              key={s.l}
              onClick={() =>
                setStatusFilter((cur) => (cur === s.k ? "" : s.k))
              }
              className={`rounded-3xl bg-gradient-to-br ${s.c} p-4 shadow-soft text-left transition ${
                statusFilter === s.k ? "ring-2 ring-brand-500" : ""
              }`}
            >
              <Icon3D name={s.i} size={48} />
              <p className="mt-1 text-xs text-ink-500">{s.l}</p>
              <p className="font-display text-2xl font-extrabold">{s.v}</p>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-3xl bg-white p-3 shadow-soft border border-ink-100">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari pegawai, kode, atau cabang..."
              className="w-full rounded-2xl border border-ink-200 bg-ink-50/60 pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:bg-white"
            />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-2xl border border-ink-200 bg-white px-3 py-2.5 text-sm"
          />
          {statusFilter && (
            <button
              onClick={() => setStatusFilter("")}
              className="inline-flex items-center gap-1 rounded-2xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700"
            >
              <Filter className="h-3 w-3" /> {statusFilter} ✕
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-card border border-ink-100">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-3">Pegawai</th>
                  <th className="px-5 py-3">Cabang</th>
                  <th className="px-5 py-3">Check-in</th>
                  <th className="px-5 py-3">Check-out</th>
                  <th className="px-5 py-3">Metode</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-6 text-center text-ink-500"
                    >
                      Tidak ada data sesuai filter.
                    </td>
                  </tr>
                )}
                {items.map((r: any) => {
                  const variant =
                    r.status === "present"
                      ? "success"
                      : r.status === "late"
                        ? "warning"
                        : r.status === "leave" || r.status === "sick"
                          ? "brand"
                          : "default";
                  const label =
                    r.status === "present"
                      ? "Hadir"
                      : r.status === "late"
                        ? `Telat ${r.lateMinutes}m`
                        : r.status === "leave"
                          ? "Cuti"
                          : r.status === "sick"
                            ? "Sakit"
                            : r.status;
                  const methodIcon =
                    r.method === "qr"
                      ? "qrcode"
                      : r.method === "manual"
                        ? "pen"
                        : "face";
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-ink-100 hover:bg-ink-50/60"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {r.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={r.avatarUrl}
                              alt={r.fullName}
                              className="h-9 w-9 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-100 text-xs font-bold text-brand-700">
                              {r.fullName
                                ?.split(" ")
                                .map((s: string) => s[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{r.fullName}</p>
                            <p className="text-[11px] text-ink-500">
                              {r.employeeCode}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">{r.branchName ?? "-"}</td>
                      <td className="px-5 py-3 font-mono">
                        {fmtT(r.checkInAt)}
                      </td>
                      <td className="px-5 py-3 font-mono">
                        {fmtT(r.checkOutAt)}
                      </td>
                      <td className="px-5 py-3">
                        {r.method && (
                          <Icon3D name={methodIcon as Icon3DName} size={28} />
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={variant as any}>{label}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setViewing(r)}
                            className="rounded-lg p-1.5 hover:bg-brand-50"
                            title="Lihat foto + lokasi"
                          >
                            <Eye className="h-4 w-4 text-brand-600" />
                          </button>
                          <button
                            onClick={() => setEditing(r)}
                            className="rounded-lg p-1.5 hover:bg-ink-100"
                            title="Koreksi manual"
                          >
                            <Edit2 className="h-4 w-4 text-ink-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CorrectionModal
        attendance={editing}
        onClose={() => setEditing(null)}
      />
      <AttendanceDetail
        open={!!viewing}
        onClose={() => setViewing(null)}
        attendance={viewing}
      />
    </>
  );
}

function CorrectionModal({
  attendance,
  onClose,
}: {
  attendance: any;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const open = !!attendance;
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    status: "",
    checkInAt: "",
    checkOutAt: "",
    notes: "",
  });

  // hydrate on open
  if (attendance && form.status === "" && form.notes === "") {
    setForm({
      status: attendance.status,
      checkInAt: attendance.checkInAt
        ? new Date(attendance.checkInAt).toISOString().slice(0, 16)
        : "",
      checkOutAt: attendance.checkOutAt
        ? new Date(attendance.checkOutAt).toISOString().slice(0, 16)
        : "",
      notes: attendance.notes ?? "",
    });
  }

  const save = useMutation({
    mutationFn: () =>
      api.adminAttendanceUpdate(attendance.id, {
        status: form.status as any,
        checkInAt: form.checkInAt ? new Date(form.checkInAt).toISOString() : null,
        checkOutAt: form.checkOutAt
          ? new Date(form.checkOutAt).toISOString()
          : null,
        notes: form.notes,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-attendance"] });
      handleClose();
    },
    onError: (e: any) => setError(e.message),
  });

  function handleClose() {
    setForm({ status: "", checkInAt: "", checkOutAt: "", notes: "" });
    setError(null);
    onClose();
  }

  if (!open) return null;
  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Koreksi Absensi"
      description={`${attendance.fullName} · ${attendance.date}`}
      size="md"
    >
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
        <Field label="Status">
          <select
            className="input"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="present">Hadir</option>
            <option value="late">Telat</option>
            <option value="leave">Cuti</option>
            <option value="sick">Sakit</option>
            <option value="permission">Izin</option>
            <option value="alpha">Alpha</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Check-in">
            <input
              type="datetime-local"
              className="input"
              value={form.checkInAt}
              onChange={(e) => setForm({ ...form, checkInAt: e.target.value })}
            />
          </Field>
          <Field label="Check-out">
            <input
              type="datetime-local"
              className="input"
              value={form.checkOutAt}
              onChange={(e) =>
                setForm({ ...form, checkOutAt: e.target.value })
              }
            />
          </Field>
        </div>
        <Field label="Catatan Koreksi">
          <textarea
            className="input min-h-[64px]"
            placeholder="Alasan koreksi manual..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={save.isPending}
          >
            Batal
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Menyimpan..." : "Simpan Koreksi"}
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
