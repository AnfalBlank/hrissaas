/**
 * Indonesian payroll calculator (2024 regulations) — full edition.
 *
 * Aturan yang dikover:
 * - PPh 21: UU HPP 7/2021, PMK 168/2023 (TER bulanan + progresif tahunan)
 * - BPJS Kesehatan: Perpres 64/2020 — 1% karyawan, 4% pemberi kerja, max 12jt
 * - BPJS JHT: PP 46/2015 — 2% karyawan, 3.7% pemberi kerja
 * - BPJS JP: PP 45/2015 — 1% karyawan, 2% pemberi kerja, capped ~10.5jt
 * - BPJS JKK: PP 44/2015 — 0.24%–1.74% pemberi kerja (5 risk class)
 * - BPJS JKM: PP 44/2015 — 0.3% pemberi kerja
 * - Lembur weekday: Permenaker 102/2004 — 1.5x jam-1, 2x jam ke-2 dst
 * - Lembur libur (6 hari kerja): 2x jam 1-7, 3x jam ke-8, 4x jam ke-9 dst
 * - Lembur libur (5 hari kerja): 2x jam 1-8, 3x jam ke-9, 4x jam ke-10 dst
 * - THR: Permenaker 6/2016 — 1 bulan untuk masa kerja >= 12 bulan, pro-rata <12 bulan
 * - NPWP: tanpa NPWP kena tarif PPh21 +20% (UU HPP)
 */

// =================== PTKP ===================

export const PTKP_TABLE: Record<string, number> = {
  "TK/0": 54_000_000,
  "TK/1": 58_500_000,
  "TK/2": 63_000_000,
  "TK/3": 67_500_000,
  "K/0": 58_500_000,
  "K/1": 63_000_000,
  "K/2": 67_500_000,
  "K/3": 72_000_000,
};

const PPH21_BRACKETS = [
  { upto: 60_000_000, rate: 0.05 },
  { upto: 250_000_000, rate: 0.15 },
  { upto: 500_000_000, rate: 0.25 },
  { upto: 5_000_000_000, rate: 0.3 },
  { upto: Infinity, rate: 0.35 },
];

// =================== Settings ===================

export type PayrollSettingsInput = {
  workingHoursPerMonth?: number; // default 173
  allowanceDefaultPct?: number; // default 0.27
  lateDeductionCapPct?: number; // default 0.10

  otWeekdayFirstRate?: number; // default 1.5
  otWeekdayRate?: number; // default 2.0
  otHolidayFirst8hRate?: number; // default 2.0
  otHoliday9thRate?: number; // default 3.0
  otHoliday10thRate?: number; // default 4.0

  thrFullMonths?: number; // default 12
  thrMinMonths?: number; // default 1

  bpjsKesehatanEnabled?: boolean;
  bpjsJhtEnabled?: boolean;
  bpjsJpEnabled?: boolean;

  defaultJkkClass?: number; // default 1
  taxScheme?: string;
};

const DEFAULT: Required<PayrollSettingsInput> = {
  workingHoursPerMonth: 173,
  allowanceDefaultPct: 0.27,
  lateDeductionCapPct: 0.1,
  otWeekdayFirstRate: 1.5,
  otWeekdayRate: 2.0,
  otHolidayFirst8hRate: 2.0,
  otHoliday9thRate: 3.0,
  otHoliday10thRate: 4.0,
  thrFullMonths: 12,
  thrMinMonths: 1,
  bpjsKesehatanEnabled: true,
  bpjsJhtEnabled: true,
  bpjsJpEnabled: true,
  defaultJkkClass: 1,
  taxScheme: "gross",
};

function withDefaults(s?: PayrollSettingsInput): Required<PayrollSettingsInput> {
  return { ...DEFAULT, ...(s || {}) };
}

const BPJS = {
  kesehatanMaxBase: 12_000_000,
  kesehatanEmployee: 0.01,
  kesehatanEmployer: 0.04,
  jhtEmployee: 0.02,
  jhtEmployer: 0.037,
  jpMaxBase: 10_547_400,
  jpEmployee: 0.01,
  jpEmployer: 0.02,
  jkkRates: { 1: 0.0024, 2: 0.0054, 3: 0.0089, 4: 0.0127, 5: 0.0174 } as Record<
    number,
    number
  >,
  jkmEmployer: 0.003,
};

