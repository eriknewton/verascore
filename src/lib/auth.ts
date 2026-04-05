/**
 * Session-based auth helpers for Verascore.
 *
 * Magic-link flow creates a Session row in Postgres and sets a
 * httpOnly cookie `vs_session` holding the session token. These
 * helpers translate a request's cookie into the authenticated user.
 *
 * All DB access is guarded — Phase B code may run before the
 * auth tables have been pushed to production, so callers should
 * treat `null` as "unauthenticated or unavailable" and respond
 * with a 401/redirect.
 */

import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "vs_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Read the session cookie from a NextRequest or a plain Request.
 * Returns null if the cookie is missing.
 */
export function readSessionToken(
  req: NextRequest | Request
): string | null {
  // NextRequest has .cookies.get()
  if ("cookies" in req && typeof (req as NextRequest).cookies?.get === "function") {
    const c = (req as NextRequest).cookies.get(SESSION_COOKIE);
    return c?.value ?? null;
  }
  // Fallback: parse Cookie header
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return rest.join("=");
  }
  return null;
}

/**
 * Look up the current user from server component context
 * (using next/headers cookies()). Returns null when unauthenticated
 * or the session backend is unavailable.
 */
export async function getSessionUserFromCookies(): Promise<SessionUser | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const { prisma } = await import("./db");
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!session) return null;
    if (session.expiresAt.getTime() < Date.now()) return null;
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name ?? null,
    };
  } catch (err) {
    console.warn("getSessionUserFromCookies: lookup failed", err);
    return null;
  }
}

/**
 * Look up the currently authenticated user for a request.
 *
 * Returns null when:
 *   - no cookie is set
 *   - the session is expired
 *   - DATABASE_URL is missing (no auth backend available)
 *   - the session tables are missing (pre-migration environments)
 */
export async function getSessionUser(
  req: NextRequest | Request
): Promise<SessionUser | null> {
  const token = readSessionToken(req);
  if (!token) return null;

  if (!process.env.DATABASE_URL) return null;

  try {
    const { prisma } = await import("./db");
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!session) return null;
    if (session.expiresAt.getTime() < Date.now()) return null;

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name ?? null,
    };
  } catch (err) {
    // Pre-migration: session table may not exist yet.
    console.warn("getSessionUser: DB lookup failed", err);
    return null;
  }
}

/**
 * Build the Set-Cookie string for a new session.
 */
export function buildSessionCookie(
  token: string,
  expiresAt: Date
): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${expiresAt.toUTCString()}`,
  ];
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  return parts.join("; ");
}
