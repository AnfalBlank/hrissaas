/**
 * Format menit ke string "X jam Y menit" yang user-friendly.
 *
 * Contoh:
 * - 0 → "Tepat waktu"
 * - 5 → "5 menit"
 * - 60 → "1 jam"
 * - 75 → "1 jam 15 menit"
 * - 133 → "2 jam 13 menit"
 */
export function formatMinutes(minutes: number, opts?: { zeroLabel?: string }): string {
  const m = Math.abs(Math.round(minutes ?? 0));
  if (m === 0) return opts?.zeroLabel ?? "0 menit";
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  if (hours === 0) return `${mins} menit`;
  if (mins === 0) return `${hours} jam`;
  return `${hours} jam ${mins} menit`;
}

/**
 * Format menit ke string singkat "Xj Ym".
 *
 * Contoh:
 * - 75 → "1j 15m"
 * - 60 → "1j"
 * - 5 → "5m"
 */
export function formatMinutesShort(minutes: number): string {
  const m = Math.abs(Math.round(minutes ?? 0));
  if (m === 0) return "0m";
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}j`;
  return `${hours}j ${mins}m`;
}

/**
 * Format jam dengan desimal ke "X jam Y menit".
 * 1.5 → "1 jam 30 menit"
 */
export function formatHours(hours: number): string {
  return formatMinutes(Math.round((hours ?? 0) * 60));
}

/**
 * Hitung jam dari menit dengan precision 1 desimal.
 * 75 → 1.25
 */
export function minutesToHours(minutes: number): number {
  return Math.round(((minutes ?? 0) / 60) * 100) / 100;
}

/**
 * Hitung pendapatan lembur untuk display per hari.
 * Pakai rate Permenaker 102/2004:
 * - Weekday: jam 1 = 1.5x, jam 2+ = 2x
 * - Holiday (5-day): jam 1-8 = 2x, jam 9 = 3x, jam 10+ = 4x
 * - Holiday (6-day): jam 1-7 = 2x, jam 8 = 3x, jam 9+ = 4x
 */
export function calculateDailyOvertimePay(opts: {
  hours: number;
  monthlyGross: number;
  isHoliday?: boolean;
  workingHoursPerMonth?: number;
  workDaysPerWeek?: 5 | 6;
}): {
  pay: number;
  hourlyRate: number;
  breakdown: { label: string; hours: number; multiplier: number; subtotal: number }[];
} {
  const whpm = opts.workingHoursPerMonth ?? 173;
  const hourlyRate = opts.monthlyGross / whpm;
  const breakdown: { label: string; hours: number; multiplier: number; subtotal: number }[] = [];

  if (!opts.isHoliday) {
    // Weekday
    const h1 = Math.min(opts.hours, 1);
    const h2 = Math.max(0, opts.hours - 1);
    if (h1 > 0) {
      const sub = h1 * 1.5 * hourlyRate;
      breakdown.push({
        label: `Jam ke-1 (1.5×)`,
        hours: h1,
        multiplier: 1.5,
        subtotal: Math.round(sub),
      });
    }
    if (h2 > 0) {
      const sub = h2 * 2 * hourlyRate;
      breakdown.push({
        label: `Jam ke-2 dst (2×)`,
        hours: h2,
        multiplier: 2,
        subtotal: Math.round(sub),
      });
    }
  } else {
    // Holiday
    const breakPoint = (opts.workDaysPerWeek ?? 5) === 6 ? 7 : 8;
    const firstBlock = Math.min(opts.hours, breakPoint);
    const ninthHour = opts.hours > breakPoint ? Math.min(1, opts.hours - breakPoint) : 0;
    const tenthPlus = opts.hours > breakPoint + 1 ? opts.hours - breakPoint - 1 : 0;

    if (firstBlock > 0) {
      const sub = firstBlock * 2 * hourlyRate;
      breakdown.push({
        label: `Jam 1-${breakPoint} (2×)`,
        hours: firstBlock,
        multiplier: 2,
        subtotal: Math.round(sub),
      });
    }
    if (ninthHour > 0) {
      const sub = ninthHour * 3 * hourlyRate;
      breakdown.push({
        label: `Jam ke-${breakPoint + 1} (3×)`,
        hours: ninthHour,
        multiplier: 3,
        subtotal: Math.round(sub),
      });
    }
    if (tenthPlus > 0) {
      const sub = tenthPlus * 4 * hourlyRate;
      breakdown.push({
        label: `Jam ke-${breakPoint + 2}+ (4×)`,
        hours: tenthPlus,
        multiplier: 4,
        subtotal: Math.round(sub),
      });
    }
  }

  const pay = breakdown.reduce((s, b) => s + b.subtotal, 0);
  return {
    pay,
    hourlyRate: Math.round(hourlyRate),
    breakdown,
  };
}
