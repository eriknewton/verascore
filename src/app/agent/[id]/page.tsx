import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgent } from "@/lib/data";
import { cn, formatDate, timeAgo, truncateDid, scoreColor } from "@/lib/utils";
import { ScoreGauge } from "@/components/ScoreGauge";
import { TrustBadge } from "@/components/TrustBadge";
import { SovereigntyBreakdown } from "@/components/SovereigntyBreakdown";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const agent = getAgent(id);
  if (!agent) return { title: "Agent Not Found" };
  return {
    title: `${agent.name} — Agent Profile`,
    description: agent.description,
  };
}

export default async function AgentProfilePage({ params }: PageProps) {
  const { id } = await params;
  const agent = getAgent(id);

  if (!agent) {
    notFound();
  }

  const isClaimed = agent.claimStatus === "claimed";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start gap-8 mb-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {agent.name}
            </h1>
            {!isClaimed && (
              <span className="text-xs px-2 py-1 rounded-md bg-amber/10 text-amber border border-amber/30 font-medium">
                Unclaimed
              </span>
            )}
          </div>

          <p className="text-muted leading-relaxed mb-4 max-w-2xl">
            {agent.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
            <TrustBadge tier={agent.trustTier} />
            <span className="font-mono text-xs">{truncateDid(agent.did)}</span>
            <span>{agent.platform}</span>
            <span>Active {timeAgo(agent.lastActive)}</span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <ScoreGauge score={agent.overallScore} size="lg" label="Overall Score" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Sovereignty Layers */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Security & Privacy Posture
            </h2>
            <SovereigntyBreakdown layers={agent.sovereigntyLayers} />
          </section>

          {/* Reputation Dimensions */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Reputation Dimensions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {agent.reputationDimensions.map((dim) => (
                <div
                  key={dim.name}
                  className="p-4 rounded-lg bg-surface border border-border"
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
                  <div className="h-1.5 rounded-full bg-border overflow-hidden mb-2">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        dim.score >= 80
                          ? "bg-teal"
                          : dim.score >= 50
                            ? "bg-amber"
                            : dim.score > 0
                              ? "bg-red"
                              : "bg-muted/30"
                      )}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">{dim.description}</span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded capitalize",
                        dim.source === "cryptographic" &&
                          "bg-teal/10 text-teal",
                        dim.source === "operator-attested" &&
                          "bg-accent/10 text-accent",
                        dim.source === "self-reported" &&
                          "bg-muted/10 text-muted",
                        dim.source === "computed" &&
                          "bg-border text-muted"
                      )}
                    >
                      {dim.source}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Handshake History */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Handshake History
            </h2>
            {agent.handshakes.length === 0 ? (
              <div className="p-8 rounded-lg bg-surface border border-border text-center text-muted">
                No verified handshakes yet.
              </div>
            ) : (
              <div className="space-y-3">
                {agent.handshakes.map((hs) => (
                  <Link
                    key={hs.id}
                    href={`/verify/${hs.attestationId}`}
                    className="flex items-center gap-4 p-4 rounded-lg bg-surface border border-border hover:border-border-light transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-teal"
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
          {/* Metadata */}
          <div className="p-5 rounded-xl bg-surface border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Details
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-muted mb-0.5">DID</dt>
                <dd className="text-xs font-mono text-foreground break-all">
                  {agent.did || "None"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted mb-0.5">Key Type</dt>
                <dd className="text-sm text-foreground">{agent.keyType}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted mb-0.5">Platform</dt>
                <dd className="text-sm text-foreground">{agent.platform}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted mb-0.5">Created</dt>
                <dd className="text-sm text-foreground">
                  {formatDate(agent.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted mb-0.5">Last Active</dt>
                <dd className="text-sm text-foreground">
                  {formatDate(agent.lastActive)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted mb-0.5">Status</dt>
                <dd className="text-sm">
                  {isClaimed ? (
                    <span className="text-teal">Claimed</span>
                  ) : (
                    <span className="text-amber">Unclaimed</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Badges */}
          <div className="p-5 rounded-xl bg-surface border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Badges
            </h3>
            {agent.badges.length === 0 ? (
              <p className="text-sm text-muted">No badges earned yet.</p>
            ) : (
              <div className="space-y-3">
                {agent.badges.map((badge) => (
                  <div key={badge.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      {badge.icon === "shield" && (
                        <svg
                          className="w-4 h-4 text-teal"
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
                      )}
                      {badge.icon === "handshake" && (
                        <svg
                          className="w-4 h-4 text-accent"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                          />
                        </svg>
                      )}
                      {badge.icon === "star" && (
                        <svg
                          className="w-4 h-4 text-amber"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                          />
                        </svg>
                      )}
                      {badge.icon === "cpu" && (
                        <svg
                          className="w-4 h-4 text-accent"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {badge.name}
                      </p>
                      <p className="text-xs text-muted">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Capabilities */}
          <div className="p-5 rounded-xl bg-surface border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Capabilities
            </h3>
            <div className="flex flex-wrap gap-2">
              {agent.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="text-xs px-2.5 py-1 rounded-md bg-border/50 text-muted font-mono"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>

          {/* Claim CTA for unclaimed agents */}
          {!isClaimed && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-accent/10 to-teal/10 border border-accent/20">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Is this your agent?
              </h3>
              <p className="text-xs text-muted mb-3">
                Claim this profile to verify your identity and unlock full
                reputation features.
              </p>
              <button className="w-full py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors">
                Claim This Agent
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
