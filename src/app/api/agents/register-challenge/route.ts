/**
 * POST /api/agents/register-challenge
 *
 * Issue a server-signed nonce bound to a DID. The caller will then
 * sign the nonce with its Ed25519 identity key and POST the result
 * to /api/agents to register a stub agent record.
 *
 * This is the proof-of-possession front-door for DELTA-02: agent
 * creation now requires demonstration of control over the DID's
 * private key.
 */

import { issueRegisterChallenge } from "@/lib/register-challenge";

const DID_REGEX = /^did:[a-z]+:[A-Za-z0-9._-]+$/;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const did = typeof body.did === "string" ? body.did.trim() : "";
  if (!did || !DID_REGEX.test(did)) {
    return Response.json(
      { error: "Invalid or missing DID. Expected format: did:method:identifier" },
      { status: 400 }
    );
  }
  if (!did.startsWith("did:key:")) {
    return Response.json(
      { error: "Only did:key DIDs are supported for registration" },
      { status: 400 }
    );
  }

  const challenge = issueRegisterChallenge(did);
  return Response.json({
    did: challenge.did,
    nonce: challenge.nonce,
    expiresAt: challenge.expiresAt,
    signature: challenge.signature,
    purpose: "verascore-register",
    instructions:
      "Sign the nonce using sanctuary_sign_challenge with purpose='verascore-register', " +
      "then POST { did, nonce, expiresAt, challengeSignature: <server-sig>, signature: <agent-sig> } " +
      "to /api/agents.",
  });
}
