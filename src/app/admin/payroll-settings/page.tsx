"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TopBar } from "@/components/admin/TopBar";
import { Icon3D } from "@/components/Icon3D";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Save } from "lucide-react";

export default function PayrollSettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["payroll-settings"],
    queryFn: () => api.adminPayrollSettings(),
  });

  const [form, setForm] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data?.settings && !form) setForm(data.settings);
  }, [data, form]);

  const save = useMutation({
    mutationFn: () =>
      api.adminPayrollSettingsUpdate({
        allowanceDefaultPct: Number(form.allowanceDefaultPct),
        workingHoursPerMonth: Number(form.workingHoursPerMonth),
        lateDeductionCapPct: Number(form.lateDeductionCapPct),
        otWeekdayFirstRate: Number(form.otWeekdayFirstRate),
        otWeekdayRate: Number(form.otWeekdayRate),
        otHolidayFirst8hRate: Number(form.otHolidayFirst8hRate),
        otHoliday9thRate: Number(form.otHoliday9thRate),
        otHoliday10thRate: Number(form.otHoliday10thRate),
        thrFullMonths: Number(form.thrFullMonths),
        thrMinMonths: Number(form.thrMinMonths),
        bpjsKesehatanEnabled: !!form.bpjsKesehatanEnabled,
        bpjsJhtEnabled: !!form.bpjsJhtEnabled,
        bpjsJpEnabled: !!form.bpjsJpEnabled,
        defaultJkkClass: Number(form.defaultJkkClass),
        taxScheme: form.taxScheme,
        companyNpwp: form.companyNpwp || "",
        companyTaxAddress: form.companyTaxAddress || "",
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["payroll-settings"] });
      setForm(data.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (e: any) => setError(e.message),
  });

  if (!form) {
    return (
      <>
        <TopBar title="Pengaturan Payroll" subtitle="Memuat..." />
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Pengaturan Payroll"
        subtitle="Konfigurasi rate, kebijakan, dan BPJS"
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

        {/* Defaults */}
        <Section icon="gear" title="Default Umum">
          <Field label="% Tunjangan Tetap dari Gaji Pokok">
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.allowanceDefaultPct}
              onChange={(e) =>
                setForm({ ...form, allowanceDefaultPct: e.target.value })
              }
            />
            <Hint>Default 0.27 (= 27% × gaji pokok)</Hint>
          </Field>
          <Field label="Jam Kerja per Bulan">
            <input
              type="number"
              className="input"
              value={form.workingHoursPerMonth}
              onChange={(e) =>
                setForm({ ...form, workingHoursPerMonth: e.target.value })
              }
            />
            <Hint>Default 173 (Permenaker)</Hint>
          </Field>
          <Field label="Cap Potongan Telat (% gaji pokok)">
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              className="input"
              value={form.lateDeductionCapPct}
              onChange={(e) =>
                setForm({ ...form, lateDeductionCapPct: e.target.value })
              }
            />
            <Hint>Default 0.10 (= max 10% gaji pokok)</Hint>
          </Field>
        </Section>

        {/* Overtime */}
        <Section icon="fire" title="Tarif Lembur (Permenaker 102/2004)">
          <div className="rounded-2xl bg-amber-50 p-3 mb-3 text-xs text-amber-800">
            Hari kerja: 1.5× jam pertama, 2× sisanya. Hari libur: 2× jam 1-8,
            3× jam 9, 4× jam 10+.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Weekday Jam ke-1">
              <input
                type="number"
                step="0.1"
                className="input"
                value={form.otWeekdayFirstRate}
                onChange={(e) =>
                  setForm({ ...form, otWeekdayFirstRate: e.target.value })
                }
              />
            </Field>
            <Field label="Weekday Jam ke-2+">
              <input
                type="number"
                step="0.1"
                className="input"
                value={form.otWeekdayRate}
                onChange={(e) =>
                  setForm({ ...form, otWeekdayRate: e.target.value })
                }
              />
            </Field>
            <Field label="Holiday Jam 1-8">
              <input
                type="number"
                step="0.1"
                className="input"
                value={form.otHolidayFirst8hRate}
                onChange={(e) =>
                  setForm({ ...form, otHolidayFirst8hRate: e.target.value })
                }
              />
            </Field>
            <Field label="Holiday Jam ke-9">
              <input
                type="number"
                step="0.1"
                className="input"
                value={form.otHoliday9thRate}
                onChange={(e) =>
                  setForm({ ...form, otHoliday9thRate: e.target.value })
                }
              />
            </Field>
            <Field label="Holiday Jam ke-10+">
              <input
                type="number"
                step="0.1"
                className="input"
                value={form.otHoliday10thRate}
                onChange={(e) =>
                  setForm({ ...form, otHoliday10thRate: e.target.value })
                }
              />
            </Field>
          </div>
        </Section>

        {/* THR */}
        <Section icon="party" title="THR (Permenaker 6/2016)">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min. Masa Kerja Eligible (bulan)">
              <input
                type="number"
                className="input"
                value={form.thrMinMonths}
                onChange={(e) =>
                  setForm({ ...form, thrMinMonths: e.target.value })
                }
              />
              <Hint>Default 1 bulan (pro-rata)</Hint>
            </Field>
            <Field label="Min. Masa Kerja THR Penuh (bulan)">
              <input
                type="number"
                className="input"
                value={form.thrFullMonths}
                onChange={(e) =>
                  setForm({ ...form, thrFullMonths: e.target.value })
                }
              />
              <Hint>Default 12 bulan (1× upah penuh)</Hint>
            </Field>
          </div>
        </Section>

        {/* BPJS */}
        <Section icon="shield" title="BPJS Toggle">
          {[
            { k: "bpjsKesehatanEnabled", l: "BPJS Kesehatan", d: "1% karyawan, 4% perusahaan, max Rp12 jt" },
            { k: "bpjsJhtEnabled", l: "BPJS JHT", d: "2% karyawan, 3.7% perusahaan" },
            { k: "bpjsJpEnabled", l: "BPJS JP", d: "1% karyawan, 2% perusahaan, capped ~Rp10.5 jt" },
          ].map((s) => (
            <label
              key={s.k}
              className="flex items-center gap-3 rounded-2xl bg-ink-50 p-3 mb-2 cursor-pointer"
            >
              <span
                className={`relative h-6 w-11 rounded-full transition ${
                  form[s.k] ? "bg-success-500" : "bg-ink-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    form[s.k] ? "left-5" : "left-0.5"
                  }`}
                />
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={!!form[s.k]}
                onChange={(e) => setForm({ ...form, [s.k]: e.target.checked })}
              />
              <div className="flex-1">
                <p className="font-semibold">{s.l}</p>
                <p className="text-xs text-ink-500">{s.d}</p>
              </div>
            </label>
          ))}
          <Field label="Default JKK Risk Class">
            <select
              className="input"
              value={form.defaultJkkClass}
              onChange={(e) =>
                setForm({ ...form, defaultJkkClass: e.target.value })
              }
            >
              <option value="1">1 - Sangat Rendah (0.24%)</option>
              <option value="2">2 - Rendah (0.54%)</option>
              <option value="3">3 - Sedang (0.89%)</option>
              <option value="4">4 - Tinggi (1.27%)</option>
              <option value="5">5 - Sangat Tinggi (1.74%)</option>
            </select>
          </Field>
        </Section>

        {/* Tax */}
        <Section icon="receipt" title="Pajak (PPh 21)">
          <Field label="Skema PPh 21">
            <select
              className="input"
              value={form.taxScheme}
              onChange={(e) => setForm({ ...form, taxScheme: e.target.value })}
            >
              <option value="gross">Gross (pajak ditanggung karyawan)</option>
              <option value="gross-up">Gross-up (perusahaan menambah tunjangan pajak)</option>
              <option value="net">Net (pajak ditanggung perusahaan)</option>
            </select>
          </Field>
          <Field label="NPWP Perusahaan">
            <input
              className="input"
              placeholder="00.000.000.0-000.000"
              value={form.companyNpwp ?? ""}
              onChange={(e) =>
                setForm({ ...form, companyNpwp: e.target.value })
              }
            />
          </Field>
          <Field label="Alamat Pajak Perusahaan">
            <textarea
              className="input min-h-[64px]"
              value={form.companyTaxAddress ?? ""}
              onChange={(e) =>
                setForm({ ...form, companyTaxAddress: e.target.value })
              }
            />
          </Field>
        </Section>
      </div>
    </>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-card border border-ink-100">
      <div className="flex items-center gap-3">
        <Icon3D name={icon} size={48} />
        <p className="font-display text-lg font-bold">{title}</p>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
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

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[11px] text-ink-500">{children}</p>;
}
