/**
 * Indonesian payroll calculator (2024+ regulations) — full edition.
 *
 * Aturan yang dikover:
 * - PPh 21: UU HPP 7/2021 + PMK 168/2023 — TER bulanan (Jan-Nov) +
 *   rekonsiliasi progresif tahunan di Desember.
 * - BPJS Kesehatan: Perpres 64/2020 — 1% karyawan, 4% pemberi kerja, max 12jt
 * - BPJS JHT: PP 46/2015 — 2% karyawan, 3.7% pemberi kerja
 * - BPJS JP: PP 45/2015 — 1% karyawan, 2% pemberi kerja, capped ~10.5jt
 * - BPJS JKK: PP 44/2015 — 0.24%–1.74% pemberi kerja (5 risk class)
 * - BPJS JKM: PP 44/2015 — 0.3% pemberi kerja
 * - Lembur weekday: Permenaker 102/2004 — 1.5x jam-1, 2x jam ke-2 dst
 * - Lembur libur (5 hari kerja): 2x jam 1-8, 3x jam ke-9, 4x jam ke-10 dst
 * - Lembur libur (6 hari kerja): 2x jam 1-7, 3x jam ke-8, 4x jam ke-9 dst
 * - THR: Permenaker 6/2016 — 1 bulan untuk masa kerja >= 12 bulan, pro-rata <12 bulan
 * - NPWP: tanpa NPWP kena tarif PPh21 +20% (UU HPP)
 * - Pro-rata: join/resign tengah bulan dipotong proporsional hari kalender.
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

// =================== TER PMK 168/2023 ===================
//
// Kategori A: PTKP TK/0, TK/1, K/0
// Kategori B: PTKP TK/2, TK/3, K/1, K/2
// Kategori C: PTKP K/3
//
// `upto` adalah batas atas inklusif (penghasilan bulanan bruto dlm Rupiah).

type TerBracket = { upto: number; rate: number };

const TER_A: TerBracket[] = [
  { upto: 5_400_000, rate: 0 },
  { upto: 5_650_000, rate: 0.0025 },
  { upto: 5_950_000, rate: 0.005 },
  { upto: 6_300_000, rate: 0.0075 },
  { upto: 6_750_000, rate: 0.01 },
  { upto: 7_500_000, rate: 0.0125 },
  { upto: 8_550_000, rate: 0.015 },
  { upto: 9_650_000, rate: 0.0175 },
  { upto: 10_050_000, rate: 0.02 },
  { upto: 10_350_000, rate: 0.0225 },
  { upto: 10_700_000, rate: 0.025 },
  { upto: 11_050_000, rate: 0.03 },
  { upto: 11_600_000, rate: 0.035 },
  { upto: 12_500_000, rate: 0.04 },
  { upto: 13_750_000, rate: 0.05 },
  { upto: 15_100_000, rate: 0.06 },
  { upto: 16_950_000, rate: 0.07 },
  { upto: 19_750_000, rate: 0.08 },
  { upto: 24_150_000, rate: 0.09 },
  { upto: 26_450_000, rate: 0.1 },
  { upto: 28_000_000, rate: 0.11 },
  { upto: 30_050_000, rate: 0.12 },
  { upto: 32_400_000, rate: 0.13 },
  { upto: 35_400_000, rate: 0.14 },
  { upto: 39_100_000, rate: 0.15 },
  { upto: 43_850_000, rate: 0.16 },
  { upto: 47_800_000, rate: 0.17 },
  { upto: 51_400_000, rate: 0.18 },
  { upto: 56_300_000, rate: 0.19 },
  { upto: 62_200_000, rate: 0.2 },
  { upto: 68_600_000, rate: 0.21 },
  { upto: 77_500_000, rate: 0.22 },
  { upto: 89_000_000, rate: 0.23 },
  { upto: 103_000_000, rate: 0.24 },
  { upto: 125_000_000, rate: 0.25 },
  { upto: 157_000_000, rate: 0.26 },
  { upto: 206_000_000, rate: 0.27 },
  { upto: 337_000_000, rate: 0.28 },
  { upto: 454_000_000, rate: 0.29 },
  { upto: 550_000_000, rate: 0.3 },
  { upto: 695_000_000, rate: 0.31 },
  { upto: 910_000_000, rate: 0.32 },
  { upto: 1_400_000_000, rate: 0.33 },
  { upto: Infinity, rate: 0.34 },
];

const TER_B: TerBracket[] = [
  { upto: 6_200_000, rate: 0 },
  { upto: 6_500_000, rate: 0.0025 },
  { upto: 6_850_000, rate: 0.005 },
  { upto: 7_300_000, rate: 0.0075 },
  { upto: 9_200_000, rate: 0.01 },
  { upto: 10_750_000, rate: 0.015 },
  { upto: 11_250_000, rate: 0.02 },
  { upto: 11_600_000, rate: 0.025 },
  { upto: 12_600_000, rate: 0.03 },
  { upto: 13_600_000, rate: 0.04 },
  { upto: 14_950_000, rate: 0.05 },
  { upto: 16_400_000, rate: 0.06 },
  { upto: 18_450_000, rate: 0.07 },
  { upto: 21_850_000, rate: 0.08 },
  { upto: 26_000_000, rate: 0.09 },
  { upto: 27_700_000, rate: 0.1 },
  { upto: 29_350_000, rate: 0.11 },
  { upto: 31_450_000, rate: 0.12 },
  { upto: 33_950_000, rate: 0.13 },
  { upto: 37_100_000, rate: 0.14 },
  { upto: 41_100_000, rate: 0.15 },
  { upto: 45_800_000, rate: 0.16 },
  { upto: 49_500_000, rate: 0.17 },
  { upto: 53_800_000, rate: 0.18 },
  { upto: 58_500_000, rate: 0.19 },
  { upto: 64_000_000, rate: 0.2 },
  { upto: 71_000_000, rate: 0.21 },
  { upto: 80_000_000, rate: 0.22 },
  { upto: 93_000_000, rate: 0.23 },
  { upto: 109_000_000, rate: 0.24 },
  { upto: 129_000_000, rate: 0.25 },
  { upto: 163_000_000, rate: 0.26 },
  { upto: 211_000_000, rate: 0.27 },
  { upto: 374_000_000, rate: 0.28 },
  { upto: 459_000_000, rate: 0.29 },
  { upto: 555_000_000, rate: 0.3 },
  { upto: 704_000_000, rate: 0.31 },
  { upto: 957_000_000, rate: 0.32 },
  { upto: 1_405_000_000, rate: 0.33 },
  { upto: Infinity, rate: 0.34 },
];

const TER_C: TerBracket[] = [
  { upto: 6_600_000, rate: 0 },
  { upto: 6_950_000, rate: 0.0025 },
  { upto: 7_350_000, rate: 0.005 },
  { upto: 7_800_000, rate: 0.0075 },
  { upto: 8_850_000, rate: 0.01 },
  { upto: 9_800_000, rate: 0.0125 },
  { upto: 10_950_000, rate: 0.015 },
  { upto: 11_200_000, rate: 0.0175 },
  { upto: 12_050_000, rate: 0.02 },
  { upto: 12_950_000, rate: 0.03 },
  { upto: 14_150_000, rate: 0.04 },
  { upto: 15_550_000, rate: 0.05 },
  { upto: 17_050_000, rate: 0.06 },
  { upto: 19_500_000, rate: 0.07 },
  { upto: 22_700_000, rate: 0.08 },
  { upto: 26_600_000, rate: 0.09 },
  { upto: 28_100_000, rate: 0.1 },
  { upto: 30_100_000, rate: 0.11 },
  { upto: 32_600_000, rate: 0.12 },
  { upto: 35_400_000, rate: 0.13 },
  { upto: 38_900_000, rate: 0.14 },
  { upto: 43_000_000, rate: 0.15 },
  { upto: 47_400_000, rate: 0.16 },
  { upto: 51_200_000, rate: 0.17 },
  { upto: 55_800_000, rate: 0.18 },
  { upto: 60_400_000, rate: 0.19 },
  { upto: 66_700_000, rate: 0.2 },
  { upto: 74_500_000, rate: 0.21 },
  { upto: 83_200_000, rate: 0.22 },
  { upto: 95_600_000, rate: 0.23 },
  { upto: 110_000_000, rate: 0.24 },
  { upto: 134_000_000, rate: 0.25 },
  { upto: 169_000_000, rate: 0.26 },
  { upto: 221_000_000, rate: 0.27 },
  { upto: 390_000_000, rate: 0.28 },
  { upto: 463_000_000, rate: 0.29 },
  { upto: 561_000_000, rate: 0.3 },
  { upto: 709_000_000, rate: 0.31 },
  { upto: 965_000_000, rate: 0.32 },
  { upto: 1_419_000_000, rate: 0.33 },
  { upto: Infinity, rate: 0.34 },
];

export type TerCategory = "A" | "B" | "C";

export function getTerCategory(ptkpStatus: string): TerCategory {
  if (ptkpStatus === "K/3") return "C";
  if (
    ptkpStatus === "TK/2" ||
    ptkpStatus === "TK/3" ||
    ptkpStatus === "K/1" ||
    ptkpStatus === "K/2"
  )
    return "B";
  // TK/0, TK/1, K/0
  return "A";
}

function lookupTerRate(cat: TerCategory, monthlyGross: number): number {
  const table = cat === "A" ? TER_A : cat === "B" ? TER_B : TER_C;
  for (const b of table) {
    if (monthlyGross <= b.upto) return b.rate;
  }
  return 0.34;
}

// =================== Settings ===================

export type PayrollSettingsInput = {
  workingHoursPerMonth?: number; // default 173
  allowanceDefaultPct?: number; // default 0.27
  lateDeductionCapPct?: number; // default 0.10
  lateDeductionBase?: "baseSalary" | "monthlyGross"; // default baseSalary

  otWeekdayFirstRate?: number; // default 1.5
  otWeekdayRate?: number; // default 2.0
  otHolidayFirst8hRate?: number; // default 2.0
  otHoliday9thRate?: number; // default 3.0
  otHoliday10thRate?: number; // default 4.0

  workDaysPerWeek?: 5 | 6; // default 5

  thrFullMonths?: number; // default 12
  thrMinMonths?: number; // default 1

  bpjsKesehatanEnabled?: boolean;
  bpjsJhtEnabled?: boolean;
  bpjsJpEnabled?: boolean;

  defaultJkkClass?: number; // default 1
  taxScheme?: string;
  taxMethod?: "TER" | "ANNUAL"; // default TER (PMK 168/2023)
};

const DEFAULT: Required<PayrollSettingsInput> = {
  workingHoursPerMonth: 173,
  allowanceDefaultPct: 0.27,
  lateDeductionCapPct: 0.1,
  lateDeductionBase: "baseSalary",
  otWeekdayFirstRate: 1.5,
  otWeekdayRate: 2.0,
  otHolidayFirst8hRate: 2.0,
  otHoliday9thRate: 3.0,
  otHoliday10thRate: 4.0,
  workDaysPerWeek: 5,
  thrFullMonths: 12,
  thrMinMonths: 1,
  bpjsKesehatanEnabled: true,
  bpjsJhtEnabled: true,
  bpjsJpEnabled: true,
  defaultJkkClass: 1,
  taxScheme: "gross",
  taxMethod: "TER",
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

/**
 * TER bulanan (PMK 168/2023). Untuk Jan-Nov.
 */
