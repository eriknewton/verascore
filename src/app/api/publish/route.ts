import { NextRequest } from "next/server";
import { verifyEd25519, base64urlToBuffer, publicKeyMatchesDid } from "@/lib/crypto";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/publish — Sanctuary reputation_publish endpoint
 *
 * Accepts SHR data, handshake attestations, and sovereignty health
 * from Sanctuary agents. This is the data pipeline that feeds Verascore.
 *
 * Security model:
 * 1. Ed25519 signature verification over JSON.stringify(data)
 * 2. Public key must match the agent's registered DID (did:key)
 * 3. Rate limiting per agentId (10 requests per 5 minutes)
 *
 * Expected payload:
 * {
 *   agentId: string,
 *   signature: string,         // base64url Ed25519 signature over JSON.stringify(data)
 *   publicKey: string,         // base64url raw Ed25519 public key (32 bytes)
 *   type: "shr" | "handshake" | "sovereignty-update",
 *   data: { ... }
 * }
 */

// Rate limit: 10 publishes per agent per 5 minutes
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 5 * 60 * 1000;

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  const { agentId, signature, publicKey, type, data } = body;

  // ─── Field validation ─────────────────────────────────────────
  if (!agentId || !signature || !publicKey || !type || !data) {
    return Response.json(
      {
        error: "Missing required fields",
        required: ["agentId", "signature", "publicKey", "type", "data"],
      },
      { status: 400 }
    );
  }

  const validTypes = ["shr", "handshake", "sovereignty-update"];
  if (!validTypes.includes(type as string)) {
    return Response.json(
      { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  // ─── Rate limiting ────────────────────────────────────────────
  const rateCheck = checkRateLimit(
    `publish:${agentId}`,
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW
  );

  if (!rateCheck.allowed) {
    return Response.json(
      {
        error: "Rate limit exceeded",
        retryAfterMs: rateCheck.resetIn,
      },
      { status: 429 }
    );
  }

  // ─── Ed25519 signature verification ───────────────────────────
  let signatureBytes: Buffer;
  let publicKeyBytes: Buffer;

  try {
    signatureBytes = base64urlToBuffer(signature as string);
    publicKeyBytes = base64urlToBuffer(publicKey as string);
  } catch {
    return Response.json(
      { error: "Invalid base64url encoding for signature or publicKey" },
      { status: 400 }
    );
  }

  if (publicKeyBytes.length !== 32) {
    return Response.json(
      { error: "publicKey must be a 32-byte Ed25519 key (base64url-encoded)" },
      { status: 400 }
    );
  }

  if (signatureBytes.length !== 64) {
    return Response.json(
      { error: "signature must be a 64-byte Ed25519 signature (base64url-encoded)" },
      { status: 400 }
    );
  }

  // Sanctuary signs over JSON.stringify(data)
  const message = Buffer.from(JSON.stringify(data), "utf-8");
  const signatureValid = verifyEd25519(message, signatureBytes, publicKeyBytes);

  if (!signatureValid) {
    return Response.json(
      { error: "Invalid Ed25519 signature" },
      { status: 401 }
    );
  }

  // ─── Database path ────────────────────────────────────────────
  if (process.env.DATABASE_URL) {
    const { prisma } = await import("@/lib/db");

    // Verify agent exists
    const agent = await prisma.agent.findUnique({ where: { id: agentId as string } });
    if (!agent) {
      return Response.json({ error: "Agent not found" }, { status: 404 });
    }

    // Verify publicKey matches the agent's registered DID
    if (agent.did && agent.did.startsWith("did:key:")) {
      const didMatch = publicKeyMatchesDid(publicKey as string, agent.did);
      if (!didMatch) {
        return Response.json(
          { error: "publicKey does not match agent's registered DID" },
          { status: 403 }
        );
      }
    }
    // If agent has no DID or a non-did:key DID, skip DID matching
    // (the signature alone is the trust anchor until DID is registered)

    switch (type as string) {
      case "shr": {
        const updates: Record<string, unknown> = {
          lastActive: new Date(),
        };

        if ((data as Record<string, unknown>).overallScore !== undefined) {
          updates.overallScore = (data as Record<string, unknown>).overallScore;
        }
        if ((data as Record<string, unknown>).capabilities) {
          updates.capabilities = (data as Record<string, unknown>).capabilities;
        }

        await prisma.agent.update({
          where: { id: agentId as string },
          data: updates,
        });

        if ((data as Record<string, unknown>).sovereigntyLayers) {
          const layers = (data as Record<string, unknown>).sovereigntyLayers as Array<Record<string, unknown>>;
          for (const layer of layers) {
            await prisma.sovereigntyLayer.upsert({
              where: {
                agentId_name: { agentId: agentId as string, name: layer.name as string },
              },
              update: {
                score: layer.score as number,
                status: layer.status as never,
                description: layer.description as string,
              },
              create: {
                agentId: agentId as string,
                name: layer.name as string,
                label: layer.label as string,
                score: layer.score as number,
                status: layer.status as never,
                description: layer.description as string,
              },
            });
          }
        }

        if ((data as Record<string, unknown>).reputationDimensions) {
          const dims = (data as Record<string, unknown>).reputationDimensions as Array<Record<string, unknown>>;
          const sourceMap: Record<string, string> = {
            cryptographic: "cryptographic",
            "operator-attested": "operator_attested",
            "self-reported": "self_reported",
            computed: "computed",
          };
          for (const dim of dims) {
            await prisma.reputationDimension.upsert({
              where: {
                agentId_name: { agentId: agentId as string, name: dim.name as string },
              },
              update: {
                score: dim.score as number,
                maxScore: dim.maxScore as number,
                source: sourceMap[dim.source as string] as never,
                description: dim.description as string,
              },
              create: {
                agentId: agentId as string,
                name: dim.name as string,
                score: dim.score as number,
                maxScore: dim.maxScore as number,
                source: sourceMap[dim.source as string] as never,
                description: dim.description as string,
              },
            });
          }
        }

        return Response.json({
          success: true,
          type: "shr",
          agentId,
          updated: true,
          signatureVerified: true,
        });
      }

      case "handshake": {
        const att = (data as Record<string, unknown>).attestation as Record<string, unknown> | undefined;
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
          where: { id: att.id as string },
          update: {
            verified: (att.verified as boolean) ?? true,
            signature: (att.signature as string) ?? (signature as string),
          },
          create: {
            id: att.id as string,
            initiatorId: agentId as string,
            responderId: att.responderId as string,
            timestamp: new Date((att.timestamp as string) ?? Date.now()),
            expiresAt: new Date(
              (att.expiresAt as string) ?? Date.now() + 90 * 24 * 60 * 60 * 1000
            ),
            trustTier: (trustTierMap[att.trustTier as string] ?? "unverified") as never,
            verified: (att.verified as boolean) ?? true,
            signature: (att.signature as string) ?? (signature as string),
            protocol: (att.protocol as string) ?? "sanctuary-handshake",
            protocolVersion: (att.protocolVersion as string) ?? "0.5.8",
            initiatorPosture: (att.initiatorPosture ?? []) as never,
            responderPosture: (att.responderPosture ?? []) as never,
          },
        });

        return Response.json({
          success: true,
          type: "handshake",
          attestationId: att.id,
          signatureVerified: true,
        });
      }

      case "sovereignty-update": {
        const layers = (data as Record<string, unknown>).layers as Array<Record<string, unknown>> | undefined;
        if (!layers) {
          return Response.json(
            { error: "Missing layers in sovereignty-update" },
            { status: 400 }
          );
        }

        for (const layer of layers) {
          await prisma.sovereigntyLayer.upsert({
            where: {
              agentId_name: { agentId: agentId as string, name: layer.name as string },
            },
            update: {
              score: layer.score as number,
              status: layer.status as never,
              description: layer.description as string,
            },
            create: {
              agentId: agentId as string,
              name: layer.name as string,
              label: layer.label as string,
              score: layer.score as number,
              status: layer.status as never,
              description: layer.description as string,
            },
          });
        }

        await prisma.agent.update({
          where: { id: agentId as string },
          data: { lastActive: new Date() },
        });

        return Response.json({
          success: true,
          type: "sovereignty-update",
          agentId,
          layersUpdated: layers.length,
          signatureVerified: true,
        });
      }
    }
  }

  // ─── No database — dry-run with signature verification ────────
  return Response.json({
    success: true,
    dryRun: true,
    signatureVerified: true,
    message:
      "Signature verified. No database configured — data not persisted.",
    received: {
      agentId,
      type,
      dataKeys: Object.keys(data as Record<string, unknown>),
    },
  });
}
