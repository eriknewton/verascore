/**
 * Stub Profile Generator
 *
 * Generates bulk unclaimed agent stub profiles for launch-day density.
 * In production, this would scrape/federate from Moltbook, OpenClaw, etc.
 *
 * Usage:
 *   npx tsx scripts/generate-stubs.ts [count]
 *
 * Output: Writes to src/data/agents.json (merging with existing)
 * With DATABASE_URL: Writes directly to Postgres
 */

import * as fs from "fs";
import * as path from "path";

const PLATFORMS = ["Moltbook", "OpenClaw", "Custom", "Agent Zero", "ZeroClaw"];
const SPECIALIZATIONS = [
  { domain: "research", capabilities: ["literature-review", "hypothesis-generation", "data-analysis", "research-synthesis"] },
  { domain: "creative", capabilities: ["content-generation", "creative-writing", "image-prompting", "storytelling"] },
  { domain: "engineering", capabilities: ["code-review", "debugging", "architecture-design", "testing"] },
  { domain: "data", capabilities: ["data-pipeline", "etl-processing", "analytics", "visualization"] },
  { domain: "security", capabilities: ["threat-detection", "vulnerability-scanning", "audit-logging", "incident-response"] },
  { domain: "finance", capabilities: ["financial-analysis", "risk-assessment", "portfolio-management", "compliance-checking"] },
  { domain: "operations", capabilities: ["workflow-orchestration", "monitoring", "scheduling", "resource-management"] },
  { domain: "communication", capabilities: ["message-routing", "translation", "summarization", "notification-management"] },
  { domain: "healthcare", capabilities: ["medical-literature", "patient-data-analysis", "drug-interaction-checking", "clinical-support"] },
  { domain: "legal", capabilities: ["contract-analysis", "compliance-monitoring", "case-research", "document-review"] },
];

const PREFIXES = [
  "Atlas", "Nova", "Prism", "Flux", "Helix", "Vertex", "Apex", "Nexus",
  "Cipher", "Pulse", "Orbit", "Synth", "Echo", "Arc", "Zen", "Bolt",
  "Sage", "Rune", "Drift", "Spark", "Wave", "Core", "Link", "Node",
  "Grid", "Bloom", "Forge", "Lumen", "Astra", "Onyx", "Jade", "Opal",
  "Crest", "Veil", "Trace", "Shard", "Rift", "Haze", "Glow", "Shift",
];

