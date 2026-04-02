import type {
  AgentProfile,
  Attestation,
  PaginatedResponse,
  SovereigntyLayer,
  ReputationDimension,
  HandshakeRecord,
  Badge,
} from "./types";

// ─── Conditional Backend ─────────────────────────────────────────
// Uses Prisma when DATABASE_URL is set, otherwise falls back to JSON.

const useDatabase = !!process.env.DATABASE_URL;

// ─── JSON Fallback ───────────────────────────────────────────────

let jsonAgents: AgentProfile[] | null = null;
let jsonAttestations: Attestation[] | null = null;

async function loadJson() {
  if (!jsonAgents) {
    const agentsData = (await import("@/data/agents.json")).default;
    const attestationsData = (await import("@/data/attestations.json")).default;
    jsonAgents = agentsData as unknown as AgentProfile[];
    jsonAttestations = attestationsData as unknown as Attestation[];
  }
  return { agents: jsonAgents!, attestations: jsonAttestations! };
}

// ─── Prisma Helpers ──────────────────────────────────────────────

async function getPrisma() {
  const { prisma } = await import("./db");
  return prisma;
}

function dbAgentToProfile(agent: Record<string, unknown>): AgentProfile {
  const a = agent as Record<string, unknown>;
  const attestationsAsInitiator = (a.initiatedAttestations ?? []) as Record<string, unknown>[];
  const attestationsAsResponder = (a.receivedAttestations ?? []) as Record<string, unknown>[];

  const handshakes: HandshakeRecord[] = [
    ...attestationsAsInitiator.map((att) => ({
      id: `hs-${att.id}`,
      counterpartyId: att.responderId as string,
      counterpartyName: ((att.responder as Record<string, unknown>)?.name as string) ?? att.responderId as string,
      timestamp: (att.timestamp as Date).toISOString(),
      expiresAt: (att.expiresAt as Date).toISOString(),
      trustTier: dbTrustTierToType(att.trustTier as string),
      verified: att.verified as boolean,
      attestationId: att.id as string,
    })),
    ...attestationsAsResponder.map((att) => ({
      id: `hs-${att.id}`,
      counterpartyId: att.initiatorId as string,
      counterpartyName: ((att.initiator as Record<string, unknown>)?.name as string) ?? att.initiatorId as string,
      timestamp: (att.timestamp as Date).toISOString(),
      expiresAt: (att.expiresAt as Date).toISOString(),
      trustTier: dbTrustTierToType(att.trustTier as string),
      verified: att.verified as boolean,
      attestationId: att.id as string,
    })),
  ];

  return {
    id: a.id as string,
    name: a.name as string,
    did: a.did as string,
    keyType: a.keyType as string,
    platform: a.platform as string,
    description: a.description as string,
    claimStatus: a.claimStatus as AgentProfile["claimStatus"],
    createdAt: (a.createdAt as Date).toISOString(),
    lastActive: (a.lastActive as Date).toISOString(),
    overallScore: a.overallScore as number,
    trustTier: dbTrustTierToType(a.trustTier as string),
    sovereigntyLayers: ((a.sovereigntyLayers ?? []) as Record<string, unknown>[]).map((l) => ({
      name: l.name as string,
      label: l.label as string,
      score: l.score as number,
      status: l.status as SovereigntyLayer["status"],
      description: l.description as string,
    })),
    reputationDimensions: ((a.reputationDimensions ?? []) as Record<string, unknown>[]).map((d) => ({
      name: d.name as string,
      score: d.score as number,
      maxScore: d.maxScore as number,
      source: dbSourceToType(d.source as string),
      description: d.description as string,
    })),
    handshakes,
    badges: ((a.badges ?? []) as Record<string, unknown>[]).map((b) => ({
      id: b.id as string,
      name: b.name as string,
      description: b.description as string,
      icon: b.icon as string,
      earnedAt: (b.earnedAt as Date).toISOString(),
    })),
    capabilities: a.capabilities as string[],
    avatarUrl: a.avatarUrl as string | undefined,
  };
}

function dbTrustTierToType(tier: string): AgentProfile["trustTier"] {
  const map: Record<string, AgentProfile["trustTier"]> = {
    verified_sovereign: "verified-sovereign",
    verified_degraded: "verified-degraded",
    self_attested: "self-attested",
    unverified: "unverified",
  };
  return map[tier] ?? "unverified";
}

function typeTrustTierToDb(tier: string): string {
  const map: Record<string, string> = {
    "verified-sovereign": "verified_sovereign",
    "verified-degraded": "verified_degraded",
    "self-attested": "self_attested",
    unverified: "unverified",
  };
  return map[tier] ?? "unverified";
}

