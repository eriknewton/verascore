import { randomBytes } from "crypto";
import { getSessionUser } from "@/lib/auth";

/**
 * POST /api/claim — human-initiated agent claim challenge.
 *
 * Authenticated (session cookie required). The caller asserts
 * ownership of an agent identified by its DID. We generate a
 * random 32-byte nonce, store a ClaimChallenge bound to the
 * user + DID, and return it for signing.
 *
 * Body: { did }
 * Response: { nonce, expiresAt }
 *
 * TTL: 10 minutes.
 */

const NONCE_BYTES = 32;
const CHALLENGE_TTL_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const did = typeof body.did === "string" ? body.did.trim() : "";
  if (!did.startsWith("did:")) {
    return Response.json({ error: "Invalid DID" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return Response.json(
      { error: "Claim flow requires a database" },
      { status: 503 }
    );
  }

  const nonce = randomBytes(NONCE_BYTES).toString("base64url");
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);

  try {
    const { prisma } = await import("@/lib/db");
    await prisma.claimChallenge.create({
      data: {
        nonce,
        did,
        userId: user.id,
        expiresAt,
      },
    });
  } catch (err) {
    console.warn("claim: DB insert failed", err);
    return Response.json(
      { error: "Claim challenge store unavailable" },
      { status: 503 }
    );
  }

  return Response.json({ nonce, expiresAt: expiresAt.toISOString() });
}
