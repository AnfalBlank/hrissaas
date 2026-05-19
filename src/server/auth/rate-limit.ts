/**
 * Rate limiter sederhana berbasis in-memory map (per instance).
 * Cocok untuk login throttling. Untuk multi-instance scale, ganti ke Redis.
 *
 * Strategi:
 * - max 5 failed attempt per (key) dalam window 15 menit → return blocked.
 * - lockout 30 menit setelah threshold tercapai.
 * - reset counter saat success.
 */

type Bucket = {
  fails: number[];
  blockedUntil?: number;
};

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000;
const THRESHOLD = 5;
const LOCKOUT_MS = 30 * 60 * 1000;

export function checkRateLimit(key: string): {
  allowed: boolean;
  retryAfterSec?: number;
  remaining: number;
} {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b) return { allowed: true, remaining: THRESHOLD };

  // Sweep blocked
  if (b.blockedUntil && b.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((b.blockedUntil - now) / 1000),
      remaining: 0,
    };
  }
  if (b.blockedUntil && b.blockedUntil <= now) {
    b.blockedUntil = undefined;
    b.fails = [];
  }

  // Filter fails dalam window
  b.fails = b.fails.filter((t) => now - t < WINDOW_MS);
  return { allowed: true, remaining: Math.max(0, THRESHOLD - b.fails.length) };
}

export function recordFailedAttempt(key: string): {
  blocked: boolean;
  remaining: number;
  retryAfterSec?: number;
} {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) {
    b = { fails: [] };
    buckets.set(key, b);
  }
  b.fails = b.fails.filter((t) => now - t < WINDOW_MS);
  b.fails.push(now);

  if (b.fails.length >= THRESHOLD) {
    b.blockedUntil = now + LOCKOUT_MS;
    return {
      blocked: true,
      remaining: 0,
      retryAfterSec: Math.ceil(LOCKOUT_MS / 1000),
    };
  }
  return { blocked: false, remaining: THRESHOLD - b.fails.length };
}

export function resetAttempts(key: string) {
  buckets.delete(key);
}