// =================== PPh 21 ===================

export function pph21Annual(pkp: number): number {
  if (pkp <= 0) return 0;
  let tax = 0;
  let lastUpto = 0;
  for (const b of PPH21_BRACKETS) {
    const slab = Math.min(pkp, b.upto) - lastUpto;
    if (slab <= 0) break;
    tax += slab * b.rate;
    lastUpto = b.upto;
    if (pkp <= b.upto) break;
  }
  return Math.round(tax);
}

export function pph21Monthly(opts: {
  monthlyGross: number;
  ptkpStatus: string;
  monthlyEmployeeBpjs: number;
  hasNpwp: boolean;
}): { tax: number; pkp: number; ptkp: number; biayaJabatan: number } {
  const annual = opts.monthlyGross * 12;
  const biayaJabatanAnnual = Math.min(annual * 0.05, 6_000_000);
  const ptkp = PTKP_TABLE[opts.ptkpStatus] ?? PTKP_TABLE["TK/0"];
  const employeeBpjsAnnual = opts.monthlyEmployeeBpjs * 12;
  let pkp = annual - biayaJabatanAnnual - employeeBpjsAnnual - ptkp;
  pkp = Math.max(0, Math.floor(pkp / 1000) * 1000);
  let taxAnnual = pph21Annual(pkp);
  if (!opts.hasNpwp) taxAnnual = Math.round(taxAnnual * 1.2);
  return {
    tax: Math.round(taxAnnual / 12),
    pkp,
    ptkp,
    biayaJabatan: Math.round(biayaJabatanAnnual / 12),
  };
}

// =================== BPJS ===================

export function bpjsKesehatan(monthlyGross: number, enabled = true) {
  if (!enabled) return { employee: 0, employer: 0 };
  const base = Math.min(monthlyGross, BPJS.kesehatanMaxBase);
  return {
    employee: Math.round(base * BPJS.kesehatanEmployee),
    employer: Math.round(base * BPJS.kesehatanEmployer),
  };
}

export function bpjsJht(monthlyGross: number, enabled = true) {
  if (!enabled) return { employee: 0, employer: 0 };
  return {
    employee: Math.round(monthlyGross * BPJS.jhtEmployee),
    employer: Math.round(monthlyGross * BPJS.jhtEmployer),
  };
}

export function bpjsJp(monthlyGross: number, enabled = true) {
  if (!enabled) return { employee: 0, employer: 0 };
  const base = Math.min(monthlyGross, BPJS.jpMaxBase);
  return {
    employee: Math.round(base * BPJS.jpEmployee),
    employer: Math.round(base * BPJS.jpEmployer),
  };
}

export function bpjsJkk(monthlyGross: number, jkkClass: number = 1) {
  const rate = BPJS.jkkRates[jkkClass] ?? BPJS.jkkRates[1];
  return { employee: 0, employer: Math.round(monthlyGross * rate) };
}

export function bpjsJkm(monthlyGross: number) {
  return {
    employee: 0,
    employer: Math.round(monthlyGross * BPJS.jkmEmployer),
  };
}

// =================== Overtime ===================

export type OvertimeEntry = {
  hours: number;
  isHoliday?: boolean;
};

/**
 * Hitung lembur dari array entry (per pengajuan/per hari).
 * Weekday: jam 1 = 1.5x, jam 2+ = 2x.
 * Holiday/weekend (5-day): jam 1-8 = 2x, jam 9 = 3x, jam 10+ = 4x.
 *
 * Karena Permenaker 102/2004 menentukan rate per-hari (bukan per-minggu),
 * kita hitung tiap entry secara terpisah lalu sum.
 */
