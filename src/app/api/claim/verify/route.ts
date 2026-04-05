import {
  verifyEd25519,
  base64urlToBuffer,
  publicKeyFromDid,
} from "@/lib/crypto";
import { getSessionUser } from "@/lib/auth";

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

  const message = Buffer.from(nonce, "utf-8");
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

    return Response.json({ ok: true, agentId: agent.id });
  } catch (err) {
    console.warn("claim/verify: DB error", err);
    return Response.json(
      { error: "Claim store unavailable" },
      { status: 503 }
    );
  }
}