function dbSourceToType(source: string): ReputationDimension["source"] {
  const map: Record<string, ReputationDimension["source"]> = {
    cryptographic: "cryptographic",
    operator_attested: "operator-attested",
    self_reported: "self-reported",
    computed: "computed",
  };
  return map[source] ?? "self-reported";
}

// ─── Public API ──────────────────────────────────────────────────

export async function getAgents(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  trustTier?: string;
  minScore?: number;
  maxScore?: number;
  sortBy?: "score" | "recent" | "sovereignty";
}): Promise<PaginatedResponse<AgentProfile>> {
  const {
    page = 1,
    pageSize = 20,
    search,
    trustTier,
    minScore,
    maxScore,
    sortBy = "score",
  } = options || {};

  if (useDatabase) {
    const prisma = await getPrisma();

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { capabilities: { has: search.toLowerCase() } },
      ];
    }
    if (trustTier) {
      where.trustTier = typeTrustTierToDb(trustTier);
    }
    if (minScore !== undefined || maxScore !== undefined) {
      where.overallScore = {
        ...(minScore !== undefined ? { gte: minScore } : {}),
        ...(maxScore !== undefined ? { lte: maxScore } : {}),
      };
    }

    const orderBy =
      sortBy === "recent"
        ? { lastActive: "desc" as const }
        : sortBy === "sovereignty"
          ? { overallScore: "desc" as const } // approximation; real sovereignty sort needs computed field
          : { overallScore: "desc" as const };

    const [total, agents] = await Promise.all([
      prisma.agent.count({ where }),
      prisma.agent.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          sovereigntyLayers: true,
          reputationDimensions: true,
          badges: true,
          initiatedAttestations: { include: { responder: { select: { name: true } } } },
          receivedAttestations: { include: { initiator: { select: { name: true } } } },
        },
      }),
    ]);

    return {
      data: agents.map((a) => dbAgentToProfile(a as unknown as Record<string, unknown>)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // JSON fallback
  const { agents } = await loadJson();
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
        const aAvg = a.sovereigntyLayers.reduce((s, l) => s + l.score, 0) / 4;
        const bAvg = b.sovereigntyLayers.reduce((s, l) => s + l.score, 0) / 4;
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

export async function getAgent(id: string): Promise<AgentProfile | undefined> {
  if (useDatabase) {
    const prisma = await getPrisma();
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        sovereigntyLayers: true,
        reputationDimensions: true,
        badges: true,
        initiatedAttestations: { include: { responder: { select: { name: true } } } },
        receivedAttestations: { include: { initiator: { select: { name: true } } } },
      },
    });
    if (!agent) return undefined;
    return dbAgentToProfile(agent as unknown as Record<string, unknown>);
  }

  const { agents } = await loadJson();
  return agents.find((a) => a.id === id);
}

export async function getAttestation(id: string): Promise<Attestation | undefined> {
  if (useDatabase) {
    const prisma = await getPrisma();
    const att = await prisma.attestation.findUnique({
      where: { id },
      include: {
        initiator: { select: { name: true } },
        responder: { select: { name: true } },
      },
    });
    if (!att) return undefined;

    return {
      id: att.id,
      initiatorId: att.initiatorId,
      initiatorName: att.initiator.name,
      responderId: att.responderId,
      responderName: att.responder.name,
      timestamp: att.timestamp.toISOString(),
      expiresAt: att.expiresAt.toISOString(),
      trustTier: dbTrustTierToType(att.trustTier),
      verified: att.verified,
      initiatorPosture: att.initiatorPosture as unknown as SovereigntyLayer[],
      responderPosture: att.responderPosture as unknown as SovereigntyLayer[],
      signature: att.signature,
      protocol: att.protocol,
      protocolVersion: att.protocolVersion,
    };
  }

  const { attestations } = await loadJson();
  return attestations.find((a) => a.id === id);
}

export async function getStats() {
  if (useDatabase) {
    const prisma = await getPrisma();
    const [totalAgents, claimedAgents, totalHandshakes, verifiedHandshakes, sovereignAgents, scoreAgg] =
      await Promise.all([
        prisma.agent.count(),
        prisma.agent.count({ where: { claimStatus: "claimed" } }),
        prisma.attestation.count(),
        prisma.attestation.count({ where: { verified: true } }),
        prisma.agent.count({ where: { trustTier: "verified_sovereign" } }),
        prisma.agent.aggregate({ _avg: { overallScore: true } }),
      ]);

    return {
      totalAgents,
      claimedAgents,
      totalHandshakes,
      verifiedHandshakes,
      averageScore: Math.round(scoreAgg._avg.overallScore ?? 0),
      sovereignAgents,
    };
  }

  const { agents, attestations } = await loadJson();
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
