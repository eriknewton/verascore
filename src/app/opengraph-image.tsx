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
          background: "linear-gradient(135deg, #0b0e17 0%, #131825 50%, #0b0e17 100%)",
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
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #3b82f6, #14b8a6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "32px",
              fontWeight: "bold",
            }}
          >
            V
          </div>
          <span
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "#e8eaf0",
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
            background: "linear-gradient(90deg, #3b82f6, #14b8a6)",
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
            color: "#6b7a99",
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
