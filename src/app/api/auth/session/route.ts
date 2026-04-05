/**
 * DELTA-15: DELETE /api/auth/session — logout.
 *
 * Deletes the current Session row from Postgres and clears the
 * `vs_session` cookie on the client. Idempotent: returns ok even if
 * the session does not exist.
 */

import { readSessionToken, SESSION_COOKIE } from "@/lib/auth";

function clearCookieHeader(): string {
  const parts = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export async function DELETE(request: Request) {
  const token = readSessionToken(request);

  if (token && process.env.DATABASE_URL) {
    try {
      const { prisma } = await import("@/lib/db");
      await prisma.session.deleteMany({ where: { token } });
    } catch (err) {
      console.warn("[auth/session] delete failed", err);
      // Still clear the cookie client-side.
    }
  }

  const headers = new Headers();
  headers.set("Set-Cookie", clearCookieHeader());
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: (() => {
      headers.set("Content-Type", "application/json");
      return headers;
    })(),
  });
}
