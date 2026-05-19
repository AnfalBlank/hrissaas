/**
 * Rate limiter — hybrid in-memory + optional Upstash Redis.
 *
 * Jika env `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` di-set,
 * pakai Redis (persistent, multi-instance safe).
 * Jika tidak, fallback ke in-memory Map (per-instance, hilang saat restart).
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

// ============ Upstash Redis adapter (optional) ============

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = !!(REDIS_URL && REDIS_TOKEN);

async function redisGet(key: string): Promise<Bucket | null> {
  if (!useRedis) return null;
  try {
    const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });
    const json = await res.json();
    if (!json.result) return null;
    return JSON.parse(json.result);
  } catch {
    return null;
  }
}

async function redisSet(key: string, bucket: Bucket, ttlSec: number) {
  if (!useRedis) return;
  try {
    await fetch(
      `${REDIS_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(
        JSON.stringify(bucket)
      )}/EX/${ttlSec}`,
      { headers: { Authorization: `Bearer ${REDIS_TOKEN}` } }
    );
  } catch {}
}

async function redisDel(key: string) {
  if (!useRedis) return;
  try {
    await fetch(`${REDIS_URL}/del/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });
  } catch {}
}

// ============ Public API ============

function getLocalBucket(key: string): Bucket {
  return buckets.get(key) ?? { fails: [] };
}

export function checkRateLimit(key: string): {
  allowed: boolean;
  retryAfterSec?: number;
  remaining: number;
} {
  const now = Date.now();
  const b = getLocalBucket(key);

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
    buckets.set(key, b);
  }

  b.fails = b.fails.filter((t) => now - t < WINDOW_MS);
  return { allowed: true, remaining: Math.max(0, THRESHOLD - b.fails.length) };
}

export function recordFailedAttempt(key: string): {
  blocked: boolean;
  remaining: number;
  retryAfterSec?: number;
} {
  const now = Date.now();
  let b = getLocalBucket(key);
  b.fails = b.fails.filter((t) => now - t < WINDOW_MS);
  b.fails.push(now);

  if (b.fails.length >= THRESHOLD) {
    b.blockedUntil = now + LOCKOUT_MS;
    buckets.set(key, b);
    // Persist to Redis async
    redisSet(key, b, Math.ceil(LOCKOUT_MS / 1000) + 60);
    return {
      blocked: true,
      remaining: 0,
      retryAfterSec: Math.ceil(LOCKOUT_MS / 1000),
    };
  }
  buckets.set(key, b);
  redisSet(key, b, Math.ceil(WINDOW_MS / 1000) + 60);
  return { blocked: false, remaining: THRESHOLD - b.fails.length };
}

export function resetAttempts(key: string) {
  buckets.delete(key);
  redisDel(key);
}

/**
 * Hydrate from Redis on cold start (call once per key check).
 * Non-blocking — if Redis unavailable, uses local.
 */
export async function hydrateFromRedis(key: string) {
  if (!useRedis) return;
  const remote = await redisGet(key);
  if (remote) {
    buckets.set(key, remote);
  }
}
