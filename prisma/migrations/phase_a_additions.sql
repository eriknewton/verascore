Loaded Prisma config from prisma.config.ts.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SovereigntyLevel" AS ENUM ('active', 'degraded', 'inactive', 'unverified');

-- CreateEnum
CREATE TYPE "TrustTier" AS ENUM ('verified-sovereign', 'verified-degraded', 'self-attested', 'unverified');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('claimed', 'unclaimed');

-- CreateEnum
CREATE TYPE "SignalSource" AS ENUM ('cryptographic', 'operator-attested', 'self-reported', 'computed');

-- CreateEnum
CREATE TYPE "OwnershipMethod" AS ENUM ('HUMAN_INITIATED', 'AGENT_INITIATED');

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "did" TEXT NOT NULL DEFAULT '',
    "keyType" TEXT NOT NULL DEFAULT 'unknown',
    "platform" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "claimStatus" "ClaimStatus" NOT NULL DEFAULT 'unclaimed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overallScore" INTEGER NOT NULL DEFAULT 0,
    "trustTier" "TrustTier" NOT NULL DEFAULT 'unverified',
    "capabilities" TEXT[],
    "avatarUrl" TEXT,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SovereigntyLayer" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "status" "SovereigntyLevel" NOT NULL DEFAULT 'unverified',
    "description" TEXT NOT NULL,

    CONSTRAINT "SovereigntyLayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReputationDimension" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "source" "SignalSource" NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "ReputationDimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attestation" (
    "id" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "responderId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "trustTier" "TrustTier" NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "signature" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "protocolVersion" TEXT NOT NULL,
    "initiatorPosture" JSONB NOT NULL,
    "responderPosture" JSONB NOT NULL,

    CONSTRAINT "Attestation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentOwnership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" "OwnershipMethod" NOT NULL,

    CONSTRAINT "AgentOwnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLinkToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLinkToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimChallenge" (
    "id" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "did" TEXT NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Agent_trustTier_idx" ON "Agent"("trustTier");

-- CreateIndex
CREATE INDEX "Agent_overallScore_idx" ON "Agent"("overallScore");

-- CreateIndex
CREATE INDEX "Agent_platform_idx" ON "Agent"("platform");

-- CreateIndex
CREATE INDEX "Agent_claimStatus_idx" ON "Agent"("claimStatus");

-- CreateIndex
CREATE UNIQUE INDEX "SovereigntyLayer_agentId_name_key" ON "SovereigntyLayer"("agentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ReputationDimension_agentId_name_key" ON "ReputationDimension"("agentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_agentId_name_key" ON "Badge"("agentId", "name");

-- CreateIndex
CREATE INDEX "Attestation_initiatorId_idx" ON "Attestation"("initiatorId");

-- CreateIndex
CREATE INDEX "Attestation_responderId_idx" ON "Attestation"("responderId");

-- CreateIndex
CREATE INDEX "Attestation_verified_idx" ON "Attestation"("verified");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AgentOwnership_userId_idx" ON "AgentOwnership"("userId");

-- CreateIndex
CREATE INDEX "AgentOwnership_agentId_idx" ON "AgentOwnership"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentOwnership_userId_agentId_key" ON "AgentOwnership"("userId", "agentId");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLinkToken_token_key" ON "MagicLinkToken"("token");

-- CreateIndex
CREATE INDEX "MagicLinkToken_email_idx" ON "MagicLinkToken"("email");

-- CreateIndex
CREATE INDEX "MagicLinkToken_expiresAt_idx" ON "MagicLinkToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimChallenge_nonce_key" ON "ClaimChallenge"("nonce");

-- CreateIndex
CREATE INDEX "ClaimChallenge_did_idx" ON "ClaimChallenge"("did");

-- CreateIndex
CREATE INDEX "ClaimChallenge_expiresAt_idx" ON "ClaimChallenge"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- AddForeignKey
ALTER TABLE "SovereigntyLayer" ADD CONSTRAINT "SovereigntyLayer_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReputationDimension" ADD CONSTRAINT "ReputationDimension_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_responderId_fkey" FOREIGN KEY ("responderId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentOwnership" ADD CONSTRAINT "AgentOwnership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentOwnership" ADD CONSTRAINT "AgentOwnership_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

