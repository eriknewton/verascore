/**
 * GET /agent/[id]/.well-known/agent.json
 *
 * Serves the agent's well-known metadata document. Used for capability
 * advertisement and discovery by Concordia/Sanctuary-aware peers.
 */

import { getAgent } from "@/lib/data";

interface WellKnownAgent {
  did: string;
  name: string;
  sanctuary_version?: string;
  concordia_version?: string;
  sovereignty_layers?: Array<{ name: string; label: string; status: string; score: number }>;
  endpoints?: Record<string, string>;
  want?: string[];
  have?: string[];
  capabilities?: string[];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = await getAgent(id);

  if (!agent) {
    return Response.json({ error: "Agent not found" }, { status: 404 });
  }

  // Pull extended fields from the underlying record when database is live.
  // These are additive columns; when missing, we omit them.
  let sanctuaryVersion: string | undefined;
  let concordiaVersion: string | undefined;
  let endpoints: Record<string, string> | undefined;
  let want: string[] | undefined;
  let have: string[] | undefined;

  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import("@/lib/db");
      const raw = await prisma.agent.findUnique({ where: { id } });
      if (raw) {
        const r = raw as Record<string, unknown>;
        sanctuaryVersion = (r.sanctuaryVersion as string | null) ?? undefined;
        concordiaVersion = (r.concordiaVersion as string | null) ?? undefined;
        endpoints = (r.endpoints as Record<string, string> | null) ?? undefined;
        want = (r.want as string[] | undefined) ?? undefined;
        have = (r.have as string[] | undefined) ?? undefined;
      }
    } catch {
      // Columns may not exist yet on production DB — degrade gracefully.
    }
  }

  const body: WellKnownAgent = {
    did: agent.did,
    name: agent.name,
    ...(sanctuaryVersion ? { sanctuary_version: sanctuaryVersion } : {}),
    ...(concordiaVersion ? { concordia_version: concordiaVersion } : {}),
    sovereignty_layers: agent.sovereigntyLayers.map((l) => ({
      name: l.name,
      label: l.label,
      status: l.status,
      score: l.score,
    })),
    ...(endpoints ? { endpoints } : {}),
    ...(want && want.length ? { want } : {}),
    ...(have && have.length ? { have } : {}),
    capabilities: agent.capabilities,
  };

  return Response.json(body, {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=60",
    },
  });
}
