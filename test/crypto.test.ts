/**
 * Standalone Node.js test for Verascore crypto helpers.
 *
 * Runs via `tsx`:
 *   npx tsx test/crypto.test.ts
 *
 * Covers DELTA-01, DELTA-03 assertions:
 * - Domain-separated message construction (DELTA-01)
 * - Deterministic agentId derivation from public key (DELTA-03)
 * - DID mismatch detection (DELTA-03)
 */

import assert from "node:assert/strict";
import {
  generateKeyPairSync,
  sign as nodeSign,
  createPrivateKey,
  KeyObject,
} from "node:crypto";
import {
  verifyEd25519,
  publicKeyMatchesDid,
  publicKeyFromDid,
  deriveAgentId,
  publicKeyToDidBase64url,
  bufferToBase64url,
} from "../src/lib/crypto.js";

let passed = 0;
let failed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ok  ${name}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL ${name}`);
    console.log(`       ${(err as Error).message}`);
    failed++;
  }
}

function randomEd25519Key(): { priv: KeyObject; pub: Buffer } {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  // Export raw 32-byte public key from JWK
  const jwk = publicKey.export({ format: "jwk" }) as { x: string };
  const pub = Buffer.from(jwk.x, "base64url");
  return { priv: privateKey, pub };
}

function signDomain(priv: KeyObject, purpose: string, nonce: string): Buffer {
  const tag = Buffer.from("sanctuary-sign-challenge-v1", "utf-8");
  const p = Buffer.from(purpose, "utf-8");
  const n = Buffer.from(nonce, "utf-8");
  const sep = Buffer.from([0x00]);
  const msg = Buffer.concat([tag, sep, p, sep, n]);
  return nodeSign(null, msg, priv);
}

function signRaw(priv: KeyObject, nonce: string): Buffer {
  return nodeSign(null, Buffer.from(nonce, "utf-8"), priv);
}

console.log("Verascore crypto tests\n");

console.log("DELTA-01 domain separation:");
test("domain-separated signature verifies", () => {
  const { priv, pub } = randomEd25519Key();
  const nonce = "abc123xyz";
  const sig = signDomain(priv, "verascore-claim", nonce);
  // reconstruct the message the same way /api/claim/verify does
  const tag = Buffer.from("sanctuary-sign-challenge-v1", "utf-8");
  const p = Buffer.from("verascore-claim", "utf-8");
  const n = Buffer.from(nonce, "utf-8");
  const sep = Buffer.from([0x00]);
  const message = Buffer.concat([tag, sep, p, sep, n]);
  assert.equal(verifyEd25519(message, sig, pub), true);
});

test("raw-nonce signature does NOT verify as domain-separated", () => {
  const { priv, pub } = randomEd25519Key();
  const nonce = "abc123xyz";
  const rawSig = signRaw(priv, nonce);
  const tag = Buffer.from("sanctuary-sign-challenge-v1", "utf-8");
  const p = Buffer.from("verascore-claim", "utf-8");
  const n = Buffer.from(nonce, "utf-8");
  const sep = Buffer.from([0x00]);
  const message = Buffer.concat([tag, sep, p, sep, n]);
  assert.equal(verifyEd25519(message, rawSig, pub), false);
});

test("cross-purpose signatures do not verify", () => {
  const { priv, pub } = randomEd25519Key();
  const nonce = "abc";
  const sig = signDomain(priv, "other-service", nonce);
  const tag = Buffer.from("sanctuary-sign-challenge-v1", "utf-8");
  const p = Buffer.from("verascore-claim", "utf-8");
  const n = Buffer.from(nonce, "utf-8");
  const sep = Buffer.from([0x00]);
  const message = Buffer.concat([tag, sep, p, sep, n]);
  assert.equal(verifyEd25519(message, sig, pub), false);
});

console.log("\nDELTA-03 deterministic agent id derivation:");
test("deriveAgentId maps a public key to a did:key deterministically", () => {
  const { pub } = randomEd25519Key();
  const id1 = deriveAgentId(pub);
  const id2 = deriveAgentId(pub);
  assert.equal(id1, id2);
  assert.equal(id1.startsWith("did:key:z"), true);
});

test("different keys produce different agentIds", () => {
  const a = randomEd25519Key();
  const b = randomEd25519Key();
  assert.notEqual(deriveAgentId(a.pub), deriveAgentId(b.pub));
});

test("publicKeyMatchesDid returns true for derived DID", () => {
  const { pub } = randomEd25519Key();
  const did = publicKeyToDidBase64url(pub);
  const pubB64url = bufferToBase64url(pub);
  assert.equal(publicKeyMatchesDid(pubB64url, did), true);
});

test("publicKeyMatchesDid returns false for DID that encodes a different key (squatting rejected)", () => {
  const a = randomEd25519Key();
  const b = randomEd25519Key();
  const didForA = publicKeyToDidBase64url(a.pub);
  const pubBB64url = bufferToBase64url(b.pub);
  assert.equal(publicKeyMatchesDid(pubBB64url, didForA), false);
});

test("publicKeyFromDid round-trips with publicKeyToDidBase64url", () => {
  const { pub } = randomEd25519Key();
  const did = publicKeyToDidBase64url(pub);
  const extracted = publicKeyFromDid(did);
  assert.ok(extracted);
  assert.equal(extracted!.toString("hex"), pub.toString("hex"));
});

console.log("\nDELTA-02 register-challenge HMAC:");
import {
  issueRegisterChallenge,
  verifyRegisterChallenge,
} from "../src/lib/register-challenge.js";

// Ensure a stable secret for this run.
process.env.REGISTER_CHALLENGE_SECRET =
  process.env.REGISTER_CHALLENGE_SECRET ??
  "01234567890123456789012345678901234567890123456789abcdef";

test("issued challenge verifies", () => {
  const c = issueRegisterChallenge("did:key:zABC");
  const r = verifyRegisterChallenge(
    c.did,
    c.nonce,
    c.expiresAt,
    c.signature
  );
  assert.equal(r.ok, true);
});

test("tampered nonce is rejected", () => {
  const c = issueRegisterChallenge("did:key:zABC");
  const r = verifyRegisterChallenge(c.did, c.nonce + "x", c.expiresAt, c.signature);
  assert.equal(r.ok, false);
});

test("mismatched DID is rejected", () => {
  const c = issueRegisterChallenge("did:key:zABC");
  const r = verifyRegisterChallenge(
    "did:key:zXYZ",
    c.nonce,
    c.expiresAt,
    c.signature
  );
  assert.equal(r.ok, false);
});

test("expired challenge is rejected", () => {
  const c = issueRegisterChallenge("did:key:zABC");
  const r = verifyRegisterChallenge(
    c.did,
    c.nonce,
    Date.now() - 1000,
    c.signature
  );
  assert.equal(r.ok, false);
});

test("forged signature is rejected", () => {
  const c = issueRegisterChallenge("did:key:zABC");
  const fake = Buffer.alloc(c.signature.length, "a").toString();
  const r = verifyRegisterChallenge(c.did, c.nonce, c.expiresAt, fake);
  assert.equal(r.ok, false);
});

console.log("\nDELTA-13 email normalization:");
import { canonicalizeEmailForRateLimit } from "../src/lib/email-normalize.js";

test("lowercases and strips +tag", () => {
  const a = canonicalizeEmailForRateLimit("Foo+bar@Example.com");
  const b = canonicalizeEmailForRateLimit("foo@example.com");
  assert.equal(a, b);
});

test("strips dots in gmail localpart only", () => {
  const a = canonicalizeEmailForRateLimit("f.o.o@gmail.com");
  const b = canonicalizeEmailForRateLimit("foo@gmail.com");
  assert.equal(a, b);
  // non-gmail domain: dots are preserved
  const c = canonicalizeEmailForRateLimit("f.o.o@example.com");
  const d = canonicalizeEmailForRateLimit("foo@example.com");
  assert.notEqual(c, d);
});

test("treats googlemail.com as gmail.com-compatible", () => {
  const a = canonicalizeEmailForRateLimit("f.oo+test@googlemail.com");
  const b = canonicalizeEmailForRateLimit("foo@googlemail.com");
  assert.equal(a, b);
});

test("output is a fixed-length base64url hash (no plaintext leak)", () => {
  const out = canonicalizeEmailForRateLimit("foo@example.com");
  assert.match(out, /^[A-Za-z0-9_-]+$/);
  assert.equal(out.includes("@"), false);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