export function calculateOvertimePay(opts: {
  monthlyGross: number;
  entries: OvertimeEntry[];
  settings?: PayrollSettingsInput;
}) {
  const s = withDefaults(opts.settings);
  const hourlyRate = opts.monthlyGross / s.workingHoursPerMonth;
  let totalPay = 0;
  let totalHours = 0;
  let totalHolidayHours = 0;
  let totalWeekdayHours = 0;

  for (const e of opts.entries) {
    if (!e.hours || e.hours <= 0) continue;
    totalHours += e.hours;
    if (e.isHoliday) {
      totalHolidayHours += e.hours;
      // 1-8 jam: 2x, jam 9: 3x, jam 10+: 4x
      const h = e.hours;
      let pay = 0;
      pay += Math.min(h, 8) * s.otHolidayFirst8hRate;
      if (h > 8) pay += Math.min(h - 8, 1) * s.otHoliday9thRate;
      if (h > 9) pay += (h - 9) * s.otHoliday10thRate;
      totalPay += pay * hourlyRate;
    } else {
      totalWeekdayHours += e.hours;
      // jam 1: 1.5x, jam 2+: 2x
      const h = e.hours;
      let pay = 0;
      pay += Math.min(h, 1) * s.otWeekdayFirstRate;
      if (h > 1) pay += (h - 1) * s.otWeekdayRate;
      totalPay += pay * hourlyRate;
    }
  }

  return {
    pay: Math.round(totalPay),
    hours: Math.round(totalHours * 10) / 10,
    weekdayHours: Math.round(totalWeekdayHours * 10) / 10,
    holidayHours: Math.round(totalHolidayHours * 10) / 10,
  };
}

// =================== Late deduction ===================

export function lateDeduction(opts: {
  monthlyGross: number;
  totalLateMinutes: number;
  settings?: PayrollSettingsInput;
}) {
  const s = withDefaults(opts.settings);
  const hourlyRate = opts.monthlyGross / s.workingHoursPerMonth;
  const minuteRate = hourlyRate / 60;
  const raw = minuteRate * opts.totalLateMinutes;
  const cap = opts.monthlyGross * s.lateDeductionCapPct;
  return { deduction: Math.round(Math.min(raw, cap)) };
}

// =================== THR ===================

/**
 * Hitung THR sesuai Permenaker 6/2016:
 * - Masa kerja >= 12 bulan: 1 bulan upah penuh (gaji pokok + tunjangan tetap)
 * - Masa kerja >= 1 bulan dan < 12 bulan: pro-rata (masa_kerja_bulan / 12 × upah)
 */
export function calculateThr(opts: {
  baseSalary: number;
  allowance?: number;
  joinDate: Date | string;
  payPeriod: Date; // patokan bulan THR (biasanya 7 hari sebelum hari raya)
  settings?: PayrollSettingsInput;
}) {
  const s = withDefaults(opts.settings);
  const join = new Date(opts.joinDate);
  if (isNaN(join.getTime())) return { thr: 0, eligible: false, monthsOfService: 0 };

  const months =
    (opts.payPeriod.getFullYear() - join.getFullYear()) * 12 +
    (opts.payPeriod.getMonth() - join.getMonth());

  if (months < s.thrMinMonths)
    return { thr: 0, eligible: false, monthsOfService: months };

  const upah = (opts.baseSalary || 0) + (opts.allowance || 0);
  if (months >= s.thrFullMonths)
    return { thr: Math.round(upah), eligible: true, monthsOfService: months, prorata: false };

  // Pro-rata
  const prorata = (months / 12) * upah;
  return {
    thr: Math.round(prorata),
    eligible: true,
    monthsOfService: months,
    prorata: true,
  };
}

// =================== Master ===================

export type ExtraComponent = {
  type: "earning" | "deduction";
  category: string;
  name: string;
  amount: number;
};

export type PayrollInput = {
  baseSalary: number;
  allowance?: number; // override default 27%
  bonus?: number;
  thr?: number;
  totalLateMinutes?: number;
  overtimeEntries?: OvertimeEntry[];
  ptkpStatus?: string;
  jkkClass?: number;
  hasNpwp?: boolean;
  // Extra recurring/one-off components
  extraEarnings?: ExtraComponent[];
  extraDeductions?: ExtraComponent[];
  // Company settings
  settings?: PayrollSettingsInput;
};

