import { createPublicKey, verify } from "crypto";
import { getAgent } from "@/lib/data";
import {
  getChallenge,
  deleteChallenge,
  cleanupExpiredChallenges,
} from "@/lib/challenge-store";

// Helper function to verify Ed25519 signature
function verifyEd25519(
  message: Buffer,
  signature: Buffer,
  publicKeyRaw: Buffer
): boolean {
  try {
    // Ed25519 DER prefix for SPKI format
    const derPrefix = Buffer.from("302a300506032b6570032100", "hex");
    const publicKeyDer = Buffer.concat([derPrefix, publicKeyRaw]);

    const publicKey = createPublicKey({
      key: publicKeyDer,
      format: "der",
      type: "spki",
    });

    return verify(null, message, publicKey, signature);
  } catch (error) {
    return false;
  }
}

// Decode base64url to Buffer
function base64urlToBuffer(str: string): Buffer {
  // Convert base64url to base64
  const base64 = str
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  // Add padding if needed
  const padding = (4 - (base64.length % 4)) % 4;
  const paddedBase64 = base64 + "=".repeat(padding);

  return Buffer.from(paddedBase64, "base64");
}

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
    // Update in Prisma database
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
    // Update in JSON fallback (this won't persist across restarts)
    try {
      const agentsModule = await import("@/data/agents.json");
      const agents = agentsModule.default as Array<Record<string, unknown>>;
      const agentIndex = agents.findIndex((a) => a.id === agent.id);
      if (agentIndex !== -1) {
        agents[agentIndex].claimStatus = "claimed";
        // Note: JSON updates are in-memory only in this setup
      }
    } catch (error) {
      console.error("JSON update failed:", error);
      // Continue anyway — the claim is verified, just not persisted
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
