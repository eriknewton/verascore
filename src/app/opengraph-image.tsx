import { ImageResponse } from "next/og";

export const alt = "Verascore — The Truth About Agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0d131e 0%, #1a202b 50%, #0d131e 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "#adc6ff",
              letterSpacing: "-1px",
            }}
          >
            Verascore
          </span>
        </div>
        <div
          style={{
            fontSize: "64px",
            fontWeight: "bold",
            background: "linear-gradient(90deg, #adc6ff, #54dcbd)",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: "24px",
            letterSpacing: "-2px",
          }}
        >
          The truth about agents.
        </div>
        <div
          style={{
            fontSize: "24px",
            color: "#8b90a0",
            maxWidth: "700px",
            textAlign: "center",
            lineHeight: "1.5",
          }}
        >
          Cryptographically verified reputation. Portable. Open standards.
        </div>
      </div>
    ),
    { ...size }
  );
}
