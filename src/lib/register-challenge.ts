/**
 * Server-signed register-challenge for POST /api/agents.
 *
 * Rather than introducing a new Prisma table for a short-lived stateless
 * challenge, we sign { did, nonce, expiresAt } with HMAC-SHA256 using a
 * server secret. The caller receives {nonce, signature, expiresAt}, signs
 * the nonce with its Ed25519 identity key (domain-separated), and
 * submits it back to /api/agents.
 *
 * The server re-verifies the HMAC (proving the nonce came from us) and
 * then verifies the Ed25519 signature (proving the caller controls the
 * private key behind the DID).
 *
 * Secret: REGISTER_CHALLENGE_SECRET env var. If unset in production, we
 * fail closed. In development we use a locally-random, process-lifetime
 * ephemeral secret (acceptable because dev restarts invalidate old
 * challenges, which is the correct behavior anyway).
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TTL_MS = 5 * 60 * 1000; // 5 minutes

let devEphemeral: string | null = null;

function getSecret(): string {
  const s = process.env.REGISTER_CHALLENGE_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "REGISTER_CHALLENGE_SECRET must be set in production (min 32 chars)"
    );
  }
  if (!devEphemeral) {
    devEphemeral = randomBytes(32).toString("hex");
    console.warn(
      "[register-challenge] using ephemeral dev secret; set " +
        "REGISTER_CHALLENGE_SECRET in production"
    );
  }
  return devEphemeral;
}

function hmac(did: string, nonce: string, expiresAt: number): string {
  const data = `${did}\x00${nonce}\x00${expiresAt}`;
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export interface SignedChallenge {
  did: string;
  nonce: string;
  expiresAt: number;
  signature: string;
}

export function issueRegisterChallenge(did: string): SignedChallenge {
  const nonce = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + TTL_MS;
  const signature = hmac(did, nonce, expiresAt);
  return { did, nonce, expiresAt, signature };
}

/**
 * Verify a register-challenge signature without hitting a DB.
 *
 * Returns ok=false with an error code string on any failure.
 */
export function verifyRegisterChallenge(
  did: string,
  nonce: string,
  expiresAt: number,
  signature: string
): { ok: true } | { ok: false; error: string } {
  if (!did || !nonce || !signature || !expiresAt) {
    return { ok: false, error: "missing-fields" };
  }
  if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt)) {
    return { ok: false, error: "bad-expiry" };
  }
  if (Date.now() > expiresAt) {
    return { ok: false, error: "expired" };
  }
  const expected = hmac(did, nonce, expiresAt);
  const a = Buffer.from(expected, "utf-8");
  const b = Buffer.from(signature, "utf-8");
  if (a.length !== b.length) return { ok: false, error: "bad-signature" };
  if (!timingSafeEqual(a, b)) return { ok: false, error: "bad-signature" };
  return { ok: true };
}
