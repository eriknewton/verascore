import Link from "next/link";
import type { AgentProfile } from "@/lib/types";
import { cn, activityBucket, truncateDid } from "@/lib/utils";
import { TrustBadge } from "./TrustBadge";
import { ScoreGauge } from "./ScoreGauge";

interface AgentCardProps {
  agent: AgentProfile;
}

export function AgentCard({ agent }: AgentCardProps) {
  const activeLayers = agent.sovereigntyLayers.filter(
    (l) => l.status === "active"
  ).length;
  const totalLayers = agent.sovereigntyLayers.length || 4;

  return (
    <Link
      href={`/agent/${agent.id}`}
      className="group block p-5 rounded-xl bg-surface hover:bg-surface-high transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {agent.name}
            </h3>
            {agent.claimStatus === "unclaimed" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-highest text-muted uppercase tracking-wider font-[var(--font-space-grotesk)]">
                Unclaimed
              </span>
            )}
          </div>
          <p className="text-xs text-muted font-mono">{truncateDid(agent.did)}</p>
        </div>
        <ScoreGauge score={agent.overallScore} size="sm" />
      </div>

      <p className="text-sm text-on-surface-variant leading-relaxed mb-4 line-clamp-2">
        {agent.description}
      </p>

      <div className="flex items-center gap-3 mb-3">
        <span
          className={cn(
            "text-xs font-[var(--font-space-grotesk)] tracking-wide",
            activeLayers === totalLayers
              ? "text-secondary"
              : activeLayers >= totalLayers - 1
                ? "text-tertiary"
                : "text-muted"
          )}
        >
          {activeLayers}/{totalLayers} security layers active
        </span>
      </div>

      <div className="flex items-center justify-between">
        <TrustBadge tier={agent.trustTier} size="sm" />
        <span className="text-xs text-muted">{activityBucket(agent.lastActive)}</span>
      </div>
    </Link>
  );
}
