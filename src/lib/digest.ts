/**
 * Weekly digest scaffold.
 *
 * Builds a summary of a user's fleet — counts by trust tier,
 * recent handshakes, and score movements. `sendDigest` is a
 * stub that console.logs the digest; SMTP wiring lands later.
 */

import { getOwnedAgents, type FleetAgentRow } from "./fleet";

export interface TierCounts {
  verified_sovereign: number;
  verified_degraded: number;
  self_attested: number;
  unverified: number;
}

export interface RecentHandshake {
  attestationId: string;
  counterpartyName: string;
  counterpartyId: string;
  trustTier: string;
  timestamp: string;
  verified: boolean;
}

export interface WeeklyDigest {
  userId: string;
  generatedAt: string;
  fleetSize: number;
  tierCounts: TierCounts;
  averageScore: number;
  recentHandshakes: RecentHandshake[];
  scoreChanges: Array<{
    agentId: string;
    agentName: string;
    currentScore: number;
  }>;
}

function emptyTierCounts(): TierCounts {
  return {
    verified_sovereign: 0,
    verified_degraded: 0,
    self_attested: 0,
    unverified: 0,
  };
}

function countByTier(agents: FleetAgentRow[]): TierCounts {
  const counts = emptyTierCounts();
  for (const a of agents) {
    const key = a.trustTier as keyof TierCounts;
    if (key in counts) counts[key] += 1;
  }
  return counts;
}

async function getRecentHandshakes(
  agentIds: string[]
): Promise<RecentHandshake[]> {
  if (agentIds.length === 0) return [];
  if (!process.env.DATABASE_URL) return [];

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  try {
    const { prisma } = await import("./db");
    const atts = await prisma.attestation.findMany({
      where: {
        OR: [
          { initiatorId: { in: agentIds } },
          { responderId: { in: agentIds } },
        ],
        timestamp: { gte: since },
      },
      include: { initiator: true, responder: true },
      orderBy: { timestamp: "desc" },
      take: 10,
    });

    return atts.map((att) => {
      // Pick the counterparty from the owned-agent's perspective.
      const ownedIsInitiator = agentIds.includes(att.initiatorId);
      const counterparty = ownedIsInitiator ? att.responder : att.initiator;
      return {
        attestationId: att.id,
        counterpartyName: counterparty?.name ?? (ownedIsInitiator ? att.responderId : att.initiatorId),
        counterpartyId: ownedIsInitiator ? att.responderId : att.initiatorId,
        trustTier: att.trustTier as string,
        timestamp: att.timestamp.toISOString(),
        verified: att.verified,
      };
    });
  } catch (err) {
    console.warn("getRecentHandshakes: DB lookup failed", err);
    return [];
  }
}

/**
 * Build a digest snapshot for a user's fleet.
 *
 * Does not persist anything — pure read.
 */
export async function generateWeeklyDigest(
  userId: string
): Promise<WeeklyDigest> {
  const agents = await getOwnedAgents(userId);

  const tierCounts = countByTier(agents);
  const averageScore =
    agents.length === 0
      ? 0
      : Math.round(
          agents.reduce((sum, a) => sum + a.overallScore, 0) / agents.length
        );

  const recentHandshakes = await getRecentHandshakes(agents.map((a) => a.id));

  const scoreChanges = agents
    .slice()
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 5)
    .map((a) => ({
      agentId: a.id,
      agentName: a.name,
      currentScore: a.overallScore,
    }));

  return {
    userId,
    generatedAt: new Date().toISOString(),
    fleetSize: agents.length,
    tierCounts,
    averageScore,
    recentHandshakes,
    scoreChanges,
  };
}

/**
 * Send a digest. Stub: console.logs the formatted digest. Swap
 * this out with real SMTP / transactional-email wiring later.
 */
export async function sendDigest(userId: string): Promise<void> {
  const digest = await generateWeeklyDigest(userId);
  console.log(
    `[digest] weekly digest for user=${userId}:\n${JSON.stringify(digest, null, 2)}`
  );
}
