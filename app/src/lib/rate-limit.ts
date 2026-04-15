/**
 * Lightweight in-memory sliding-window rate limiter.
 * Uses a Map of IP → timestamps[]. No external dependencies.
 * Runs per-instance (Vercel serverless = per cold start), which
 * provides basic protection without requiring Redis/Upstash.
 */

const store = new Map<string, number[]>();

const WINDOW_MS = 60_000; // 1 minute
const CLEANUP_INTERVAL_MS = 300_000; // 5 minutes

// Periodically purge stale entries
if (typeof globalThis !== "undefined") {
  let lastCleanup = Date.now();
  const cleanup = () => {
    const cutoff = Date.now() - WINDOW_MS;
    for (const [key, timestamps] of store) {
      const filtered = timestamps.filter((t) => t > cutoff);
      if (filtered.length === 0) {
        store.delete(key);
      } else {
        store.set(key, filtered);
      }
    }
  };
  // Attach to globalThis to avoid duplicate intervals in hot-reload
  if (!(globalThis as Record<string, unknown>).__tavsinRateLimitCleanup) {
    (globalThis as Record<string, unknown>).__tavsinRateLimitCleanup = true;
    setInterval(() => {
      if (Date.now() - lastCleanup >= CLEANUP_INTERVAL_MS) {
        cleanup();
        lastCleanup = Date.now();
      }
    }, CLEANUP_INTERVAL_MS);
  }
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

export function checkRateLimit(
  key: string,
  maxRequests: number = 60
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const timestamps = (store.get(key) ?? []).filter((t) => t > cutoff);

  if (timestamps.length >= maxRequests) {
    const oldestInWindow = timestamps[0];
    return {
      allowed: false,
      retryAfterMs: oldestInWindow + WINDOW_MS - now,
    };
  }

  timestamps.push(now);
  store.set(key, timestamps);
  return { allowed: true };
}

export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
