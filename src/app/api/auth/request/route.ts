import { randomBytes } from "crypto";
import { checkRateLimitDb } from "@/lib/rate-limit-db";
import { canonicalizeEmailForRateLimit } from "@/lib/email-normalize";

/**
 * POST /api/auth/request — magic-link request endpoint.
 *
 * Body: { email }
 *
 * Creates a MagicLinkToken row with a 15-minute expiry and a
 * cryptographically random URL-safe token. The "email" is stubbed —
 * we log the verify URL to the console instead of sending SMTP.
 *
 * DELTA-06: rate limited via Prisma-backed RateLimitBucket.
 * DELTA-13: rate-limit key uses a canonicalized SHA-256 hash of the
 *           email (lowercased, +tag stripped, dots stripped for gmail).
 * DELTA-16: DB failure returns 503 (fail closed).
 */

const TOKEN_BYTES = 32;
const TTL_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;

function urlSafeToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

function isValidEmail(email: string): boolean {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  const rlKey = canonicalizeEmailForRateLimit(email);
  const rl = await checkRateLimitDb(
    "auth-request",
    rlKey,
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW
  );
  if (!rl.allowed) {
    return Response.json(
      { error: "Too many requests. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  const token = urlSafeToken();
  const expiresAt = new Date(Date.now() + TTL_MS);
  // DELTA-12: require NEXT_PUBLIC_URL in production (fail closed).
  const baseUrl = getBaseUrl();
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;

  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import("@/lib/db");
      await prisma.magicLinkToken.create({
        data: { token, email, expiresAt },
      });
    } catch (err) {
      // DELTA-16: fail closed on DB failure + alerting-quality log.
      console.error(
        "[auth/request] DB insert failed — magic link NOT issued",
        err
      );
      return Response.json(
        { error: "Auth backend unavailable. Try again later." },
        { status: 503 }
      );
    }
  }

  // Email stub: log for dev visibility.
  console.log(`[auth] magic link for ${email}: ${verifyUrl}`);

  return Response.json({ ok: true });
}

function getBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_URL;
  if (configured && configured.startsWith("http")) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_URL must be set in production (no localhost fallback)"
    );
  }
  return "http://localhost:3000";
}
