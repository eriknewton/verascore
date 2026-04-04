import { getAgent } from "@/lib/data";
import { verifyEd25519, base64urlToBuffer } from "@/lib/crypto";
import {
  getChallenge,
  deleteChallenge,
  cleanupExpiredChallenges,
} from "@/lib/challenge-store";

export async function POST(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  const { challengeId, signature: signatureStr, publicKey: publicKeyStr } = body;

  if (!challengeId || !signatureStr || !publicKeyStr) {
    return Response.json(
      { error: "Missing required fields: challengeId, signature, publicKey" },
      { status: 400 }
    );
  }

  // Clean up expired challenges
  cleanupExpiredChallenges();

  // Look up challenge in store
  const challenge = getChallenge(challengeId as string);
  if (!challenge) {
    return Response.json(
      { error: "Challenge expired or not found" },
      { status: 400 }
    );
  }

  // Check expiration (5 minutes)
  const now = Date.now();
  if (now - challenge.createdAt > 5 * 60 * 1000) {
    deleteChallenge(challengeId as string);
    return Response.json(
      { error: "Challenge expired or not found" },
      { status: 400 }
    );
  }

  // Look up agent
  const agent = await getAgent(challenge.agentId);
  if (!agent) {
    return Response.json({ error: "Agent not found" }, { status: 404 });
  }

  // Decode signature and public key from base64url
  let signature: Buffer;
  let publicKeyRaw: Buffer;

  try {
    signature = base64urlToBuffer(signatureStr as string);
    publicKeyRaw = base64urlToBuffer(publicKeyStr as string);
  } catch {
    return Response.json(
      { error: "Invalid base64url encoding for signature or publicKey" },
      { status: 400 }
    );
  }

  // Verify Ed25519 signature
  const message = Buffer.from(challenge.nonce, "utf-8");
  const isValid = verifyEd25519(message, signature, publicKeyRaw);

  if (!isValid) {
    return Response.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  // Signature valid — update agent claim status
  const claimedAt = new Date().toISOString();

  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import("@/lib/db");
      await prisma.agent.update({
        where: { id: agent.id },
        data: {
          claimStatus: "claimed",
          did: agent.did || undefined,
        },
      });
    } catch (error) {
      console.error("Database update failed:", error);
      return Response.json(
        { error: "Failed to update claim status" },
        { status: 500 }
      );
    }
  } else {
    try {
      const agentsModule = await import("@/data/agents.json");
      const agents = agentsModule.default as Array<Record<string, unknown>>;
      const agentIndex = agents.findIndex((a) => a.id === agent.id);
      if (agentIndex !== -1) {
        agents[agentIndex].claimStatus = "claimed";
      }
    } catch (error) {
      console.error("JSON update failed:", error);
    }
  }

  // Delete challenge from store
  deleteChallenge(challengeId as string);

  return Response.json({
    success: true,
    agentId: agent.id,
    claimedAt,
  });
}
