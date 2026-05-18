/** Haversine distance in meters */
export function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function todayLocalDate(tz = "Asia/Jakarta") {
  return new Date().toLocaleDateString("en-CA", { timeZone: tz });
  // YYYY-MM-DD
}

export function nowMs() {
  return Date.now();
}

/**
 * Hitung selisih menit antara waktu sekarang dengan target jam HH:MM
 * di timezone tertentu. Positif = lewat dari target, negatif = sebelum target.
 *
 * Menghindari bug timezone server (Vercel di UTC) — perhitungan late detection
 * harus pakai timezone perusahaan, bukan timezone server.
 */
export function minutesSinceTarget(
  targetHHMM: string,
  tz = "Asia/Jakarta",
  now: Date = new Date()
): number {
  // Format current time di tz target
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.format(now); // "HH:MM"
  const [curH, curM] = parts.split(":").map(Number);
  const [tgtH, tgtM] = targetHHMM.split(":").map(Number);
  return curH * 60 + curM - (tgtH * 60 + tgtM);
}