export function pph21TER(opts: {
  monthlyGross: number;
  ptkpStatus: string;
  hasNpwp: boolean;
}): { tax: number; rate: number; category: TerCategory } {
  const cat = getTerCategory(opts.ptkpStatus);
  const rate = lookupTerRate(cat, opts.monthlyGross);
  let tax = Math.round(opts.monthlyGross * rate);
  if (!opts.hasNpwp) tax = Math.round(tax * 1.2);
  return { tax, rate, category: cat };
}

/**
 * Rekonsiliasi tahunan (Desember atau bulan terakhir kerja).
 * Hitung pajak progresif tahunan, dikurangi yang sudah dibayar via TER.
 * Hasil bisa negatif (kelebihan bayar). Caller bisa decide cap di 0.
 */
export function pph21Reconciliation(opts: {
  ytdGrossIncludeMonth: number; // sum gross Jan-Des
  ytdEmployeeBpjsIncludeMonth: number;
  ytdTaxPaidPriorMonths: number; // total PPh21 sudah dibayar Jan-Nov
  ptkpStatus: string;
  hasNpwp: boolean;
}): { tax: number; pkp: number; ptkp: number; biayaJabatan: number; annualTax: number } {
  const annual = opts.ytdGrossIncludeMonth;
  const biayaJabatanAnnual = Math.min(annual * 0.05, 6_000_000);
  const ptkp = PTKP_TABLE[opts.ptkpStatus] ?? PTKP_TABLE["TK/0"];
  let pkp = annual - biayaJabatanAnnual - opts.ytdEmployeeBpjsIncludeMonth - ptkp;
  pkp = Math.max(0, Math.floor(pkp / 1000) * 1000);
  let annualTax = pph21Annual(pkp);
  if (!opts.hasNpwp) annualTax = Math.round(annualTax * 1.2);
  const dec = annualTax - opts.ytdTaxPaidPriorMonths;
  return {
    tax: Math.max(0, dec),
    pkp,
    ptkp,
    biayaJabatan: Math.round(biayaJabatanAnnual / 12),
    annualTax,
  };
}

