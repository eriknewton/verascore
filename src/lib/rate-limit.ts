/**
 * Simple in-memory rate limiter for API endpoints.
 *
 * Tracks requests per key (typically agentId) within a sliding window.
 * Resets automatically. No external dependencies.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000; // Clean up every 60s
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now - entry.windowStart > windowMs) {
      store.delete(key);
    }
  }
}

/**
 * Check if a request is within rate limits.
 *
 * @param key       - Rate limit key (e.g. agentId or IP)
 * @param maxRequests - Max requests per window
 * @param windowMs  - Window duration in milliseconds
 * @returns { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetIn: number } {
  cleanup(windowMs);

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  if (entry.count >= maxRequests) {
    const resetIn = windowMs - (now - entry.windowStart);
    return { allowed: false, remaining: 0, resetIn };
  }

  entry.count++;
  const resetIn = windowMs - (now - entry.windowStart);
  return { allowed: true, remaining: maxRequests - entry.count, resetIn };
}
