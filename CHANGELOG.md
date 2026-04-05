# Changelog

All notable changes to Verascore are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

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
