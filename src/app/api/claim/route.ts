import { getAgent } from "@/lib/data";

export async function POST(request: Request) {
  const body = await request.json();
  const { agentId, signature, publicKey } = body;

  if (!agentId || !signature || !publicKey) {
    return Response.json(
      {
        error: "Missing required fields: agentId, signature, publicKey",
      },
      { status: 400 }
    );
  }

  const agent = getAgent(agentId);
  if (!agent) {
    return Response.json({ error: "Agent not found" }, { status: 404 });
  }

  if (agent.claimStatus === "claimed") {
    return Response.json(
      { error: "Agent already claimed" },
      { status: 409 }
    );
  }

  // In production, this would:
  // 1. Generate a challenge nonce
  // 2. Verify the Ed25519 signature against the challenge
  // 3. Update the agent record in the database
  // 4. Return a claim confirmation

  return Response.json({
    success: true,
    message:
      "Claim verification is not yet implemented. In production, this endpoint verifies Ed25519 challenge-response signatures.",
    agentId,
    status: "pending",
  });
}
