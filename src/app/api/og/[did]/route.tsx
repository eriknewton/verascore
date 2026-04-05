/**
 * GET /api/og/[did] — Vercel OG image 1200x630 for social sharing.
 * Obsidian palette. Edge runtime.
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";

const TIER_LABELS: Record<string, string> = {
  "verified-sovereign": "Verified Sovereign",
  "verified-degraded": "Verified Degraded",
  "self-attested": "Self-Attested",
  unverified: "Unverified",
};

const TIER_COLORS: Record<string, string> = {
  "verified-sovereign": "#54dcbd",
  "verified-degraded": "#adc6ff",
  "self-attested": "#e9c400",
  unverified: "#8b90a0",
};

interface AgentSummary {
  name: string;
  did: string;
  overallScore: number;
  trustTier: string;
  description?: string;
}

async function fetchAgent(did: string, origin: string): Promise<AgentSummary | null> {
  try {
    const res = await fetch(`${origin}/api/agents/${encodeURIComponent(did)}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Partial<AgentSummary>;
    if (!json.name || typeof json.overallScore !== "number" || !json.trustTier) return null;
    return {
      name: json.name,
      did: json.did ?? did,
      overallScore: json.overallScore,
      trustTier: json.trustTier,
      description: json.description,
    };
  } catch {
    return null;
  }
}

function truncateDid(did: string): string {
  if (did.length <= 24) return did;
  return `${did.slice(0, 16)}...${did.slice(-6)}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ did: string }> }
) {
  const { did } = await params;
  const decodedDid = decodeURIComponent(did);
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  const agent = await fetchAgent(decodedDid, origin);

  const name = agent?.name ?? "Unknown Agent";
  const score = agent?.overallScore ?? 0;
  const tier = agent?.trustTier ?? "unverified";
  const tierLabel = TIER_LABELS[tier] ?? "Unverified";
  const tierColor = TIER_COLORS[tier] ?? "#8b90a0";
  const displayDid = truncateDid(decodedDid);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0d131e 0%, #1a202b 50%, #0d131e 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "72px",
        }}
      >
        {/* Top bar: wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "6px",
                background: "linear-gradient(135deg, #adc6ff, #54dcbd)",
              }}
            />
            <span style={{ fontSize: "22px", color: "#adc6ff", fontWeight: 700, letterSpacing: "0.02em" }}>
              verascore.ai
            </span>
          </div>
          <span
            style={{
              fontSize: "14px",
              color: "#8b90a0",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              fontWeight: 600,
            }}
          >
            Agent Reputation
          </span>
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            gap: "48px",
          }}
        >
          {/* Left column */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: "20px",
            }}
          >
            {/* Tier pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: `${tierColor}1a`,
                border: `1px solid ${tierColor}55`,
                borderRadius: "999px",
                padding: "8px 16px",
                alignSelf: "flex-start",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: tierColor,
                }}
              />
              <span
                style={{
                  fontSize: "16px",
                  color: tierColor,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {tierLabel}
              </span>
            </div>

            {/* Agent name */}
            <div
              style={{
                fontSize: "72px",
                fontWeight: 800,
                color: "#dde2f2",
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
              }}
            >
              {name}
            </div>

            {/* DID fragment */}
            <div
              style={{
                fontSize: "20px",
                color: "#8b90a0",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              {displayDid}
            </div>
          </div>

          {/* Right column — score */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "320px",
              height: "320px",
              borderRadius: "24px",
              background: "rgba(26, 32, 43, 0.6)",
              border: `2px solid ${tierColor}33`,
            }}
          >
            <div
              style={{
                fontSize: "160px",
                fontWeight: 800,
                background: `linear-gradient(135deg, ${tierColor}, #adc6ff)`,
                backgroundClip: "text",
                color: "transparent",
                lineHeight: 1,
              }}
            >
              {score}
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#8b90a0",
                textTransform: "uppercase",
                letterSpacing: "0.25em",
                marginTop: "8px",
                fontWeight: 600,
              }}
            >
              Verascore / 100
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
