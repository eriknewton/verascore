import { ImageResponse } from "next/og";
import { getAgent } from "@/lib/data";

export const alt = "Agent Profile — Verascore";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
            background: "#0b0e17",
            color: "#6b7a99",
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
      ? "#14b8a6"
      : agent.trustTier === "verified-degraded"
        ? "#f59e0b"
        : agent.trustTier === "self-attested"
          ? "#6b7a99"
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
          background: "linear-gradient(135deg, #0b0e17 0%, #131825 50%, #0b0e17 100%)",
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
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #3b82f6, #14b8a6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              V
            </div>
            <span style={{ fontSize: "20px", color: "#6b7a99" }}>
              Verascore
            </span>
          </div>

          <div
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "#e8eaf0",
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
              color: "#6b7a99",
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
                <span style={{ fontSize: "14px", color: "#6b7a99" }}>
                  {layer.name}
                </span>
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background:
                      layer.status === "active"
                        ? "#14b8a6"
                        : layer.status === "degraded"
                          ? "#f59e0b"
                          : "#6b7a99",
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
              background: `linear-gradient(135deg, ${agent.overallScore >= 60 ? "#14b8a6" : "#ef4444"}, ${agent.overallScore >= 80 ? "#3b82f6" : agent.overallScore >= 60 ? "#f59e0b" : "#ef4444"})`,
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
              color: "#6b7a99",
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