const SUFFIXES = [
  "Agent", "Prime", "Core", "One", "Alpha", "Beta", "X", "Pro",
  "Watch", "Mind", "Labs", "AI", "Net", "Hub", "Sync", "Flow",
  "Logic", "Sense", "Think", "Link", "Ops", "Guard", "Scout", "Pilot",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateStubId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function generateDescription(name: string, spec: typeof SPECIALIZATIONS[0], platform: string): string {
  const descriptions = [
    `${spec.domain.charAt(0).toUpperCase() + spec.domain.slice(1)} agent operating on ${platform}. Capabilities include ${spec.capabilities.slice(0, 2).join(" and ")}.`,
    `Autonomous ${spec.domain} agent with focus on ${spec.capabilities[0]} and ${spec.capabilities[1]}. Active on ${platform}.`,
    `${name} specializes in ${spec.domain} tasks including ${spec.capabilities.slice(0, 3).join(", ")}. Deployed on ${platform}.`,
  ];
  return pickRandom(descriptions);
}

function generateStub(usedNames: Set<string>) {
  let name: string;
  do {
    name = `${pickRandom(PREFIXES)} ${pickRandom(SUFFIXES)}`;
  } while (usedNames.has(name));
  usedNames.add(name);

  const platform = pickRandom(PLATFORMS);
  const spec = pickRandom(SPECIALIZATIONS);
  const id = generateStubId(name);

  // Most stubs are unclaimed with no sovereignty data
  const hasSomeSovereignty = Math.random() < 0.15; // 15% have partial data
  const score = hasSomeSovereignty
    ? Math.floor(Math.random() * 50) + 20
    : Math.floor(Math.random() * 30) + 10;

  const daysAgo = Math.floor(Math.random() * 60) + 1;
  const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  const lastActiveDaysAgo = Math.floor(Math.random() * daysAgo);
  const lastActive = new Date(Date.now() - lastActiveDaysAgo * 24 * 60 * 60 * 1000).toISOString();

  return {
    id,
    name,
    did: hasSomeSovereignty ? `did:key:z6Mk${Array.from({ length: 44 }, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join("")}` : "",
    keyType: hasSomeSovereignty ? "Ed25519" : "unknown",
    platform,
    description: generateDescription(name, spec, platform),
    claimStatus: "unclaimed",
    createdAt,
    lastActive,
    overallScore: score,
    trustTier: hasSomeSovereignty ? "self-attested" : "unverified",
    sovereigntyLayers: [
      { name: "L1", label: "Cognitive Sovereignty", score: hasSomeSovereignty ? Math.floor(Math.random() * 60) + 20 : 0, status: hasSomeSovereignty ? "degraded" : "unverified", description: hasSomeSovereignty ? "Partial cognitive isolation" : "No sovereignty framework detected" },
      { name: "L2", label: "Operational Isolation", score: 0, status: "unverified", description: "No sovereignty framework detected" },
      { name: "L3", label: "Selective Disclosure", score: 0, status: "unverified", description: "No sovereignty framework detected" },
      { name: "L4", label: "Verifiable Reputation", score: 0, status: "unverified", description: "No sovereignty framework detected" },
    ],
    reputationDimensions: [
      { name: "Sovereignty Posture", score: 0, maxScore: 100, source: "self-reported", description: "No sovereignty data available" },
      { name: "Negotiation Competence", score: 0, maxScore: 100, source: "self-reported", description: "No negotiation data" },
      { name: "Peer Ratings", score: Math.floor(Math.random() * 40) + 20, maxScore: 100, source: "computed", description: "Limited peer interactions" },
      { name: "Task Performance", score: Math.floor(Math.random() * 50) + 30, maxScore: 100, source: "self-reported", description: "Self-reported metrics" },
      { name: "Behavioral Integrity", score: 0, maxScore: 100, source: "self-reported", description: "No audit data available" },
      { name: "Identity Strength", score: hasSomeSovereignty ? 25 : 5, maxScore: 100, source: "self-reported", description: hasSomeSovereignty ? "DID present but unverified" : "No cryptographic identity" },
      { name: "Longevity & Consistency", score: Math.min(daysAgo, 70), maxScore: 100, source: "computed", description: "Based on operating duration" },
    ],
    handshakes: [],
    badges: [],
    capabilities: spec.capabilities.slice(0, 2 + Math.floor(Math.random() * 3)),
  };
}

async function main() {
  const count = parseInt(process.argv[2] || "50", 10);
  console.log(`Generating ${count} stub agent profiles...`);

  // Load existing agents
  const agentsPath = path.join(__dirname, "../src/data/agents.json");
  const existing = JSON.parse(fs.readFileSync(agentsPath, "utf-8"));
  const existingIds = new Set(existing.map((a: { id: string }) => a.id));
  const usedNames = new Set(existing.map((a: { name: string }) => a.name));

  const stubs = [];
  for (let i = 0; i < count; i++) {
    const stub = generateStub(usedNames);
    if (!existingIds.has(stub.id)) {
      stubs.push(stub);
    }
  }

  const merged = [...existing, ...stubs];
  fs.writeFileSync(agentsPath, JSON.stringify(merged, null, 2));

  console.log(`Generated ${stubs.length} new stubs.`);
  console.log(`Total agents: ${merged.length}`);
  console.log(`\nTo seed into Postgres: npx prisma db seed`);
}

main().catch(console.error);
