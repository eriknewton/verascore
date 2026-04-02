import type { AgentProfile, Attestation, PaginatedResponse } from "./types";
import agentsData from "@/data/agents.json";
import attestationsData from "@/data/attestations.json";

// Cast JSON data to typed arrays
const agents: AgentProfile[] = agentsData as unknown as AgentProfile[];
const attestations: Attestation[] = attestationsData as unknown as Attestation[];

export function getAgents(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  trustTier?: string;
  minScore?: number;
  maxScore?: number;
  sortBy?: "score" | "recent" | "sovereignty";
}): PaginatedResponse<AgentProfile> {
  const {
    page = 1,
    pageSize = 20,
    search,
    trustTier,
    minScore,
    maxScore,
    sortBy = "score",
  } = options || {};

  let filtered = [...agents];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.capabilities.some((c) => c.toLowerCase().includes(q))
    );
  }

  if (trustTier) {
    filtered = filtered.filter((a) => a.trustTier === trustTier);
  }

  if (minScore !== undefined) {
    filtered = filtered.filter((a) => a.overallScore >= minScore);
  }

  if (maxScore !== undefined) {
    filtered = filtered.filter((a) => a.overallScore <= maxScore);
  }

  switch (sortBy) {
    case "score":
      filtered.sort((a, b) => b.overallScore - a.overallScore);
      break;
    case "recent":
      filtered.sort(
        (a, b) =>
          new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
      );
      break;
    case "sovereignty":
      filtered.sort((a, b) => {
        const aAvg =
          a.sovereigntyLayers.reduce((s, l) => s + l.score, 0) / 4;
        const bAvg =
          b.sovereigntyLayers.reduce((s, l) => s + l.score, 0) / 4;
        return bAvg - aAvg;
      });
      break;
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);

  return { data, total, page, pageSize, totalPages };
}

export function getAgent(id: string): AgentProfile | undefined {
  return agents.find((a) => a.id === id);
}

export function getAttestation(id: string): Attestation | undefined {
  return attestations.find((a) => a.id === id);
}

export function getStats() {
  return {
    totalAgents: agents.length,
    claimedAgents: agents.filter((a) => a.claimStatus === "claimed").length,
    totalHandshakes: attestations.length,
    verifiedHandshakes: attestations.filter((a) => a.verified).length,
    averageScore: Math.round(
      agents.reduce((s, a) => s + a.overallScore, 0) / agents.length
    ),
    sovereignAgents: agents.filter((a) => a.trustTier === "verified-sovereign")
      .length,
  };
}
