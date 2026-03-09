// ============================================================================
// In-memory rate limiter
// Each Vercel serverless instance gets its own Map, which provides natural
// distribution across instances. Not shared state — that's fine for basic
// abuse prevention.
// ============================================================================

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitConfig {
  /** Time window in milliseconds (default: 60_000 = 60s) */
  windowMs: number;
  /** Max requests per window (default: 60) */
  max: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const DEFAULT_CONFIG: RateLimitConfig = { windowMs: 60_000, max: 60 };

const store = new Map<string, RateLimitEntry>();
let checkCount = 0;

function cleanup(windowMs: number) {
  const now = Date.now();
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

export function checkRateLimit(
  ip: string,
  config: Partial<RateLimitConfig> = {}
): RateLimitResult {
  const { windowMs, max } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();

  // Periodic cleanup every 100 checks
  checkCount++;
  if (checkCount % 100 === 0) cleanup(windowMs);

  let entry = store.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(ip, entry);
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  const resetAt = entry.timestamps.length > 0
    ? entry.timestamps[0] + windowMs
    : now + windowMs;

  if (entry.timestamps.length >= max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: max - entry.timestamps.length,
    resetAt,
  };
}
