import { ImageResponse } from "next/og";
import { getAttestation } from "@/lib/data";

export const alt = "Handshake Verification — Verascore";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attestation = await getAttestation(id);

  if (!attestation) {
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
          Attestation not found
        </div>
      ),
      { ...size }
    );
  }

  const isExpired = new Date(attestation.expiresAt) < new Date();
  const isValid = attestation.verified && !isExpired;

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
          padding: "60px",
        }}
      >
        {/* Verascore logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "40px",
          }}
        >
          <span style={{ fontSize: "20px", color: "#adc6ff", fontWeight: "bold" }}>Verascore</span>
        </div>

        {/* Status */}
        <div
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: isValid ? "#54dcbd" : "#ffb4ab",
            marginBottom: "32px",
            textTransform: "uppercase",
            letterSpacing: "3px",
          }}
        >
          {isValid ? "Verified Handshake" : "Invalid"}
        </div>

        {/* Parties */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "40px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: "#dde2f2",
              }}
            >
              {attestation.initiatorName}
            </div>
            <div style={{ fontSize: "16px", color: "#8b90a0", marginTop: "4px" }}>
              Initiator
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                color: isValid ? "#54dcbd" : "#8b90a0",
              }}
            >
              &#x2194;
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                color: "#dde2f2",
              }}
            >
              {attestation.responderName}
            </div>
            <div style={{ fontSize: "16px", color: "#8b90a0", marginTop: "4px" }}>
              Responder
            </div>
          </div>
        </div>

        {/* Protocol info */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            fontSize: "16px",
            color: "#8b90a0",
          }}
        >
          <span>
            {attestation.protocol} v{attestation.protocolVersion}
          </span>
          <span>|</span>
          <span>
            {new Date(attestation.timestamp).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
