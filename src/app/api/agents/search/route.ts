/**
 * GET /api/agents/search?want=X&have=Y
 *
 * Capability-match search. Agents with a matching `want` or `have` tag
 * are returned. Falls back to matching against `capabilities` when
 * want/have columns are not present.
 */

import { NextRequest } from "next/server";
import { getAgents } from "@/lib/data";
import type { AgentProfile } from "@/lib/types";

function normalize(tag: string): string {
  return tag.trim().toLowerCase();
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const wantParam = searchParams.get("want")?.trim();
  const haveParam = searchParams.get("have")?.trim();

  const want = wantParam ? normalize(wantParam) : undefined;
  const have = haveParam ? normalize(haveParam) : undefined;

  if (!want && !have) {
    return Response.json(
      { error: "At least one of ?want= or ?have= is required" },
      { status: 400 }
    );
  }

  // Prefer DB-native search when available.
  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import("@/lib/db");
      const where: Record<string, unknown> = {};
      const or: Record<string, unknown>[] = [];
      if (want) {
        or.push({ want: { has: want } });
        or.push({ capabilities: { has: want } });
      }
      if (have) {
        or.push({ have: { has: have } });
        or.push({ capabilities: { has: have } });
      }
      if (or.length) where.OR = or;

      const rows = await prisma.agent.findMany({
        where,
        orderBy: { overallScore: "desc" },
        take: 50,
        include: {
          sovereigntyLayers: true,
          reputationDimensions: true,
          badges: true,
        },
      });

      const agents = rows.map((r) => {
        const a = r as unknown as Record<string, unknown>;
        return {
          id: a.id as string,
          name: a.name as string,
          did: a.did as string,
          platform: a.platform as string,
          description: a.description as string,
          overallScore: a.overallScore as number,
          trustTier: a.trustTier as string,
          capabilities: a.capabilities as string[],
          want: (a.want as string[] | undefined) ?? [],
          have: (a.have as string[] | undefined) ?? [],
        };
      });

      return Response.json(
        { agents },
        { headers: { "cache-control": "public, max-age=30" } }
      );
    } catch {
      // Columns may not yet exist — fall through to in-memory match.
    }
  }

  // JSON / fallback path: match against capabilities.
  const result = await getAgents({ page: 1, pageSize: 500, sortBy: "score" });
  const matches: AgentProfile[] = result.data.filter((a) => {
    const caps = a.capabilities.map(normalize);
    const wantOk = want ? caps.includes(want) : true;
    const haveOk = have ? caps.includes(have) : true;
    return (want ? wantOk : false) || (have ? haveOk : false) || (want && have && wantOk && haveOk);
  });

  return Response.json(
    { agents: matches.slice(0, 50) },
    { headers: { "cache-control": "public, max-age=30" } }
  );
}