/**
 * Hitung PPh 21 bulanan.
 *
 * - Jika `month` 1..11: pakai TER PMK 168/2023.
 * - Jika `month === 12` dan `ytd*` tersedia: rekonsiliasi tahunan.
 * - Default backward-compat: pakai annual progressive ÷ 12 (legacy).
 *
 * @deprecated Untuk produksi, gunakan pph21TER() dan pph21Reconciliation().
 */
export function pph21Monthly(opts: {
  monthlyGross: number;
  ptkpStatus: string;
  monthlyEmployeeBpjs: number;
  hasNpwp: boolean;
  month?: number;
  taxMethod?: "TER" | "ANNUAL";
  ytdGrossPriorMonths?: number;
  ytdEmployeeBpjsPriorMonths?: number;
  ytdTaxPaidPriorMonths?: number;
}): { tax: number; pkp: number; ptkp: number; biayaJabatan: number } {
  const method = opts.taxMethod ?? "TER";

  if (method === "TER") {
    if (opts.month === 12 && opts.ytdGrossPriorMonths !== undefined) {
      const ytdGross = (opts.ytdGrossPriorMonths || 0) + opts.monthlyGross;
      const ytdBpjs =
        (opts.ytdEmployeeBpjsPriorMonths || 0) + opts.monthlyEmployeeBpjs;
      const recon = pph21Reconciliation({
        ytdGrossIncludeMonth: ytdGross,
        ytdEmployeeBpjsIncludeMonth: ytdBpjs,
        ytdTaxPaidPriorMonths: opts.ytdTaxPaidPriorMonths || 0,
        ptkpStatus: opts.ptkpStatus,
        hasNpwp: opts.hasNpwp,
      });
      return {
        tax: recon.tax,
        pkp: recon.pkp,
        ptkp: recon.ptkp,
        biayaJabatan: recon.biayaJabatan,
      };
    }
    // Jan-Nov: TER
    const ter = pph21TER({
      monthlyGross: opts.monthlyGross,
      ptkpStatus: opts.ptkpStatus,
      hasNpwp: opts.hasNpwp,
    });
    return {
      tax: ter.tax,
      pkp: 0,
      ptkp: PTKP_TABLE[opts.ptkpStatus] ?? PTKP_TABLE["TK/0"],
      biayaJabatan: 0,
    };
  }

  // Legacy ANNUAL ÷ 12 (pra-2024)
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
 *
 * Weekday: jam 1 = 1.5x, jam 2+ = 2x.
 * Holiday/weekend, 5-day work-week: jam 1-8 = 2x, jam 9 = 3x, jam 10+ = 4x.
 * Holiday/weekend, 6-day work-week: jam 1-7 = 2x, jam 8 = 3x, jam 9+ = 4x.
 */
export function calculateOvertimePay(opts: {
  monthlyGross: number;
  entries: OvertimeEntry[];
  settings?: PayrollSettingsInput;
}) {
  const s = withDefaults(opts.settings);
  const hourlyRate = opts.monthlyGross / s.workingHoursPerMonth;
  // 6-day workweek: shift breakpoint 1 jam lebih awal (Permenaker 102/2004 pasal 11).
  const holidayBreak = s.workDaysPerWeek === 6 ? 7 : 8;
  let totalPay = 0;
  let totalHours = 0;
  let totalHolidayHours = 0;
  let totalWeekdayHours = 0;

  for (const e of opts.entries) {
    if (!e.hours || e.hours <= 0) continue;
    totalHours += e.hours;
    if (e.isHoliday) {
      totalHolidayHours += e.hours;
      const h = e.hours;
      let pay = 0;
      pay += Math.min(h, holidayBreak) * s.otHolidayFirst8hRate;
      if (h > holidayBreak) pay += Math.min(h - holidayBreak, 1) * s.otHoliday9thRate;
      if (h > holidayBreak + 1) pay += (h - holidayBreak - 1) * s.otHoliday10thRate;
      totalPay += pay * hourlyRate;
    } else {
      totalWeekdayHours += e.hours;
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
  baseSalary?: number;
  totalLateMinutes: number;
  settings?: PayrollSettingsInput;
}) {
  const s = withDefaults(opts.settings);
  const base =
    s.lateDeductionBase === "baseSalary" && opts.baseSalary !== undefined
      ? opts.baseSalary
      : opts.monthlyGross;
  const hourlyRate = base / s.workingHoursPerMonth;
  const minuteRate = hourlyRate / 60;
  const raw = minuteRate * opts.totalLateMinutes;
  const cap = base * s.lateDeductionCapPct;
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

// =================== Pro-rata join/resign ===================

/**
 * Faktor pro-rata berdasar hari kalender bulan tersebut.
 * - Karyawan join sebelum tgl 1 atau tetap aktif setelah tgl terakhir → 1.0
 * - Karyawan join tgl 15 dari 30 hari → 16/30 ≈ 0.53
 * - Karyawan resign tgl 20 dari 30 hari → 20/30 ≈ 0.67
 */
export function prorataFactor(opts: {
  period: string; // YYYY-MM
  joinDate?: Date | string | null;
  resignDate?: Date | string | null;
}): number {
  const [y, m] = opts.period.split("-").map(Number);
  if (!y || !m) return 1;
  const monthStart = new Date(y, m - 1, 1);
  const monthEnd = new Date(y, m, 0);
  const totalDays = monthEnd.getDate();

  let firstActive = monthStart;
  let lastActive = monthEnd;

  if (opts.joinDate) {
    const j = new Date(opts.joinDate);
    if (!isNaN(j.getTime()) && j > monthStart) firstActive = j;
  }
  if (opts.resignDate) {
    const r = new Date(opts.resignDate);
    if (!isNaN(r.getTime()) && r < monthEnd) lastActive = r;
  }

  if (firstActive > lastActive) return 0;
  if (firstActive <= monthStart && lastActive >= monthEnd) return 1;

  const activeDays = lastActive.getDate() - firstActive.getDate() + 1;
  return Math.max(0, Math.min(1, activeDays / totalDays));
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
  // Period info — wajib untuk TER & December reconciliation
  month?: number; // 1..12
  // For TER December reconciliation
  ytdGrossPriorMonths?: number;
  ytdEmployeeBpjsPriorMonths?: number;
  ytdTaxPaidPriorMonths?: number;
  // Pro-rata factor (0..1) - digunakan utk join/resign tengah bulan
  prorataFactor?: number;
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
  prorataFactor: number;

  netSalary: number;
};

export function calculatePayroll(input: PayrollInput): PayrollBreakdown {
  const s = withDefaults(input.settings);
  const factor = input.prorataFactor ?? 1;
  const baseFull = input.baseSalary || 0;
  const allowanceFull =
    input.allowance ?? Math.round(baseFull * s.allowanceDefaultPct);
  const baseSalary = Math.round(baseFull * factor);
  const allowance = Math.round(allowanceFull * factor);
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

  // Tax base = monthlyGross + bonus + thr (sesuai PMK, semua penghasilan teratur+tidak teratur)
  const taxBase = monthlyGross + bonus + thr;
  const tax = pph21Monthly({
    monthlyGross: taxBase,
    ptkpStatus,
    monthlyEmployeeBpjs: bpjsEmployee,
    hasNpwp,
    month: input.month,
    taxMethod: s.taxMethod,
    ytdGrossPriorMonths: input.ytdGrossPriorMonths,
    ytdEmployeeBpjsPriorMonths: input.ytdEmployeeBpjsPriorMonths,
    ytdTaxPaidPriorMonths: input.ytdTaxPaidPriorMonths,
  });

  const ot = calculateOvertimePay({
    monthlyGross,
    entries: input.overtimeEntries ?? [],
    settings: input.settings,
  });

  const late = lateDeduction({
    monthlyGross,
    baseSalary,
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
    prorataFactor: factor,

    netSalary,
  };
}

export const WORKING_HOURS_PER_MONTH = 173;
