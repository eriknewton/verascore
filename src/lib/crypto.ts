/**
 * Shared Ed25519 cryptographic utilities for Verascore.
 *
 * Used by both /api/claim/verify and /api/publish to verify
 * agent signatures over challenges and data payloads.
 */

import { createPublicKey, verify } from "crypto";

/**
 * Verify an Ed25519 signature over a message.
 *
 * @param message   - The original message bytes
 * @param signature - The raw Ed25519 signature (64 bytes)
 * @param publicKeyRaw - The raw Ed25519 public key (32 bytes)
 * @returns true if the signature is valid
 */
export function verifyEd25519(
  message: Buffer,
  signature: Buffer,
  publicKeyRaw: Buffer
): boolean {
  try {
    // Ed25519 SPKI DER prefix (constant for 32-byte Ed25519 keys)
    const derPrefix = Buffer.from("302a300506032b6570032100", "hex");
    const publicKeyDer = Buffer.concat([derPrefix, publicKeyRaw]);

    const publicKey = createPublicKey({
      key: publicKeyDer,
      format: "der",
      type: "spki",
    });

    return verify(null, message, publicKey, signature);
  } catch {
    return false;
  }
}

/**
 * Decode a base64url string to a Buffer.
 * Handles missing padding automatically.
 */
export function base64urlToBuffer(str: string): Buffer {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (base64.length % 4)) % 4;
  const paddedBase64 = base64 + "=".repeat(padding);
  return Buffer.from(paddedBase64, "base64");
}

/**
 * Extract the raw public key bytes from a did:key identifier.
 *
 * did:key encodes the public key as a multibase-multicodec value.
 * For Ed25519 keys, the format is:
 *   did:key:z<base58btc(0xed01 + 32-byte-pubkey)>
 *
 * Returns the 32-byte raw public key, or null if the DID
 * doesn't match the expected format.
 */
export function publicKeyFromDid(did: string): Buffer | null {
  if (!did.startsWith("did:key:z")) return null;

  try {
    const encoded = did.slice("did:key:z".length);

    // Detect encoding: base58btc has no hyphens or underscores.
    // Some implementations (e.g. Sanctuary) use base64url after the "z" prefix.
    const isBase64url = encoded.includes("-") || encoded.includes("_");
    const decoded = isBase64url
      ? base64urlToBuffer(encoded)
      : Buffer.from(base58btcDecode(encoded));

    // Ed25519 multicodec prefix is 0xed 0x01
    if (decoded.length < 34 || decoded[0] !== 0xed || decoded[1] !== 0x01) {
      return null;
    }

    return Buffer.from(decoded.slice(2));
  } catch {
    return null;
  }
}

/**
 * Check whether a base64url-encoded public key matches a did:key.
 * Returns true if the DID encodes the same raw key bytes.
 */
export function publicKeyMatchesDid(
  publicKeyB64url: string,
  did: string
): boolean {
  if (!did || !did.startsWith("did:key:")) return false;

  const submittedKey = base64urlToBuffer(publicKeyB64url);
  const didKey = publicKeyFromDid(did);

  if (!didKey || submittedKey.length !== didKey.length) return false;

  return submittedKey.equals(didKey);
}

/**
 * Encode raw bytes to URL-safe base64 (no padding).
 */
export function bufferToBase64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Derive a did:key identifier from a raw Ed25519 public key (32 bytes)
 * using the base64url encoding that Sanctuary uses. The result is
 * deterministic: a given public key always maps to exactly one DID.
 *
 * Returns `did:key:z<base64url(0xed 0x01 || pubkey)>`.
 */
export function publicKeyToDidBase64url(publicKeyRaw: Buffer): string {
  if (publicKeyRaw.length !== 32) {
    throw new Error("Ed25519 public key must be 32 bytes");
  }
  const multicodec = Buffer.concat([Buffer.from([0xed, 0x01]), publicKeyRaw]);
  return `did:key:z${bufferToBase64url(multicodec)}`;
}

/**
 * Derive a deterministic agent ID from a raw Ed25519 public key. Uses
 * the base64url-encoded did:key string; this is stable, unique, and
 * cannot be squatted by an attacker who does not control the key.
 */
export function deriveAgentId(publicKeyRaw: Buffer): string {
  return publicKeyToDidBase64url(publicKeyRaw);
}

// ─── Base58btc ──────────────────────────────────────────────────
// Minimal base58btc decoder (Bitcoin alphabet). No external deps.

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58btcDecode(input: string): Uint8Array {
  const bytes: number[] = [0];

  for (const char of input) {
    const value = BASE58_ALPHABET.indexOf(char);
    if (value < 0) throw new Error(`Invalid base58 character: ${char}`);

    let carry = value;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  // Preserve leading zeros
  for (const char of input) {
    if (char !== "1") break;
    bytes.push(0);
  }

  return new Uint8Array(bytes.reverse());
}
