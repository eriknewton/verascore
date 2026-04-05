import { ImageResponse } from "next/og";
import { getAgent } from "@/lib/data";

export const alt = "Agent Profile — Verascore";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Next.js 16 does not auto-decode URL-encoded dynamic segments on page routes.
function decodeId(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = decodeId(rawId);
  const agent = await getAgent(id);

  if (!agent) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0d131e",
            color: "#8b90a0",
            fontSize: "32px",
          }}
        >
          Agent not found
        </div>
      ),
      { ...size }
    );
  }

  const tierColor =
    agent.trustTier === "verified-sovereign"
      ? "#54dcbd"
      : agent.trustTier === "verified-degraded"
        ? "#e9c400"
        : agent.trustTier === "self-attested"
          ? "#8b90a0"
          : "#ef4444";

  const tierLabel =
    agent.trustTier === "verified-sovereign"
      ? "Verified Sovereign"
      : agent.trustTier === "verified-degraded"
        ? "Verified Degraded"
        : agent.trustTier === "self-attested"
          ? "Self-Attested"
          : "Unverified";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          background: "linear-gradient(135deg, #0d131e 0%, #1a202b 50%, #0d131e 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "60px",
        }}
      >
        {/* Left side */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: "1",
            paddingRight: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <span style={{ fontSize: "20px", color: "#adc6ff", fontWeight: "bold" }}>
              Verascore
            </span>
          </div>

          <div
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "#dde2f2",
              marginBottom: "12px",
              letterSpacing: "-1px",
            }}
          >
            {agent.name}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px",
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
            <span style={{ fontSize: "20px", color: tierColor }}>
              {tierLabel}
            </span>
          </div>

          <div
            style={{
              fontSize: "18px",
              color: "#8b90a0",
              lineHeight: "1.6",
              maxWidth: "500px",
              display: "-webkit-box",
              overflow: "hidden",
            }}
          >
            {agent.description.slice(0, 150)}
            {agent.description.length > 150 ? "..." : ""}
          </div>

          {/* Layer indicators */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginTop: "32px",
            }}
          >
            {agent.sovereigntyLayers.map((layer) => (
              <div
                key={layer.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span style={{ fontSize: "14px", color: "#8b90a0" }}>
                  {layer.name}
                </span>
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background:
                      layer.status === "active"
                        ? "#54dcbd"
                        : layer.status === "degraded"
                          ? "#e9c400"
                          : "#8b90a0",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right side — score */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "260px",
          }}
        >
          <div
            style={{
              fontSize: "120px",
              fontWeight: "bold",
              background: `linear-gradient(135deg, ${agent.overallScore >= 60 ? "#54dcbd" : "#ef4444"}, ${agent.overallScore >= 80 ? "#adc6ff" : agent.overallScore >= 60 ? "#e9c400" : "#ef4444"})`,
              backgroundClip: "text",
              color: "transparent",
              lineHeight: "1",
            }}
          >
            {agent.overallScore}
          </div>
          <div
            style={{
              fontSize: "16px",
              color: "#8b90a0",
              textTransform: "uppercase",
              letterSpacing: "3px",
              marginTop: "8px",
            }}
          >
            Overall Score
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
