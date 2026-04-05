import { NextRequest } from "next/server";
import { getAgents } from "@/lib/data";

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
 * POST /api/agents — Create a stub agent record.
 *
 * Used by humans / agents registering a new agent identity before
 * any reputation data has been published. The stub starts at
 * trustTier=unverified, status=self-attested (claimStatus=unclaimed).
 */
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

  const { did, name, description, website } = body as {
    did?: string;
    name?: string;
    description?: string;
    website?: string;
  };

  if (!did || typeof did !== "string" || !DID_REGEX.test(did)) {
    return Response.json(
      { error: "Invalid or missing DID. Expected format: did:method:identifier" },
      { status: 400 }
    );
  }

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return Response.json(
      { error: "Missing required field: name" },
      { status: 400 }
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