export type PayrollBreakdown = {
  baseSalary: number;
  allowance: number;
  overtimePay: number;
  overtimeHours: number;
  overtimeWeekdayHours: number;
  overtimeHolidayHours: number;
  bonus: number;
  thr: number;
  extraEarnings: ExtraComponent[];
  extraEarningsTotal: number;
  totalEarnings: number;

  bpjsKesehatan: number;
  bpjsJht: number;
  bpjsJp: number;
  bpjsTotal: number;
  taxDeduction: number;
  attendanceDeduction: number;
  extraDeductions: ExtraComponent[];
  extraDeductionsTotal: number;
  totalDeduction: number;

  employerBpjsKesehatan: number;
  employerBpjsJht: number;
  employerBpjsJp: number;
  employerBpjsJkk: number;
  employerBpjsJkm: number;
  employerBpjsTotal: number;

  pkp: number;
  ptkp: number;
  ptkpStatus: string;
  hasNpwp: boolean;
  biayaJabatan: number;

  netSalary: number;
};

export function calculatePayroll(input: PayrollInput): PayrollBreakdown {
  const s = withDefaults(input.settings);
  const baseSalary = input.baseSalary || 0;
  const allowance = input.allowance ?? Math.round(baseSalary * s.allowanceDefaultPct);
  const bonus = input.bonus ?? 0;
  const thr = input.thr ?? 0;
  const ptkpStatus = input.ptkpStatus ?? "TK/0";
  const jkkClass = input.jkkClass ?? s.defaultJkkClass;
  const hasNpwp = input.hasNpwp ?? true;

  const monthlyGross = baseSalary + allowance;

  const kes = bpjsKesehatan(monthlyGross, s.bpjsKesehatanEnabled);
  const jht = bpjsJht(monthlyGross, s.bpjsJhtEnabled);
  const jp = bpjsJp(monthlyGross, s.bpjsJpEnabled);
  const bpjsEmployee = kes.employee + jht.employee + jp.employee;

  const jkk = bpjsJkk(monthlyGross, jkkClass);
  const jkm = bpjsJkm(monthlyGross);
  const bpjsEmployer =
    kes.employer + jht.employer + jp.employer + jkk.employer + jkm.employer;

  const tax = pph21Monthly({
    monthlyGross,
    ptkpStatus,
    monthlyEmployeeBpjs: bpjsEmployee,
    hasNpwp,
  });

  const ot = calculateOvertimePay({
    monthlyGross,
    entries: input.overtimeEntries ?? [],
    settings: input.settings,
  });

  const late = lateDeduction({
    monthlyGross,
    totalLateMinutes: input.totalLateMinutes ?? 0,
    settings: input.settings,
  });

  const extraEarnings = input.extraEarnings ?? [];
  const extraEarningsTotal = extraEarnings.reduce((sum, c) => sum + c.amount, 0);
  const extraDeductions = input.extraDeductions ?? [];
  const extraDeductionsTotal = extraDeductions.reduce((sum, c) => sum + c.amount, 0);

  const totalEarnings =
    baseSalary + allowance + ot.pay + bonus + thr + extraEarningsTotal;
  const totalDeduction =
    bpjsEmployee + tax.tax + late.deduction + extraDeductionsTotal;
  const netSalary = totalEarnings - totalDeduction;

  return {
    baseSalary,
    allowance,
    overtimePay: ot.pay,
    overtimeHours: ot.hours,
    overtimeWeekdayHours: ot.weekdayHours,
    overtimeHolidayHours: ot.holidayHours,
    bonus,
    thr,
    extraEarnings,
    extraEarningsTotal,
    totalEarnings,

    bpjsKesehatan: kes.employee,
    bpjsJht: jht.employee,
    bpjsJp: jp.employee,
    bpjsTotal: bpjsEmployee,
    taxDeduction: tax.tax,
    attendanceDeduction: late.deduction,
    extraDeductions,
    extraDeductionsTotal,
    totalDeduction,

    employerBpjsKesehatan: kes.employer,
    employerBpjsJht: jht.employer,
    employerBpjsJp: jp.employer,
    employerBpjsJkk: jkk.employer,
    employerBpjsJkm: jkm.employer,
    employerBpjsTotal: bpjsEmployer,

    pkp: tax.pkp,
    ptkp: tax.ptkp,
    ptkpStatus,
    hasNpwp,
    biayaJabatan: tax.biayaJabatan,

    netSalary,
  };
}

export const WORKING_HOURS_PER_MONTH = 173;
