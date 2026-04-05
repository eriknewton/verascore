import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgent } from "@/lib/data";
import { cn, formatDate, activityBucket, truncateDid, scoreColor } from "@/lib/utils";
import { ScoreGauge } from "@/components/ScoreGauge";
import { TrustBadge } from "@/components/TrustBadge";
import { ScoreTierLadder } from "@/components/ScoreTierLadder";

// Force dynamic rendering — agent data is frequently updated and stale 404s
// from the Full Route Cache would block freshly auto-created stubs.
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Next.js 16 app router does NOT auto-decode URL-encoded dynamic segments
// for page routes — we get the raw URL-encoded string. Decode defensively
// so DID-shaped IDs (containing colons → %3A) resolve correctly.
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
    title: `${agent.name} — Agent Profile`,
    description: agent.description,
  };
}

export default async function AgentProfilePage({ params }: PageProps) {
  const { id: rawId } = await params;
  const id = decodeId(rawId);
  const agent = await getAgent(id);

  if (!agent) {
    notFound();
  }

  const isClaimed = agent.claimStatus === "claimed";

  return (
    <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 py-8 sm:py-12 pt-24 space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-xl bg-surface-low p-8 md:p-16">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-l from-primary/30 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              {isClaimed ? (
                <span className="font-[var(--font-space-grotesk)] text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  VERIFIED AGENT
                </span>
              ) : (
                <span className="font-[var(--font-space-grotesk)] text-xs font-bold text-tertiary bg-tertiary/10 px-3 py-1 rounded-full">
                  UNCLAIMED
                </span>
              )}
              <TrustBadge tier={agent.trustTier} />
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground">
              {agent.name}
            </h1>
            <p className="font-[var(--font-space-grotesk)] text-muted text-lg tracking-wide">
              {truncateDid(agent.did)} // {agent.platform}
            </p>
          </div>

          <div className="bg-surface-high p-8 rounded-xl shadow-xl flex items-center gap-8">
            <ScoreGauge score={agent.overallScore} size="lg" label="Verascore Rating" />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Sovereignty Summary — no per-layer detail on public view */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Security & Privacy Posture
            </h2>
            {(() => {
              const activeLayers = agent.sovereigntyLayers.filter(
                (l) => l.status === "active"
              ).length;
              const totalLayers = agent.sovereigntyLayers.length || 4;
              const allActive = activeLayers === totalLayers;
              return (
                <div className="p-6 rounded-xl bg-surface">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        allActive
                          ? "bg-secondary/10"
                          : activeLayers >= totalLayers - 1
                            ? "bg-tertiary/10"
                            : "bg-muted/10"
                      )}
                    >
                      <svg
                        className={cn(
                          "w-6 h-6",
                          allActive
                            ? "text-secondary"
                            : activeLayers >= totalLayers - 1
                              ? "text-tertiary"
                              : "text-muted"
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {activeLayers} of {totalLayers} security layers active
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        {allActive
                          ? "Full sovereignty stack verified"
                          : `${totalLayers - activeLayers} layer${totalLayers - activeLayers > 1 ? "s" : ""} operating at reduced capability`}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Security posture covers cognitive isolation, operational sandboxing,
                    selective disclosure, and verifiable reputation. Detailed layer
                    analysis is available to the agent owner.
                  </p>
                </div>
              );
            })()}
          </section>

          {/* Reputation Dimensions — Bento Grid */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Reputation Dimensions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {agent.reputationDimensions.map((dim) => (
                <div
                  key={dim.name}
                  className="p-4 rounded-lg bg-surface"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {dim.name}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-mono font-bold",
                        scoreColor(dim.score)
                      )}
                    >
                      {dim.score}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-highest overflow-hidden mb-2">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        dim.score >= 80
                          ? "bg-secondary"
                          : dim.score >= 50
                            ? "bg-tertiary"
                            : dim.score > 0
                              ? "bg-error"
                              : "bg-muted/30"
                      )}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant">{dim.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Handshake History */}
          <section>
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Handshake History
              </h2>
              {agent.handshakes.length > 0 && (
                <span className="flex items-center gap-2 font-[var(--font-space-grotesk)] text-[10px] text-secondary bg-secondary/5 px-2 py-1 rounded">
                  <span className="block w-1.5 h-1.5 rounded-full bg-secondary" />
                  LIVE ATTESTATION
                </span>
              )}
            </div>
            {agent.handshakes.length === 0 ? (
              <div className="p-8 rounded-lg bg-surface text-center text-on-surface-variant">
                No verified handshakes yet.
              </div>
            ) : (
              <div className="space-y-3">
                {agent.handshakes.map((hs) => (
                  <Link
                    key={hs.id}
                    href={`/verify/${hs.attestationId}`}
                    className="flex items-center gap-4 p-4 rounded-lg bg-surface hover:bg-surface-high transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-secondary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-foreground">
                          {hs.counterpartyName}
                        </span>
                        <TrustBadge tier={hs.trustTier} size="sm" />
                      </div>
                      <span className="text-xs text-muted">
                        {formatDate(hs.timestamp)}
                      </span>
                    </div>
                    <svg
                      className="w-4 h-4 text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Tier Ladder */}
          <ScoreTierLadder
            currentScore={agent.overallScore}
            currentTier={agent.trustTier}
            handshakeCount={agent.handshakes.length}
            shrCount={agent.badges.filter((b) => b.icon === "shield").length}
            attestationCount={agent.handshakes.filter((h) => h.verified).length}
          />

          {/* Metadata */}
          <div className="p-5 rounded-xl bg-surface">
            <h3 className="text-sm font-semibold text-foreground mb-4 font-[var(--font-space-grotesk)] uppercase tracking-wider">
              Details
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-muted mb-0.5 font-[var(--font-space-grotesk)] uppercase tracking-wider">DID</dt>
                <dd className="text-xs font-mono text-foreground break-all">
                  {agent.did || "None"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted mb-0.5 font-[var(--font-space-grotesk)] uppercase tracking-wider">Key Type</dt>
                <dd className="text-sm text-foreground">{agent.keyType}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted mb-0.5 font-[var(--font-space-grotesk)] uppercase tracking-wider">Platform</dt>
                <dd className="text-sm text-foreground">{agent.platform}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted mb-0.5 font-[var(--font-space-grotesk)] uppercase tracking-wider">Created</dt>
                <dd className="text-sm text-foreground">
                  {formatDate(agent.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted mb-0.5 font-[var(--font-space-grotesk)] uppercase tracking-wider">Activity</dt>
                <dd className="text-sm text-foreground">
                  {activityBucket(agent.lastActive)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted mb-0.5 font-[var(--font-space-grotesk)] uppercase tracking-wider">Status</dt>
                <dd className="text-sm">
                  {isClaimed ? (
                    <span className="text-secondary">Claimed</span>
                  ) : (
                    <span className="text-tertiary">Unclaimed</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Badges */}
          <div className="p-5 rounded-xl bg-surface">
            <h3 className="text-sm font-semibold text-foreground mb-4 font-[var(--font-space-grotesk)] uppercase tracking-wider">
              Badges
            </h3>
            {agent.badges.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No badges earned yet.</p>
            ) : (
              <div className="space-y-3">
                {agent.badges.map((badge) => (
                  <div key={badge.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {badge.icon === "shield" && (
                        <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                      )}
                      {badge.icon === "handshake" && (
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                      )}
                      {badge.icon === "star" && (
                        <svg className="w-4 h-4 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                      )}
                      {badge.icon === "cpu" && (
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {badge.name}
                      </p>
                      <p className="text-xs text-on-surface-variant">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Capabilities */}
          <div className="p-5 rounded-xl bg-surface">
            <h3 className="text-sm font-semibold text-foreground mb-4 font-[var(--font-space-grotesk)] uppercase tracking-wider">
              Capabilities
            </h3>
            <div className="flex flex-wrap gap-2">
              {agent.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="text-xs px-2.5 py-1 rounded-md bg-surface-high text-on-surface-variant font-mono"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>

          {/* Claim CTA for unclaimed agents */}
          {!isClaimed && (
            <div className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-primary/20 to-transparent">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Is this your agent?
              </h3>
              <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
                Claim this profile to verify your identity and unlock full
                reputation features.
              </p>
              <Link href={`/claim/${agent.id}`} className="w-full py-2 bg-primary text-on-primary font-bold rounded-lg text-sm transition-transform active:scale-95 block text-center hover:bg-primary-container">
                Claim This Agent
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
