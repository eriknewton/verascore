import { randomBytes } from "crypto";
import { buildSessionCookie, SESSION_TTL_MS } from "@/lib/auth";

/**
 * GET /api/auth/verify?token=...
 *
 * Validates a MagicLinkToken. On success:
 *   - marks the token usedAt
 *   - upserts a User by email
 *   - creates a Session (30-day expiry)
 *   - sets a httpOnly cookie `vs_session`
 *   - redirects to /fleet
 */

const SESSION_TOKEN_BYTES = 32;

function loginRedirect(error: string): Response {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  return Response.redirect(
    `${baseUrl}/login?error=${encodeURIComponent(error)}`,
    302
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return loginRedirect("missing-token");
  }

  if (!process.env.DATABASE_URL) {
    return loginRedirect("auth-unavailable");
  }

  try {
    const { prisma } = await import("@/lib/db");

    const link = await prisma.magicLinkToken.findUnique({ where: { token } });
    if (!link) return loginRedirect("invalid-token");
    if (link.usedAt) return loginRedirect("token-used");
    if (link.expiresAt.getTime() < Date.now()) {
      return loginRedirect("token-expired");
    }

    await prisma.magicLinkToken.update({
      where: { token },
      data: { usedAt: new Date() },
    });

    const user = await prisma.user.upsert({
      where: { email: link.email },
      update: { emailVerified: new Date() },
      create: { email: link.email, emailVerified: new Date() },
    });

    const sessionToken = randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const headers = new Headers();
    headers.set("Location", `${baseUrl}/fleet`);
    headers.set("Set-Cookie", buildSessionCookie(sessionToken, expiresAt));
    // DELTA-07: never leak the magic-link token to the destination page
    // via Referer (e.g. if /fleet embeds third-party images/scripts).
    headers.set("Referrer-Policy", "no-referrer");
    headers.set("Cache-Control", "no-store");

    return new Response(null, { status: 302, headers });
  } catch (err) {
    console.warn("auth/verify: DB error", err);
    return loginRedirect("auth-unavailable");
  }
}
