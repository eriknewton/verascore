import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgent } from "@/lib/data";
import { truncateDid } from "@/lib/utils";
import { TrustBadge } from "@/components/TrustBadge";
import { ClaimFlow } from "@/components/ClaimFlow";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Next.js 16 page routes do not auto-decode URL-encoded dynamic segments.
function decodeId(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = decodeId(rawId);
  const agent = await getAgent(id);
  if (!agent) return { title: "Agent Not Found" };
  return {
    title: `Claim ${agent.name} — Verascore`,
    description: `Claim and verify your control of ${agent.name} on Verascore`,
  };
}

export default async function ClaimPage({ params }: PageProps) {
  const { id: rawId } = await params;
  const id = decodeId(rawId);
  const agent = await getAgent(id);

  if (!agent) {
    notFound();
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 py-8 sm:py-12 pt-24 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href={`/agent/${agent.id}`}
          className="text-primary hover:text-primary-container transition-colors"
        >
          {agent.name}
        </Link>
        <span className="text-muted">/</span>
        <span className="text-muted">Claim</span>
      </div>

      {/* Header */}
      <section className="relative overflow-hidden rounded-xl bg-surface-low p-8 md:p-12">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-l from-primary/30 to-transparent" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <span className="font-[var(--font-space-grotesk)] text-xs font-bold text-tertiary bg-tertiary/10 px-3 py-1 rounded-full">
              CLAIM AGENT
            </span>
            <TrustBadge tier={agent.trustTier} />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">
            Claim {agent.name}
          </h1>

          <p className="font-[var(--font-space-grotesk)] text-muted text-sm tracking-wide">
            {truncateDid(agent.did)} • {agent.platform}
          </p>

          <p className="text-base text-on-surface-variant leading-relaxed max-w-2xl">
            Complete the Ed25519 challenge-response verification to prove you control this
            agent and unlock verified status on Verascore.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main flow (left) */}
        <div className="lg:col-span-2">
          <ClaimFlow
            agentId={agent.id}
            agentName={agent.name}
            currentStatus={agent.claimStatus}
          />
        </div>

        {/* Info sidebar (right) */}
        <div className="space-y-6">
          {/* About the claim process */}
          <div className="p-5 rounded-xl bg-surface">
            <h3 className="text-sm font-semibold text-foreground mb-4 font-[var(--font-space-grotesk)] uppercase tracking-wider">
              How It Works
            </h3>
            <ol className="space-y-3 text-xs text-on-surface-variant">
              <li className="flex gap-3">
                <span className="font-bold text-primary flex-shrink-0">1</span>
                <span>
                  Generate a unique challenge nonce specific to your claim attempt
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary flex-shrink-0">2</span>
                <span>
                  Sign the nonce with your agent's Ed25519 private key using a
                  compatible tool
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary flex-shrink-0">3</span>
                <span>
                  Submit the signature and your public key for cryptographic
                  verification
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary flex-shrink-0">4</span>
                <span>
                  Your agent is marked as claimed and verified on Verascore
                </span>
              </li>
            </ol>
          </div>

          {/* Technical details */}
          <div className="p-5 rounded-xl bg-surface">
            <h3 className="text-sm font-semibold text-foreground mb-4 font-[var(--font-space-grotesk)] uppercase tracking-wider">
              Technical Details
            </h3>
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-muted mb-0.5 font-[var(--font-space-grotesk)] uppercase tracking-wider">
                  Algorithm
                </dt>
                <dd className="text-foreground font-mono">Ed25519</dd>
              </div>
              <div>
                <dt className="text-muted mb-0.5 font-[var(--font-space-grotesk)] uppercase tracking-wider">
                  Encoding
                </dt>
                <dd className="text-foreground font-mono">Base64url (RFC 4648)</dd>
              </div>
              <div>
                <dt className="text-muted mb-0.5 font-[var(--font-space-grotesk)] uppercase tracking-wider">
                  Challenge TTL
                </dt>
                <dd className="text-foreground">5 minutes</dd>
              </div>
              <div>
                <dt className="text-muted mb-0.5 font-[var(--font-space-grotesk)] uppercase tracking-wider">
                  Public Key Size
                </dt>
                <dd className="text-foreground">32 bytes</dd>
              </div>
            </dl>
          </div>

          {/* Agent info card */}
          <div className="p-5 rounded-xl bg-surface">
            <h3 className="text-sm font-semibold text-foreground mb-4 font-[var(--font-space-grotesk)] uppercase tracking-wider">
              Agent Info
            </h3>
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-muted mb-0.5 font-[var(--font-space-grotesk)] uppercase tracking-wider">
                  ID
                </dt>
                <dd className="text-foreground font-mono break-all">{agent.id}</dd>
              </div>
              <div>
                <dt className="text-muted mb-0.5 font-[var(--font-space-grotesk)] uppercase tracking-wider">
                  Platform
                </dt>
                <dd className="text-foreground">{agent.platform}</dd>
              </div>
              <div>
                <dt className="text-muted mb-0.5 font-[var(--font-space-grotesk)] uppercase tracking-wider">
                  Key Type
                </dt>
                <dd className="text-foreground">{agent.keyType}</dd>
              </div>
            </dl>
          </div>

          {/* Return link */}
          <Link
            href={`/agent/${agent.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface hover:bg-surface-high transition-colors text-sm text-primary"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Agent
          </Link>
        </div>
      </div>
    </div>
  );
}
