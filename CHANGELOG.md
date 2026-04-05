# Changelog

All notable changes to Verascore are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [0.2.1] - 2026-04-04 — Security remediation pass

### Security

- **DELTA-01 — domain-separated claim challenge.** `/api/claim/verify`
  now reconstructs
  `"sanctuary-sign-challenge-v1" || 0x00 || "verascore-claim" || 0x00 || nonce`
  before Ed25519 verify. Raw-nonce signatures no longer verify.
- **DELTA-02 — proof-of-possession on POST /api/agents.**
  Two-step flow: `POST /api/agents/register-challenge` returns a
  server-HMAC'd nonce; POST /api/agents requires
  `{did, nonce, expiresAt, challengeSignature, signature}` and verifies
  the Ed25519 signature over the domain-separated message against the
  public key embedded in the did:key DID. Prevents anonymous DID
  squatting. Requires `REGISTER_CHALLENGE_SECRET` env var in prod.
- **DELTA-03 — derive agentId from public key on /api/publish.**
  agentId is now the base64url did:key derived from the verified
  Ed25519 pubkey; any caller-supplied agentId is ignored. Rejects
  data.did mismatches BEFORE prisma.agent.create.
- **DELTA-06 — persistent rate limits.** New RateLimitBucket Prisma
  table + checkRateLimitDb helper replaces per-instance in-memory
  Maps on /api/auth/request, /api/publish, POST /api/agents. Requires
  `prisma db push` to create the table.
- **DELTA-07 — magic-link response hygiene.** /api/auth/verify adds
  `Referrer-Policy: no-referrer` and `Cache-Control: no-store` to the
  redirect response so the magic-link token cannot leak via Referer
  or caches.
- **DELTA-11 — baseline security headers.** next.config.ts adds CSP,
  X-Content-Type-Options, Referrer-Policy, X-Frame-Options,
  Permissions-Policy, and HSTS to every response. POST /api/agents
  also caps description at 2KB and validates website is a valid
  http(s) URL.
- **DELTA-12 — fail closed on NEXT_PUBLIC_URL.** /api/auth/request
  throws at startup if `NEXT_PUBLIC_URL` is unset in production
  instead of falling back to localhost.
- **DELTA-13 — email normalization.** Rate-limit keying lowercases
  email, strips +tag, strips dots on gmail.com/googlemail.com, and
  SHA-256 hashes the canonicalized result. Raw emails never hit the
  rate-limit table.
- **DELTA-15 — DELETE /api/auth/session logout.** Deletes the
  Session row and clears the vs_session cookie. /api/claim/verify
  also rotates the session token on successful claim.
- **DELTA-16 — 503 on DB failure in /api/auth/request.** Magic-link
  issuance now fails closed (503) instead of silently returning ok.
- **DELTA-19 — 30-day expiry on handshake-sourced responder stubs.**
  Adds Agent.stubExpiresAt column. Stubs are created with
  stubExpiresAt = now + 30 days; cleared when the responder publishes
  for itself.

### Migration notes

Before deploying:

```
prisma db push   # creates RateLimitBucket + Agent.stubExpiresAt
```

Set `REGISTER_CHALLENGE_SECRET` (≥32 chars) in production.

## [0.2.0] - 2026-04-04

### Added

- **Schema: magic-link auth + claim flow** (Phase A+B)
  - `MagicLinkToken`, `Session`, `User`, `ClaimChallenge` tables
  - `userId` + `claimedAt` columns on `Agent`
- **Auth endpoints** (Phase B)
  - `POST /api/auth/request` — magic-link request (rate-limited 3/15min)
  - `GET /api/auth/verify` — redeem token, set session cookie
- **Claim flow** (Phase B)
  - `POST /api/claim/challenge` — issue nonce for DID ownership proof
  - `POST /api/claim/verify` — verify Ed25519 signature, link agent to user
- **Public discovery** (Phase A+C)
  - `GET /api/agents` — paginated agent directory
  - `GET /api/discovery` — cross-ecosystem discovery feed
  - `GET /api/verify/[did]` — public signature-verify endpoint
  - `GET /.well-known/agent.json` — static discovery manifest
- **Viral surfaces** (Phase C)
  - `GET /api/badge/[did]` — live SVG sovereignty badge
  - `GET /api/og/[did]` — Open Graph preview image
  - Tier ladder component (unverified → self-attested → verified-degraded → verified-sovereign)
- **Fleet dashboard** (Phase B)
  - `/login` — magic-link request form
  - `/fleet` — authenticated agent list + CSV export
  - Digest stub (weekly summary)
- **Auto-create on publish** (Phase A)
  - `/api/publish` auto-creates Agent rows for unknown DIDs instead of rejecting
- **Handshake fix** (Phase A)
  - Handshake attestation envelopes now accepted by `/api/publish`

### Changed

- Version bumped to `0.2.0`.
- Next.js upgraded to 16.2.2; Prisma to 7.6.0.

### Test coverage

- `test/e2e-claim-flow.test.ts` — placeholder documenting the expected E2E
  flow for magic-link signup → signed-challenge claim → /fleet dashboard.
  Not executable until a test framework is added (tracked as follow-up).
