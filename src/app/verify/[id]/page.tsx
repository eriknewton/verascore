import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAttestation } from "@/lib/data";
import { cn, formatDateTime, trustTierLabel, statusBgColor, scoreColor } from "@/lib/utils";
import { TrustBadge } from "@/components/TrustBadge";
import { SovereigntyBreakdown } from "@/components/SovereigntyBreakdown";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const attestation = getAttestation(id);
  if (!attestation) return { title: "Attestation Not Found" };
  return {
    title: `Handshake Verification — ${attestation.initiatorName} & ${attestation.responderName}`,
    description: `Verified sovereignty handshake between ${attestation.initiatorName} and ${attestation.responderName}`,
  };
}

export default async function VerifyPage({ params }: PageProps) {
  const { id } = await params;
  const attestation = getAttestation(id);

  if (!attestation) {
    notFound();
  }

  const isExpired = new Date(attestation.expiresAt) < new Date();
  const isValid = attestation.verified && !isExpired;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Status Banner */}
      <div
        className={cn(
          "rounded-xl p-6 mb-8 border text-center",
          isValid
            ? "bg-teal/5 border-teal/20"
            : "bg-red/5 border-red/20"
        )}
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          {isValid ? (
            <svg
              className="w-8 h-8 text-teal"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
              />
            </svg>
          ) : (
            <svg
              className="w-8 h-8 text-red"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          <h1
            className={cn(
              "text-2xl font-bold",
              isValid ? "text-teal" : "text-red"
            )}
          >
            {isValid ? "Verified Handshake" : isExpired ? "Expired Attestation" : "Invalid Attestation"}
          </h1>
        </div>
        <p className="text-muted text-sm">
          Sovereignty handshake between two agents, cryptographically attested
          and independently verifiable.
        </p>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <PartyCard
          label="Initiator"
          name={attestation.initiatorName}
          agentId={attestation.initiatorId}
          posture={attestation.initiatorPosture}
        />
        <PartyCard
          label="Responder"
          name={attestation.responderName}
          agentId={attestation.responderId}
          posture={attestation.responderPosture}
        />
      </div>

      {/* Attestation Details */}
      <div className="rounded-xl bg-surface border border-border p-6 mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Attestation Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-muted mb-0.5">Trust Tier</dt>
            <dd>
              <TrustBadge tier={attestation.trustTier} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted mb-0.5">Protocol</dt>
            <dd className="text-sm text-foreground font-mono">
              {attestation.protocol} v{attestation.protocolVersion}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted mb-0.5">Timestamp</dt>
            <dd className="text-sm text-foreground">
              {formatDateTime(attestation.timestamp)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted mb-0.5">Expires</dt>
            <dd
              className={cn(
                "text-sm",
                isExpired ? "text-red" : "text-foreground"
              )}
            >
              {formatDateTime(attestation.expiresAt)}
              {isExpired && " (expired)"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted mb-0.5">Attestation ID</dt>
            <dd className="text-xs text-foreground font-mono">{attestation.id}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted mb-0.5">Status</dt>
            <dd>
              {isValid ? (
                <span className="text-sm text-teal font-medium">Valid</span>
              ) : (
                <span className="text-sm text-red font-medium">
                  {isExpired ? "Expired" : "Invalid"}
                </span>
              )}
            </dd>
          </div>
        </div>
      </div>

      {/* Cryptographic Proof */}
      <details className="rounded-xl bg-surface border border-border overflow-hidden mb-8">
        <summary className="p-6 cursor-pointer text-sm font-semibold text-foreground hover:bg-surface-hover transition-colors">
          Cryptographic Proof
        </summary>
        <div className="px-6 pb-6 border-t border-border pt-4">
          <div className="p-4 rounded-lg bg-background font-mono text-xs text-muted break-all leading-relaxed">
            <p className="mb-2">
              <span className="text-foreground">Signature:</span>
            </p>
            <p className="mb-4">{attestation.signature}</p>
            <p className="mb-2">
              <span className="text-foreground">Protocol:</span>{" "}
              {attestation.protocol}
            </p>
            <p>
              <span className="text-foreground">Version:</span>{" "}
              {attestation.protocolVersion}
            </p>
          </div>
        </div>
      </details>

      {/* Share */}
      <div className="text-center">
        <p className="text-sm text-muted mb-3">
          Share this verification page to prove this handshake happened.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border font-mono text-xs text-muted">
          verascore.ai/verify/{attestation.id}
        </div>
      </div>
    </div>
  );
}

function PartyCard({
  label,
  name,
  agentId,
  posture,
}: {
  label: string;
  name: string;
  agentId: string;
  posture: { name: string; label: string; score: number; status: string; description: string }[];
}) {
  return (
    <div className="rounded-xl bg-surface border border-border p-5">
      <span className="text-xs text-muted uppercase tracking-wider mb-2 block">
        {label}
      </span>
      <Link
        href={`/agent/${agentId}`}
        className="text-lg font-semibold text-foreground hover:text-accent transition-colors block mb-4"
      >
        {name}
      </Link>
      <div className="space-y-2">
        {posture.map((layer) => (
          <div key={layer.name} className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted w-6">
              {layer.name}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  layer.score >= 80
                    ? "bg-teal"
                    : layer.score >= 50
                      ? "bg-amber"
                      : layer.score > 0
                        ? "bg-red"
                        : "bg-muted/30"
                )}
                style={{ width: `${layer.score}%` }}
              />
            </div>
            <span
              className={cn(
                "text-xs font-mono w-6 text-right",
                scoreColor(layer.score)
              )}
            >
              {layer.score}
            </span>
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full border capitalize",
                statusBgColor(layer.status as "active" | "degraded" | "inactive" | "unverified")
              )}
            >
              {layer.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
