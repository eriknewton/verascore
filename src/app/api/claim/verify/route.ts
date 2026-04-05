import {
  verifyEd25519,
  base64urlToBuffer,
  publicKeyFromDid,
} from "@/lib/crypto";
import {
  getSessionUser,
  readSessionToken,
  buildSessionCookie,
  SESSION_TTL_MS,
} from "@/lib/auth";
import { randomBytes } from "crypto";

/**
 * POST /api/claim/verify — human-initiated claim verification.
 *
 * Authenticated. Body: { did, nonce, signature }
 *
 * Looks up the ClaimChallenge by nonce, verifies the Ed25519
 * signature over the nonce using the public key embedded in the
 * did:key DID, and on success:
 *   - marks the challenge usedAt
 *   - creates an AgentOwnership row (HUMAN_INITIATED)
 *
 * Responds { ok: true, agentId }.
 */

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
  const nonce = typeof body.nonce === "string" ? body.nonce : "";
  const signatureStr = typeof body.signature === "string" ? body.signature : "";

  if (!did || !nonce || !signatureStr) {
    return Response.json(
      { error: "Missing required fields: did, nonce, signature" },
      { status: 400 }
    );
  }

  if (!process.env.DATABASE_URL) {
    return Response.json(
      { error: "Claim flow requires a database" },
      { status: 503 }
    );
  }

  const publicKeyRaw = publicKeyFromDid(did);
  if (!publicKeyRaw) {
    return Response.json(
      { error: "Unsupported DID — must be did:key with Ed25519 key" },
      { status: 400 }
    );
  }

  let signature: Buffer;
  try {
    signature = base64urlToBuffer(signatureStr);
  } catch {
    return Response.json(
      { error: "Invalid base64url encoding for signature" },
      { status: 400 }
    );
  }

  if (signature.length !== 64) {
    return Response.json(
      { error: "signature must be a 64-byte Ed25519 signature" },
      { status: 400 }
    );
  }

  // Domain-separated claim challenge message.
  // Must match Sanctuary's sanctuary_sign_challenge tool (purpose="verascore-claim"):
  //   "sanctuary-sign-challenge-v1" || 0x00 || "verascore-claim" || 0x00 || nonce
  const DOMAIN_TAG = "sanctuary-sign-challenge-v1";
  const PURPOSE = "verascore-claim";
  const tagBytes = Buffer.from(DOMAIN_TAG, "utf-8");
  const purposeBytes = Buffer.from(PURPOSE, "utf-8");
  const nonceBytes = Buffer.from(nonce, "utf-8");
  const sep = Buffer.from([0x00]);
  const message = Buffer.concat([
    tagBytes,
    sep,
    purposeBytes,
    sep,
    nonceBytes,
  ]);
  const isValid = verifyEd25519(message, signature, publicKeyRaw);
  if (!isValid) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const { prisma } = await import("@/lib/db");

    const challenge = await prisma.claimChallenge.findUnique({
      where: { nonce },
    });
    if (!challenge) {
      return Response.json({ error: "Challenge not found" }, { status: 400 });
    }
    if (challenge.usedAt) {
      return Response.json(
        { error: "Challenge already used" },
        { status: 400 }
      );
    }
    if (challenge.expiresAt.getTime() < Date.now()) {
      return Response.json({ error: "Challenge expired" }, { status: 400 });
    }
    if (challenge.userId !== user.id) {
      return Response.json(
        { error: "Challenge does not belong to this session" },
        { status: 403 }
      );
    }
    if (challenge.did !== did) {
      return Response.json(
        { error: "DID mismatch with stored challenge" },
        { status: 400 }
      );
    }

    await prisma.claimChallenge.update({
      where: { nonce },
      data: { usedAt: new Date() },
    });

    // Find the Agent by DID. The agent must exist already — claim
    // attaches an existing reputation record to a human owner.
    const agent = await prisma.agent.findFirst({ where: { did } });
    if (!agent) {
      return Response.json(
        { error: "No agent found for this DID" },
        { status: 404 }
      );
    }

    await prisma.agentOwnership.upsert({
      where: {
        userId_agentId: { userId: user.id, agentId: agent.id },
      },
      update: {},
      create: {
        userId: user.id,
        agentId: agent.id,
        method: "HUMAN_INITIATED",
      },
    });

    // Also promote claim status on the agent for visibility.
    await prisma.agent.update({
      where: { id: agent.id },
      data: { claimStatus: "claimed" },
    });

    // DELTA-15: rotate session token on claim completion so a stolen
    // pre-claim token cannot be used to impersonate a claimed agent.
    const oldToken = readSessionToken(request);
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    if (oldToken) {
      try {
        const newToken = randomBytes(32).toString("base64url");
        const newExpiresAt = new Date(Date.now() + SESSION_TTL_MS);
        await prisma.session.updateMany({
          where: { token: oldToken },
          data: { token: newToken, expiresAt: newExpiresAt },
        });
        headers.set("Set-Cookie", buildSessionCookie(newToken, newExpiresAt));
      } catch (err) {
        console.warn("[claim/verify] session rotation failed", err);
      }
    }
    return new Response(
      JSON.stringify({ ok: true, agentId: agent.id }),
      { status: 200, headers }
    );
  } catch (err) {
    console.warn("claim/verify: DB error", err);
    return Response.json(
      { error: "Claim store unavailable" },
      { status: 503 }
    );
  }
}
