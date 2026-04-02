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
            background: "#0b0e17",
            color: "#6b7a99",
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
          background: "linear-gradient(135deg, #0b0e17 0%, #131825 50%, #0b0e17 100%)",
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
          <span style={{ fontSize: "20px", color: "#6b7a99" }}>Verascore</span>
        </div>

        {/* Status */}
        <div
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: isValid ? "#14b8a6" : "#ef4444",
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
                color: "#e8eaf0",
              }}
            >
              {attestation.initiatorName}
            </div>
            <div style={{ fontSize: "16px", color: "#6b7a99", marginTop: "4px" }}>
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
                color: isValid ? "#14b8a6" : "#6b7a99",
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
                color: "#e8eaf0",
              }}
            >
              {attestation.responderName}
            </div>
            <div style={{ fontSize: "16px", color: "#6b7a99", marginTop: "4px" }}>
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
            color: "#6b7a99",
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
