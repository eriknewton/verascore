import { NextRequest } from "next/server";

/**
 * POST /api/publish — Sanctuary reputation_publish endpoint
 *
 * Accepts SHR data, handshake attestations, and sovereignty health
 * from Sanctuary agents. This is the data pipeline that feeds Verascore.
 *
 * Expected payload:
 * {
 *   agentId: string,
 *   signature: string,         // Ed25519 signature over the payload
 *   publicKey: string,         // agent's public key for verification
 *   type: "shr" | "handshake" | "sovereignty-update",
 *   data: {
 *     // For type "shr":
 *     sovereigntyLayers?: SovereigntyLayer[],
 *     reputationDimensions?: ReputationDimension[],
 *     capabilities?: string[],
 *     overallScore?: number,
 *
 *     // For type "handshake":
 *     attestation?: Attestation,
 *
 *     // For type "sovereignty-update":
 *     layers?: SovereigntyLayer[],
 *   }
 * }
 *
 * When DATABASE_URL is set, this writes to Postgres.
 * Without it, returns a dry-run acknowledgment.
 */

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { agentId, signature, publicKey, type, data } = body;

  // Validate required fields
  if (!agentId || !signature || !publicKey || !type || !data) {
    return Response.json(
      {
        error: "Missing required fields",
        required: ["agentId", "signature", "publicKey", "type", "data"],
      },
      { status: 400 }
    );
  }

  // Validate type
  const validTypes = ["shr", "handshake", "sovereignty-update"];
  if (!validTypes.includes(type)) {
    return Response.json(
      {
        error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
      },
      { status: 400 }
    );
  }

  // TODO: In production:
  // 1. Verify Ed25519 signature over JSON.stringify(data) using publicKey
  // 2. Verify publicKey matches the agent's registered DID
  // 3. Rate-limit per agent
  // 4. Write to database

  if (process.env.DATABASE_URL) {
    const { prisma } = await import("@/lib/db");

    // Verify agent exists
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return Response.json({ error: "Agent not found" }, { status: 404 });
    }

    switch (type) {
      case "shr": {
        // Update sovereignty layers and reputation dimensions
        const updates: Record<string, unknown> = {
          lastActive: new Date(),
        };

        if (data.overallScore !== undefined) {
          updates.overallScore = data.overallScore;
        }
        if (data.capabilities) {
          updates.capabilities = data.capabilities;
        }

        await prisma.agent.update({
          where: { id: agentId },
          data: updates,
        });

        if (data.sovereigntyLayers) {
          for (const layer of data.sovereigntyLayers) {
            await prisma.sovereigntyLayer.upsert({
              where: {
                agentId_name: { agentId, name: layer.name },
              },
              update: {
                score: layer.score,
                status: layer.status,
                description: layer.description,
              },
              create: {
                agentId,
                name: layer.name,
                label: layer.label,
                score: layer.score,
                status: layer.status,
                description: layer.description,
              },
            });
          }
        }

        if (data.reputationDimensions) {
          for (const dim of data.reputationDimensions) {
            const sourceMap: Record<string, string> = {
              cryptographic: "cryptographic",
              "operator-attested": "operator_attested",
              "self-reported": "self_reported",
              computed: "computed",
            };
            await prisma.reputationDimension.upsert({
              where: {
                agentId_name: { agentId, name: dim.name },
              },
              update: {
                score: dim.score,
                maxScore: dim.maxScore,
                source: sourceMap[dim.source] as never,
                description: dim.description,
              },
              create: {
                agentId,
                name: dim.name,
                score: dim.score,
                maxScore: dim.maxScore,
                source: sourceMap[dim.source] as never,
                description: dim.description,
              },
            });
          }
        }

        return Response.json({
          success: true,
          type: "shr",
          agentId,
          updated: true,
        });
      }

      case "handshake": {
        const att = data.attestation;
        if (!att || !att.id || !att.responderId) {
          return Response.json(
            { error: "Invalid handshake attestation data" },
            { status: 400 }
          );
        }

        const trustTierMap: Record<string, string> = {
          "verified-sovereign": "verified_sovereign",
          "verified-degraded": "verified_degraded",
          "self-attested": "self_attested",
          unverified: "unverified",
        };

        await prisma.attestation.upsert({
          where: { id: att.id },
          update: {
            verified: att.verified ?? true,
            signature: att.signature ?? signature,
          },
          create: {
            id: att.id,
            initiatorId: agentId,
            responderId: att.responderId,
            timestamp: new Date(att.timestamp ?? Date.now()),
            expiresAt: new Date(att.expiresAt ?? Date.now() + 90 * 24 * 60 * 60 * 1000),
            trustTier: (trustTierMap[att.trustTier] ?? "unverified") as never,
            verified: att.verified ?? true,
            signature: att.signature ?? signature,
            protocol: att.protocol ?? "sanctuary-handshake",
            protocolVersion: att.protocolVersion ?? "0.5.8",
            initiatorPosture: att.initiatorPosture ?? [],
            responderPosture: att.responderPosture ?? [],
          },
        });

        return Response.json({
          success: true,
          type: "handshake",
          attestationId: att.id,
        });
      }

      case "sovereignty-update": {
        if (!data.layers) {
          return Response.json(
            { error: "Missing layers in sovereignty-update" },
            { status: 400 }
          );
        }

        for (const layer of data.layers) {
          await prisma.sovereigntyLayer.upsert({
            where: {
              agentId_name: { agentId, name: layer.name },
            },
            update: {
              score: layer.score,
              status: layer.status,
              description: layer.description,
            },
            create: {
              agentId,
              name: layer.name,
              label: layer.label,
              score: layer.score,
              status: layer.status,
              description: layer.description,
            },
          });
        }

        await prisma.agent.update({
          where: { id: agentId },
          data: { lastActive: new Date() },
        });

        return Response.json({
          success: true,
          type: "sovereignty-update",
          agentId,
          layersUpdated: data.layers.length,
        });
      }
    }
  }

  // No database — return dry-run acknowledgment
  return Response.json({
    success: true,
    dryRun: true,
    message:
      "No database configured. In production, this data would be persisted.",
    received: {
      agentId,
      type,
      dataKeys: Object.keys(data),
    },
  });
}
