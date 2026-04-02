import { PrismaClient } from "../src/generated/prisma/client";
import agentsData from "../src/data/agents.json";
import attestationsData from "../src/data/attestations.json";

const prisma = new PrismaClient();

const trustTierMap: Record<string, string> = {
  "verified-sovereign": "verified_sovereign",
  "verified-degraded": "verified_degraded",
  "self-attested": "self_attested",
  unverified: "unverified",
};

const sourceMap: Record<string, string> = {
  cryptographic: "cryptographic",
  "operator-attested": "operator_attested",
  "self-reported": "self_reported",
  computed: "computed",
};

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.attestation.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.reputationDimension.deleteMany();
  await prisma.sovereigntyLayer.deleteMany();
  await prisma.agent.deleteMany();

  // Seed agents
  for (const agent of agentsData) {
    await prisma.agent.create({
      data: {
        id: agent.id,
        name: agent.name,
        did: agent.did,
        keyType: agent.keyType,
        platform: agent.platform,
        description: agent.description,
        claimStatus: agent.claimStatus as "claimed" | "unclaimed",
        createdAt: new Date(agent.createdAt),
        lastActive: new Date(agent.lastActive),
        overallScore: agent.overallScore,
        trustTier: trustTierMap[agent.trustTier] as string as never,
        capabilities: agent.capabilities,
        sovereigntyLayers: {
          create: agent.sovereigntyLayers.map((l) => ({
            name: l.name,
            label: l.label,
            score: l.score,
            status: l.status as never,
            description: l.description,
          })),
        },
        reputationDimensions: {
          create: agent.reputationDimensions.map((d) => ({
            name: d.name,
            score: d.score,
            maxScore: d.maxScore,
            source: sourceMap[d.source] as never,
            description: d.description,
          })),
        },
        badges: {
          create: agent.badges.map((b) => ({
            name: b.name,
            description: b.description,
            icon: b.icon,
            earnedAt: new Date(b.earnedAt),
          })),
        },
      },
    });
    console.log(`  Created agent: ${agent.name}`);
  }

  // Seed attestations
  for (const att of attestationsData) {
    await prisma.attestation.create({
      data: {
        id: att.id,
        initiatorId: att.initiatorId,
        responderId: att.responderId,
        timestamp: new Date(att.timestamp),
        expiresAt: new Date(att.expiresAt),
        trustTier: trustTierMap[att.trustTier] as string as never,
        verified: att.verified,
        signature: att.signature,
        protocol: att.protocol,
        protocolVersion: att.protocolVersion,
        initiatorPosture: att.initiatorPosture as unknown as never,
        responderPosture: att.responderPosture as unknown as never,
      },
    });
    console.log(`  Created attestation: ${att.id}`);
  }

  console.log("Seed complete.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
