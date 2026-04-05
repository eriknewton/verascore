/**
 * E2E Test: Magic-Link Signup → Link Agent via Signed Challenge → Fleet Dashboard
 *
 * STATUS: PLACEHOLDER / SKIPPED
 *
 * This test is intentionally left as an explicit setup-required placeholder.
 * Verascore does not currently ship with a test framework, and wiring one up
 * (vitest + next/test or playwright) with a working Prisma test database
 * (SQLite memory or test Postgres) is heavier than the Phase G budget
 * allows. Faking any of this would give false confidence.
 *
 * When a test framework is added, the expected flow is below.
 *
 * REQUIRED SETUP (once):
 *   1. Add devDependencies:  vitest, @vitejs/plugin-react, supertest
 *   2. Create vitest.config.ts with node environment + tsx loader
 *   3. Provide DATABASE_URL pointing at an ephemeral Postgres (or swap to
 *      SQLite by changing the provider in prisma/schema.prisma for tests)
 *   4. Run `prisma db push` against the test DB in a global-setup hook
 *   5. Seed no fixtures (test should own its own state)
 *
 * EXPECTED FLOW (to implement once framework is present):
 *
 *   1. POST /api/auth/request  body: { email: "test@example.com" }
 *      → 200 { ok: true }, console.log captures the verify URL
 *
 *   2. Parse the token from the verify URL (from captured console.log
 *      OR query prisma.magicLinkToken directly by email)
 *
 *   3. GET /api/auth/verify?token=<token>
 *      → 302/200 with Set-Cookie session token; capture cookie
 *
 *   4. POST /api/claim/challenge  body: { did: "did:key:z<testPublicKey>" }
 *        headers: { Cookie: <session cookie> }
 *      → 200 { nonce, challengeId }
 *
 *   5. Sign canonical JSON of { did, nonce, challengeId } with the test
 *      Ed25519 private key (use @noble/curves matching quickstart)
 *
 *   6. POST /api/claim/verify  body: { challengeId, signature, publicKey }
 *        headers: { Cookie: <session cookie> }
 *      → 200 { linked: true, agentId }
 *
 *   7. GET /fleet  headers: { Cookie: <session cookie> }
 *      → 200 HTML containing the linked agent's name/DID
 *
 * ACCEPTANCE CRITERIA:
 *   - Every request should exercise real route-handler code, not mocked.
 *   - Prisma client should be the real client against a disposable DB.
 *   - Ed25519 signing should use the same curves library as production.
 *   - Test should be runnable as `npm test` with no interactive steps.
 */

// Using a minimal describe.skip stub so static analysis picks up the intent
// even without a test runner installed. When vitest is added, remove `.skip`.

const describe = (name: string, fn: () => void): void => {
  // noop — real describe comes from the chosen test framework
  void name;
  void fn;
};
const it = { skip: (name: string, _fn: () => void): void => void name };

describe("E2E: magic-link claim flow → fleet dashboard", () => {
  it.skip("links an agent and surfaces it on /fleet", () => {
    // See file header for expected implementation.
  });
});

export {};
