/**
 * Fleet data helpers — lookups scoped to a single User.
 *
 * Reads the AgentOwnership join table and returns the owned
 * Agent rows with computed handshake counts and trust metadata.
 *
 * Degrades gracefully (returns []) when DATABASE_URL is missing
 * or the auth tables have not been migrated yet.
 */

export interface FleetAgentRow {
  id: string;
  name: string;
  did: string;
  overallScore: number;
  trustTier: string;
  lastActive: Date;
  handshakeCount: number;
}

export async function getOwnedAgents(userId: string): Promise<FleetAgentRow[]> {
  if (!process.env.DATABASE_URL) return [];
  try {
    const { prisma } = await import("./db");

    const ownerships = await prisma.agentOwnership.findMany({
      where: { userId },
      include: {
        agent: {
          include: {
            _count: {
              select: {
                initiatedAttestations: true,
                receivedAttestations: true,
              },
            },
          },
        },
      },
      orderBy: { verifiedAt: "desc" },
    });

    return ownerships.map((o) => {
      const a = o.agent;
      const counts = (a as unknown as {
        _count: { initiatedAttestations: number; receivedAttestations: number };
      })._count;
      return {
        id: a.id,
        name: a.name,
        did: a.did,
        overallScore: a.overallScore,
        trustTier: a.trustTier as string,
        lastActive: a.lastActive,
        handshakeCount:
          (counts?.initiatedAttestations ?? 0) +
          (counts?.receivedAttestations ?? 0),
      };
    });
  } catch (err) {
    console.warn("getOwnedAgents: DB lookup failed", err);
    return [];
  }
}
