import { NextRequest } from "next/server";
import { getAgents } from "@/lib/data";
import {
  verifyEd25519,
  base64urlToBuffer,
  publicKeyFromDid,
} from "@/lib/crypto";
import { verifyRegisterChallenge } from "@/lib/register-challenge";

// ─── Rate limiter for POST /api/agents ────────────────────────────
// Simple in-memory per-IP limiter: 5 stub agents per IP per hour.
const DID_REGEX = /^did:[a-z]+:[A-Za-z0-9._-]+$/;
const POST_RATE_MAX = 5;
const POST_RATE_WINDOW_MS = 60 * 60 * 1000;
const postRateStore = new Map<string, number[]>();

function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

function checkPostRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = postRateStore.get(ip) ?? [];
  const fresh = timestamps.filter((t) => now - t < POST_RATE_WINDOW_MS);
  if (fresh.length >= POST_RATE_MAX) {
    postRateStore.set(ip, fresh);
    return false;
  }
  fresh.push(now);
  postRateStore.set(ip, fresh);
  return true;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const result = await getAgents({
    page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
    pageSize: searchParams.get("pageSize")
      ? parseInt(searchParams.get("pageSize")!)
      : 20,
    search: searchParams.get("q") || undefined,
    trustTier: searchParams.get("tier") || undefined,
    minScore: searchParams.get("minScore")
      ? parseInt(searchParams.get("minScore")!)
      : undefined,
    maxScore: searchParams.get("maxScore")
      ? parseInt(searchParams.get("maxScore")!)
      : undefined,
    sortBy:
      (searchParams.get("sort") as "score" | "recent" | "sovereignty") ||
      "score",
  });

  return Response.json(result);
}

/**
 * POST /api/agents — Create a stub agent record (proof-of-possession required).
 *
 * DELTA-02: Two-step flow.
 *   1) POST /api/agents/register-challenge → returns server-HMAC'd nonce
 *   2) Client signs nonce with sanctuary_sign_challenge(purpose="verascore-register")
 *   3) POST /api/agents with { did, nonce, expiresAt, challengeSignature,
 *      signature, name, ... }
 *
 * The server verifies the HMAC (nonce came from us), then verifies the
 * Ed25519 signature over the domain-separated message using the public
 * key embedded in the did:key DID. Only on success is the Agent row
 * created — preventing anonymous DID squatting.
 */

const DELTA_NAME_MAX = 200;
const DELTA_DESC_MAX = 2048;
const DELTA_WEBSITE_MAX = 2048;
const HTTPS_URL_REGEX = /^https?:\/\/[A-Za-z0-9._\-/:?&=%#~+,;@!$'()*]+$/;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkPostRateLimit(ip)) {
    return Response.json(
      { error: "Rate limit exceeded. Max 5 stub agents per IP per hour." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    did,
    name,
    description,
    website,
    nonce,
    expiresAt,
    challengeSignature,
    signature,
  } = body as {
    did?: string;
    name?: string;
    description?: string;
    website?: string;
    nonce?: string;
    expiresAt?: number;
    challengeSignature?: string;
    signature?: string;
  };

  if (!did || typeof did !== "string" || !DID_REGEX.test(did)) {
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

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return Response.json(
      { error: "Missing required field: name" },
      { status: 400 }
    );
  }
  if (name.length > DELTA_NAME_MAX) {
    return Response.json({ error: "name too long" }, { status: 400 });
  }

  // DELTA-11: input caps + website shape validation
  if (description !== undefined) {
    if (typeof description !== "string") {
      return Response.json({ error: "description must be a string" }, { status: 400 });
    }
    if (description.length > DELTA_DESC_MAX) {
      return Response.json(
        { error: `description exceeds ${DELTA_DESC_MAX} characters` },
        { status: 400 }
      );
    }
  }
  if (website !== undefined) {
    if (typeof website !== "string") {
      return Response.json({ error: "website must be a string" }, { status: 400 });
    }
    if (website.length > DELTA_WEBSITE_MAX) {
      return Response.json({ error: "website too long" }, { status: 400 });
    }
    if (!HTTPS_URL_REGEX.test(website)) {
      return Response.json(
        { error: "website must be a valid http(s) URL" },
        { status: 400 }
      );
    }
  }

  // DELTA-02: server-signed register-challenge must verify.
  if (
    typeof nonce !== "string" ||
    typeof challengeSignature !== "string" ||
    typeof signature !== "string" ||
    typeof expiresAt !== "number"
  ) {
    return Response.json(
      {
        error:
          "Proof-of-possession required. Call /api/agents/register-challenge first, " +
          "then POST { did, nonce, expiresAt, challengeSignature, signature, name, ... }.",
      },
      { status: 400 }
    );
  }

  const challengeCheck = verifyRegisterChallenge(
    did,
    nonce,
    expiresAt,
    challengeSignature
  );
  if (!challengeCheck.ok) {
    return Response.json(
      { error: `Invalid register-challenge: ${challengeCheck.error}` },
      { status: 400 }
    );
  }

  // DELTA-02: verify Ed25519 signature over the domain-separated message.
  const publicKeyRaw = publicKeyFromDid(did);
  if (!publicKeyRaw) {
    return Response.json(
      { error: "Unsupported DID — must be did:key with Ed25519 key" },
      { status: 400 }
    );
  }

  let sigBytes: Buffer;
  try {
    sigBytes = base64urlToBuffer(signature);
  } catch {
    return Response.json(
      { error: "Invalid base64url signature" },
      { status: 400 }
    );
  }
  if (sigBytes.length !== 64) {
    return Response.json(
      { error: "signature must be a 64-byte Ed25519 signature" },
      { status: 400 }
    );
  }

  const DOMAIN_TAG = "sanctuary-sign-challenge-v1";
  const PURPOSE = "verascore-register";
  const message = Buffer.concat([
    Buffer.from(DOMAIN_TAG, "utf-8"),
    Buffer.from([0x00]),
    Buffer.from(PURPOSE, "utf-8"),
    Buffer.from([0x00]),
    Buffer.from(nonce, "utf-8"),
  ]);
  const sigValid = verifyEd25519(message, sigBytes, publicKeyRaw);
  if (!sigValid) {
    return Response.json(
      { error: "Invalid Ed25519 signature over register-challenge nonce" },
      { status: 401 }
    );
  }

  if (!process.env.DATABASE_URL) {
    return Response.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const { prisma } = await import("@/lib/db");

  // Use the DID as the agent id (stable, unique).
  const id = did;

  const existing = await prisma.agent.findUnique({ where: { id } });
  if (existing) {
    return Response.json(
      { error: "Agent with this DID already exists", id },
      { status: 409 }
    );
  }

  const combinedDescription = website
    ? `${description ?? ""}${description ? "\n\n" : ""}Website: ${website}`.trim()
    : description ?? "";

  await prisma.agent.create({
    data: {
      id,
      name: name.trim(),
      did,
      keyType: "ed25519",
      platform: "unknown",
      description: combinedDescription,
      claimStatus: "unclaimed",
      trustTier: "unverified",
      capabilities: [],
    },
  });

  return Response.json(
    {
      id,
      did,
      profileUrl: `/agent/${encodeURIComponent(id)}`,
    },
    { status: 201 }
  );
}
