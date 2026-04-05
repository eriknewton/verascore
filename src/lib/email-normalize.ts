/**
 * DELTA-13: Normalize an email for rate-limit keying only.
 *
 *   lowercase → strip +tag from localpart → (for gmail.com-style) strip
 *   dots in localpart → SHA-256 hash (so raw emails never hit rate-limit
 *   storage).
 *
 * This is ONLY used to derive the rate-limit key. The email stored in
 * MagicLinkToken remains the user's original input (lowercased) because
 * we have to send mail to it.
 */

import { createHash } from "node:crypto";

const DOT_SENSITIVE_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
]);

export function canonicalizeEmailForRateLimit(email: string): string {
  const lowered = email.trim().toLowerCase();
  const at = lowered.lastIndexOf("@");
  if (at <= 0) return hashEmail(lowered);
  let local = lowered.slice(0, at);
  const domain = lowered.slice(at + 1);
  // Strip +tag
  const plus = local.indexOf("+");
  if (plus >= 0) local = local.slice(0, plus);
  // Strip dots on dot-insensitive domains
  if (DOT_SENSITIVE_DOMAINS.has(domain)) {
    local = local.replace(/\./g, "");
  }
  return hashEmail(`${local}@${domain}`);
}

function hashEmail(s: string): string {
  return createHash("sha256").update(s, "utf-8").digest("base64url");
}
