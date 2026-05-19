"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/admin/TopBar";
import { Icon3D } from "@/components/Icon3D";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { api } from "@/lib/api";
import { downloadFile } from "@/lib/download";
import { Edit2, FileSpreadsheet, FileText, Filter, LogOut, Search, Trash2, Upload, UserPlus } from "lucide-react";
const ROLES = ["employee", "supervisor", "hr", "owner"] as const;
const STATUSES = ["active", "leave", "inactive"] as const;

export default function EmployeesPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [resignId, setResignId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [divisionFilter, setDivisionFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-employees", q],
    queryFn: () => api.adminEmployees(q || undefined),
  });
  const { data: branches } = useQuery({
    queryKey: ["admin-branches"],
    queryFn: () => api.adminBranches(),
  });
  const { data: shifts } = useQuery({
    queryKey: ["admin-shifts"],
    queryFn: () => api.adminShifts(),
  });

  const items = data?.items ?? [];
  const allDivisions = Array.from(
    new Set(items.map((e: any) => e.division).filter(Boolean))
  ) as string[];
  const allBranches = Array.from(
    new Set(items.map((e: any) => e.branchName).filter(Boolean))
  ) as string[];
  const filtered = items.filter((e: any) => {
    if (divisionFilter && e.division !== divisionFilter) return false;
    if (branchFilter && e.branchName !== branchFilter) return false;
    if (statusFilter && e.status !== statusFilter) return false;
    return true;
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.adminEmployeeDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-employees"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setDeleteId(null);
    },
  });

  const [exporting, setExporting] = useState<"" | "pdf" | "xlsx">("");
  async function handleExport(format: "pdf" | "xlsx") {
    setExporting(format);
    try {
      await downloadFile(`/api/admin/employees/export?format=${format}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setExporting("");
    }
  }

  return (
    <>
      <TopBar
        title="Manajemen Pegawai"
        subtitle="Kelola data, shift, dan akses pegawai"
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
            <Button
              variant="secondary"
              onClick={() => setBulkOpen(true)}
            >
              <Upload className="h-4 w-4" /> Bulk Import
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <UserPlus className="h-4 w-4" /> Tambah Pegawai
            </Button>
          </>
        }
      />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2 rounded-3xl bg-white p-3 shadow-soft border border-ink-100">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama, ID, atau posisi..."
              className="w-full rounded-2xl border border-ink-200 bg-ink-50/60 pl-9 pr-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:bg-white"
            />
          </div>
          <select
            className="rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-600"
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
          >
            <option value="">Semua Divisi</option>
            {allDivisions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            className="rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-600"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="">Semua Cabang</option>
            {allBranches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select
            className="rounded-2xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-600"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="leave">Cuti</option>
            <option value="inactive">Tidak Aktif</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-card border border-ink-100">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-3">Pegawai</th>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Divisi</th>
                  <th className="px-5 py-3">Cabang</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-6 text-center text-ink-500"
                    >
                      Loading...
                    </td>
                  </tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-6 text-center text-ink-500"
                    >
                      Tidak ada pegawai sesuai filter.
                    </td>
                  </tr>
                )}
                {filtered.map((e: any) => {
                  const variant =
                    e.status === "active"
                      ? "success"
                      : e.status === "leave"
                        ? "warning"
                        : "danger";
                  return (
                    <tr
                      key={e.id}
                      className="border-t border-ink-100 hover:bg-ink-50/60"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {e.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={e.avatarUrl}
                              alt={e.fullName}
                              className="h-10 w-10 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 font-bold text-brand-700 text-sm">
                              {e.fullName
                                ?.split(" ")
                                .map((s: string) => s[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{e.fullName}</p>
                            <p className="text-[11px] text-ink-500">
                              {e.position}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-ink-600">
                        {e.employeeCode}
                      </td>
                      <td className="px-5 py-3 text-ink-600">{e.userEmail}</td>
                      <td className="px-5 py-3">{e.division}</td>
                      <td className="px-5 py-3">{e.branchName ?? "-"}</td>
                      <td className="px-5 py-3 capitalize">{e.userRole}</td>
                      <td className="px-5 py-3">
                        <Badge variant={variant as any}>
                          {e.status === "active"
                            ? "Aktif"
                            : e.status === "leave"
                              ? "Cuti"
                              : "Tidak Aktif"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditId(e.id)}
                            className="rounded-lg p-2 hover:bg-ink-100"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4 text-ink-600" />
                          </button>
                          {e.status !== "inactive" && (
                            <button
                              onClick={() => setResignId(e.id)}
                              className="rounded-lg p-2 hover:bg-amber-50"
                              title="Resign"
                            >
                              <LogOut className="h-4 w-4 text-amber-600" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteId(e.id)}
                            className="rounded-lg p-2 hover:bg-danger-500/10"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4 text-danger-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-ink-100 px-5 py-3 text-xs text-ink-500">
            <span>
              Menampilkan {filtered.length} dari {items.length} pegawai
            </span>
          </div>
        </div>
      </div>

      <EmployeeFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        branches={branches?.items ?? []}
        shifts={shifts?.items ?? []}
        mode="create"
      />
      <EmployeeFormModal
        open={!!editId}
        onClose={() => setEditId(null)}
        branches={branches?.items ?? []}
        shifts={shifts?.items ?? []}
        mode="edit"
        id={editId ?? undefined}
      />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove.mutate(deleteId)}
        title="Hapus pegawai?"
        description="Pegawai dan akun login akan dihapus permanen. Aksi ini tidak bisa dibatalkan."
        loading={remove.isPending}
      />
      {bulkOpen && <BulkImportModal onClose={() => setBulkOpen(false)} />}
      {resignId && (
        <ResignModal id={resignId} onClose={() => setResignId(null)} />
      )}
    </>
  );
}

function EmployeeFormModal({
  open,
  onClose,
  branches,
  shifts,
  mode,
  id,
}: {
  open: boolean;
  onClose: () => void;
  branches: any[];
  shifts: any[];
  mode: "create" | "edit";
  id?: string;
}) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    email: "",
    password: "demo1234",
    fullName: "",
    employeeCode: "",
    role: "employee",
    division: "",
    position: "",
    branchId: "",
    shiftId: "",
    baseSalary: 0,
    phone: "",
    status: "active",
    ptkpStatus: "TK/0",
    npwp: "",
    maritalStatus: "single",
    jkkClass: 1,
    joinDate: new Date().toISOString().slice(0, 10),
  });

  const { data: detail } = useQuery({
    queryKey: ["admin-employee-detail", id],
    queryFn: () => api.adminEmployeeGet(id!),
    enabled: mode === "edit" && !!id && open,
  });

  // Hydrate form on edit
  if (mode === "edit" && detail && form.id !== detail.employee.id) {
    setForm({
      ...form,
      ...detail.employee,
      role: detail.user?.role,
      id: detail.employee.id,
    });
  }

  const create = useMutation({
    mutationFn: () =>
      api.adminEmployeeCreate({
        ...form,
        baseSalary: Number(form.baseSalary) || 0,
        jkkClass: Number(form.jkkClass) || 1,
        branchId: form.branchId || undefined,
        shiftId: form.shiftId || undefined,
        npwp: form.npwp || undefined,
      }),
    onSuccess: handleSuccess,
    onError: (e: any) => setError(e.message),
  });
  const update = useMutation({
    mutationFn: () =>
      api.adminEmployeeUpdate(id!, {
        fullName: form.fullName,
        position: form.position,
        division: form.division,
        phone: form.phone,
        branchId: form.branchId || null,
        shiftId: form.shiftId || null,
        baseSalary: Number(form.baseSalary) || 0,
        status: form.status,
        role: form.role,
        ptkpStatus: form.ptkpStatus,
        npwp: form.npwp || undefined,
        maritalStatus: form.maritalStatus,
        jkkClass: Number(form.jkkClass) || 1,
        joinDate: form.joinDate || undefined,
      }),
    onSuccess: handleSuccess,
    onError: (e: any) => setError(e.message),
  });

  function handleSuccess() {
    qc.invalidateQueries({ queryKey: ["admin-employees"] });
    qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    onClose();
    setError(null);
  }

  const submitting = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Tambah Pegawai" : "Edit Pegawai"}
      description="Lengkapi data pegawai"
      size="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          (mode === "create" ? create : update).mutate();
        }}
        className="space-y-4 p-5"
      >
        {error && (
          <p className="rounded-xl bg-danger-500/10 p-3 text-xs text-danger-600">
            {error}
          </p>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nama Lengkap">
            <input
              required
              className="input"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </Field>
          <Field label="Kode Pegawai">
            <input
              required
              className="input"
              value={form.employeeCode}
              disabled={mode === "edit"}
              onChange={(e) =>
                setForm({ ...form, employeeCode: e.target.value })
              }
            />
          </Field>
          {mode === "create" && (
            <>
              <Field label="Email">
                <input
                  required
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field label="Password Awal">
                <input
                  required
                  className="input"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </Field>
            </>
          )}
          <Field label="Posisi">
            <input
              className="input"
              value={form.position ?? ""}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            />
          </Field>
          <Field label="Divisi">
            <input
              className="input"
              value={form.division ?? ""}
              onChange={(e) => setForm({ ...form, division: e.target.value })}
            />
          </Field>
          <Field label="Telepon (untuk WhatsApp)">
            <input
              className="input"
              placeholder="08xxx atau 628xxx"
              value={form.phone ?? ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="Role">
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cabang">
            <select
              className="input"
              value={form.branchId ?? ""}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
            >
              <option value="">— pilih cabang —</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Shift">
            <select
              className="input"
              value={form.shiftId ?? ""}
              onChange={(e) => setForm({ ...form, shiftId: e.target.value })}
            >
              <option value="">— pilih shift —</option>
              {shifts.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.startTime}-{s.endTime})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Gaji Pokok (Rp)">
            <input
              type="number"
              className="input"
              value={form.baseSalary ?? 0}
              onChange={(e) =>
                setForm({ ...form, baseSalary: e.target.value })
              }
            />
          </Field>
          <Field label="Tanggal Bergabung">
            <input
              type="date"
              className="input"
              value={form.joinDate ?? ""}
              onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
            />
          </Field>
          <Field label="Status PTKP (Pajak)">
            <select
              className="input"
              value={form.ptkpStatus ?? "TK/0"}
              onChange={(e) =>
                setForm({ ...form, ptkpStatus: e.target.value })
              }
            >
              <option value="TK/0">TK/0 (Tidak Kawin, 0 tanggungan)</option>
              <option value="TK/1">TK/1 (Tidak Kawin, 1)</option>
              <option value="TK/2">TK/2 (Tidak Kawin, 2)</option>
              <option value="TK/3">TK/3 (Tidak Kawin, 3)</option>
              <option value="K/0">K/0 (Kawin, 0)</option>
              <option value="K/1">K/1 (Kawin, 1)</option>
              <option value="K/2">K/2 (Kawin, 2)</option>
              <option value="K/3">K/3 (Kawin, 3)</option>
            </select>
          </Field>
          <Field label="NPWP (16 digit)">
            <input
              className="input"
              placeholder="Kosongkan jika belum punya (PPh 21 +20%)"
              maxLength={20}
              value={form.npwp ?? ""}
              onChange={(e) => setForm({ ...form, npwp: e.target.value })}
            />
          </Field>
          <Field label="Status Pernikahan">
            <select
              className="input"
              value={form.maritalStatus ?? "single"}
              onChange={(e) =>
                setForm({ ...form, maritalStatus: e.target.value })
              }
            >
              <option value="single">Lajang</option>
              <option value="married">Menikah</option>
              <option value="widowed">Janda/Duda</option>
              <option value="divorced">Cerai</option>
            </select>
          </Field>
          <Field label="JKK Risk Class (BPJS Ketenagakerjaan)">
            <select
              className="input"
              value={form.jkkClass ?? 1}
              onChange={(e) =>
                setForm({ ...form, jkkClass: Number(e.target.value) })
              }
            >
              <option value="1">1 - Sangat Rendah (0.24%)</option>
              <option value="2">2 - Rendah (0.54%)</option>
              <option value="3">3 - Sedang (0.89%)</option>
              <option value="4">4 - Tinggi (1.27%)</option>
              <option value="5">5 - Sangat Tinggi (1.74%)</option>
            </select>
          </Field>
          {mode === "edit" && (
            <Field label="Status">
              <select
                className="input"
                value={form.status ?? "active"}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting
              ? "Menyimpan..."
              : mode === "create"
                ? "Buat Pegawai"
                : "Simpan Perubahan"}
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


function BulkImportModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [csvText, setCsvText] = useState("");
  const [defaultPassword, setDefaultPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const TEMPLATE = [
    "email,fullName,employeeCode,role,division,position,baseSalary,ptkpStatus,npwp,jkkClass,joinDate,phone",
    "andi@manggala.id,Andi Pratama,EMP-100,employee,Engineering,Software Engineer,8500000,K/0,,1,2024-01-15,081234567890",
    "siti@manggala.id,Siti Rahmawati,EMP-101,supervisor,HR,HR Lead,12500000,K/1,123456789012345,1,2023-06-01,081234567891",
  ].join("\n");

  function parseCSV(text: string): Record<string, any>[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) throw new Error("CSV harus punya header + minimal 1 baris data");
    const headers = lines[0].split(",").map((h) => h.trim());
    const rows: Record<string, any>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const cells = line.split(",").map((c) => c.trim());
      const row: Record<string, any> = {};
      headers.forEach((h, idx) => {
        const v = cells[idx] ?? "";
        row[h] = v;
      });
      rows.push(row);
    }
    return rows;
  }

  const submit = useMutation({
    mutationFn: async () => {
      const rows = parseCSV(csvText);
      return api.adminEmployeeBulkImport(rows, defaultPassword);
    },
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["admin-employees"] });
    },
    onError: (e: any) => setError(e.message),
  });

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.name.endsWith(".xlsx") || f.name.endsWith(".xls")) {
      // Parse xlsx client-side via simple row extraction
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const { parseXlsx } = await import("@/lib/xlsx-parser");
          const text = await parseXlsx(reader.result as ArrayBuffer);
          setCsvText(text);
        } catch (err: any) {
          setError("Gagal parse Excel: " + (err.message ?? "format tidak valid"));
        }
      };
      reader.readAsArrayBuffer(f);
    } else {
      const reader = new FileReader();
      reader.onload = () => setCsvText(String(reader.result ?? ""));
      reader.readAsText(f);
    }
  }

  return (
    <Modal open onClose={onClose} title="Bulk Import Pegawai" size="lg">
      <div className="space-y-4 p-5">
        {result ? (
          <div>
            <div className="rounded-2xl bg-emerald-50 p-4 text-sm">
              <p className="font-bold text-emerald-700">{result.message}</p>
              <p className="text-xs text-emerald-700">
                {result.createdCount} dari {result.attempted} berhasil ditambahkan.
              </p>
            </div>
            {result.errors.length > 0 && (
              <div className="mt-4 max-h-60 overflow-y-auto rounded-2xl bg-danger-50 p-4">
                <p className="mb-2 font-bold text-danger-700">
                  {result.errors.length} baris gagal:
                </p>
                <ul className="space-y-1 text-xs">
                  {result.errors.map((er: any, i: number) => (
                    <li key={i} className="text-danger-700">
                      Baris {er.row}: {er.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button onClick={onClose}>Tutup</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-cyan-50 p-3 text-xs text-cyan-900">
              <p className="font-semibold">Format CSV:</p>
              <p>
                Header wajib: <code>email,fullName,employeeCode</code>. Optional:
                role, division, position, baseSalary, ptkpStatus, npwp, jkkClass,
                joinDate, phone, branchId, shiftId.
              </p>
              <button
                type="button"
                onClick={() => setCsvText(TEMPLATE)}
                className="mt-2 rounded-lg bg-white px-2 py-1 text-cyan-700 underline"
              >
                Pakai template contoh
              </button>
            </div>

            {error && (
              <p className="rounded-xl bg-danger-500/10 p-3 text-xs text-danger-600">
                {error}
              </p>
            )}

            <div>
              <label className="label">Upload CSV / Excel (.xlsx)</label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFile}
                className="block w-full rounded-2xl border border-ink-200 p-2 text-sm"
              />
            </div>

            <div>
              <label className="label">atau Paste CSV</label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="input min-h-[200px] font-mono text-xs"
                placeholder={TEMPLATE}
              />
            </div>

            <div>
              <label className="label">Default Password (untuk pegawai tanpa kolom password)</label>
              <input
                className="input"
                value={defaultPassword}
                onChange={(e) => setDefaultPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose}>
                Batal
              </Button>
              <Button
                onClick={() => submit.mutate()}
                disabled={!csvText.trim() || submit.isPending}
              >
                {submit.isPending ? "Mengimport..." : "Import"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}


function ResignModal({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [resignDate, setResignDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [reason, setReason] = useState("");
  const [deactivateUser, setDeactivateUser] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resign = useMutation({
    mutationFn: () =>
      api.adminEmployeeResign(id, { resignDate, reason: reason || undefined, deactivateUser }),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["admin-employees"] });
      alert(data.message);
      onClose();
    },
    onError: (e: any) => setError(e.message),
  });

  return (
    <Modal open onClose={onClose} title="Set Pegawai Resign" size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          resign.mutate();
        }}
        className="space-y-3 p-5"
      >
        <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900">
          <strong>Catatan:</strong> Pegawai akan di-set status <code>inactive</code> +
          tidak ikut digenerate payroll bulan-bulan berikutnya. History attendance,
          payroll, dan leave tetap dipertahankan.
        </div>
        {error && (
          <p className="rounded-xl bg-danger-500/10 p-3 text-xs text-danger-600">
            {error}
          </p>
        )}
        <div>
          <label className="label">Tanggal Resign</label>
          <input
            required
            type="date"
            className="input"
            value={resignDate}
            onChange={(e) => setResignDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Alasan (opsional)</label>
          <textarea
            className="input min-h-[60px]"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="mis. Pindah perusahaan, kontrak berakhir, dll"
          />
        </div>
        <label className="flex items-center gap-2 rounded-2xl bg-brand-50 p-3 text-sm">
          <input
            type="checkbox"
            checked={deactivateUser}
            onChange={(e) => setDeactivateUser(e.target.checked)}
          />
          <div className="flex-1">
            <p className="font-semibold">Nonaktifkan akun login</p>
            <p className="text-xs text-ink-500">
              Pegawai tidak bisa login lagi setelah tanggal resign
            </p>
          </div>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={resign.isPending}>
            {resign.isPending ? "Memproses..." : "Set Resign"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
