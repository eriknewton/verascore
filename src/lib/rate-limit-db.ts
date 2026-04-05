/**
 * DELTA-06: Prisma-backed sliding-window rate limiter.
 *
 * Replaces the in-memory Map rate limiter. Keyed on (surface, identity,
 * windowStart) so windows align deterministically. Falls back to the
 * in-memory limiter if DATABASE_URL is unset or the table is missing.
 */

import { checkRateLimit as memCheckRateLimit } from "./rate-limit";

export interface RateLimitCheck {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

export async function checkRateLimitDb(
  surface: string,
  identity: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitCheck> {
  if (!process.env.DATABASE_URL) {
    // Fall back to in-memory limiter.
    const mem = memCheckRateLimit(
      `${surface}:${identity}`,
      maxRequests,
      windowMs
    );
    return {
      allowed: mem.allowed,
      remaining: mem.remaining,
      resetInMs: mem.resetIn,
    };
  }

  try {
    const { prisma } = await import("./db");
    const now = Date.now();
    const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
    const expiresAt = new Date(windowStart.getTime() + windowMs);

    // Best-effort sweep of expired rows (no-op if none).
    // We sweep at most once every ~60s by using the window boundary modulo.
    if (Math.floor(now / 60_000) % 5 === 0) {
      // Fire-and-forget; do not await inside hot path.
      prisma.rateLimitBucket
        .deleteMany({ where: { expiresAt: { lt: new Date(now) } } })
        .catch(() => {});
    }

    const bucket = await prisma.rateLimitBucket.upsert({
      where: {
        surface_identity_windowStart: {
          surface,
          identity,
          windowStart,
        },
      },
      create: { surface, identity, windowStart, count: 1, expiresAt },
      update: { count: { increment: 1 } },
    });

    const allowed = bucket.count <= maxRequests;
    const remaining = Math.max(0, maxRequests - bucket.count);
    const resetInMs = expiresAt.getTime() - now;
    return { allowed, remaining, resetInMs };
  } catch (err) {
    // Table missing / transient DB error → fall back to in-memory.
    console.warn("[rate-limit-db] falling back to in-memory:", err);
    const mem = memCheckRateLimit(
      `${surface}:${identity}`,
      maxRequests,
      windowMs
    );
    return {
      allowed: mem.allowed,
      remaining: mem.remaining,
      resetInMs: mem.resetIn,
    };
  }
}
