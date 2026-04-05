import { randomBytes } from "crypto";

/**
 * POST /api/auth/request — magic-link request endpoint.
 *
 * Body: { email }
 *
 * Creates a MagicLinkToken row with a 15-minute expiry and a
 * cryptographically random URL-safe token. The "email" is stubbed —
 * we log the verify URL to the console instead of sending SMTP.
 *
 * Rate limited to 3 requests per email per 15 minutes using an
 * in-memory Map. Responds { ok: true } for both known and unknown
 * emails so the endpoint does not leak account existence.
 */

const TOKEN_BYTES = 32;
const TTL_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;

interface RateEntry {
  count: number;
  windowStart: number;
}
const rateStore = new Map<string, RateEntry>();

function checkEmailRate(email: string): boolean {
  const now = Date.now();
  const entry = rateStore.get(email);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateStore.set(email, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

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

  if (!checkEmailRate(email)) {
    return Response.json(
      { error: "Too many requests. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  const token = urlSafeToken();
  const expiresAt = new Date(Date.now() + TTL_MS);
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;

  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import("@/lib/db");
      await prisma.magicLinkToken.create({
        data: { token, email, expiresAt },
      });
    } catch (err) {
      console.warn("auth/request: DB insert failed (table may be missing)", err);
      // Intentionally don't reveal DB state to caller.
    }
  }

  // Email stub: log for dev visibility.
  console.log(`[auth] magic link for ${email}: ${verifyUrl}`);

  return Response.json({ ok: true });
}
