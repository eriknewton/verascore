import { randomBytes } from "crypto";
import { getAgent } from "@/lib/data";
import {
  cleanupExpiredChallenges,
  storeChallenge,
} from "@/lib/challenge-store";

// Constants
const CHALLENGE_ID_SIZE = 32; // bytes
const NONCE_SIZE = 32; // bytes

function generateRandomHex(bytes: number): string {
  return randomBytes(bytes).toString("hex");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");

  if (!agentId) {
    return Response.json(
      { error: "Missing required query param: agentId" },
      { status: 400 }
    );
  }

  // Look up agent
  const agent = await getAgent(agentId);
  if (!agent) {
    return Response.json({ error: "Agent not found" }, { status: 404 });
  }

  // Check if already claimed
  if (agent.claimStatus === "claimed") {
    return Response.json(
      { error: "Agent already claimed" },
      { status: 409 }
    );
  }

  // Clean up expired challenges
  cleanupExpiredChallenges();

  // Generate new challenge
  const challengeId = generateRandomHex(CHALLENGE_ID_SIZE);
  const nonce = generateRandomHex(NONCE_SIZE);

  storeChallenge(challengeId, nonce, agentId);

  return Response.json({
    challengeId,
    nonce,
    agentId,
    expiresIn: 300, // 5 minutes in seconds
  });
}
