import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

// Real Sanctuary DID from Mac Mini Newton Sovereign Agent
const REAL_DID = "did:key:z7QFhEcSSqGx-auV5BoEgzCWNybmS9u-aVjAC65BgixgUhA";

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

async function main() {
  const before = await prisma.agent.findUnique({
    where: { id: "newton-sovereign-agent" },
    select: { name: true, did: true },
  });
  console.log("Before:", before);

  const updated = await prisma.agent.update({
    where: { id: "newton-sovereign-agent" },
    data: { did: REAL_DID },
  });
  console.log("Updated DID to:", updated.did);

  // Also update the seed file so future seeds use the correct DID
  console.log("\nDone. Now re-run reputation_publish from the agent.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
