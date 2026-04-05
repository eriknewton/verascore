/**
 * ScoreTierLadder — shows current tier, next tier, and exact numeric
 * actions needed to climb. Obsidian palette, glassmorphism.
 */

interface ScoreTierLadderProps {
  currentScore: number;
  currentTier: string;
  handshakeCount: number;
  shrCount: number;
  attestationCount: number;
}

interface Tier {
  name: string;
  label: string;
  threshold: number;
  color: string;
  bgColor: string;
}

const TIERS: Tier[] = [
  { name: "unverified", label: "Unverified", threshold: 0, color: "text-muted", bgColor: "bg-muted/20" },
  { name: "self-attested", label: "Self-Attested", threshold: 10, color: "text-tertiary", bgColor: "bg-tertiary/15" },
  { name: "verified-degraded", label: "Verified (Degraded)", threshold: 30, color: "text-primary", bgColor: "bg-primary/15" },
  { name: "verified", label: "Verified", threshold: 60, color: "text-primary", bgColor: "bg-primary/20" },
  { name: "verified-sovereign", label: "Sovereign", threshold: 100, color: "text-secondary", bgColor: "bg-secondary/20" },
];

function tierIndex(tier: string, score: number): number {
  // If the explicit tier name matches, prefer it; otherwise derive from score.
  const byName = TIERS.findIndex((t) => t.name === tier);
  if (byName >= 0) return byName;
  // Derive from score
  let idx = 0;
  for (let i = 0; i < TIERS.length; i++) {
    if (score >= TIERS[i].threshold) idx = i;
  }
  return idx;
}

export function ScoreTierLadder({
  currentScore,
  currentTier,
  handshakeCount,
  shrCount,
  attestationCount,
}: ScoreTierLadderProps) {
  const currentIdx = tierIndex(currentTier, currentScore);
  const current = TIERS[currentIdx];
  const next = TIERS[currentIdx + 1];

  // Heuristic: each verified handshake is worth ~8 score points,
  // each SHR publish is worth ~4, each attestation is worth ~5.
  // These are presentational guidance values only.
  const HANDSHAKE_VALUE = 8;
  const SHR_VALUE = 4;
  const ATTESTATION_VALUE = 5;

  const pointsNeeded = next ? Math.max(0, next.threshold - currentScore) : 0;

  // Compute suggested actions to reach the next tier.
  const actions: { label: string; count: number; unit: string }[] = [];
  if (next && pointsNeeded > 0) {
    const handshakesNeeded = Math.ceil(pointsNeeded / HANDSHAKE_VALUE);
    const shrsNeeded = Math.ceil(pointsNeeded / SHR_VALUE);
    const attestsNeeded = Math.ceil(pointsNeeded / ATTESTATION_VALUE);
    actions.push({ label: "verified handshake", count: handshakesNeeded, unit: handshakesNeeded === 1 ? "handshake" : "handshakes" });
    actions.push({ label: "SHR publish", count: shrsNeeded, unit: shrsNeeded === 1 ? "SHR publish" : "SHR publishes" });
    actions.push({ label: "attestation", count: attestsNeeded, unit: attestsNeeded === 1 ? "attestation" : "attestations" });
  }

  // Progress percentage to next tier.
  const prevThreshold = current.threshold;
  const nextThreshold = next ? next.threshold : 100;
  const span = Math.max(1, nextThreshold - prevThreshold);
  const progress = next
    ? Math.min(100, Math.max(0, ((currentScore - prevThreshold) / span) * 100))
    : 100;

  return (
    <div className="glass-card rounded-xl border border-border p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground font-[var(--font-space-grotesk)] uppercase tracking-wider">
          Reputation Ladder
        </h3>
        <span className="text-xs font-mono text-muted">{currentScore} / 100</span>
      </div>

      {/* Current / Next visual */}
      <div className="flex items-center gap-3">
        <div className={`flex-1 px-3 py-2 rounded-lg ${current.bgColor}`}>
          <p className="text-[10px] font-[var(--font-space-grotesk)] uppercase tracking-wider text-muted mb-0.5">
            Current
          </p>
          <p className={`text-sm font-semibold ${current.color}`}>{current.label}</p>
        </div>
        {next && (
          <>
            <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <div className="flex-1 px-3 py-2 rounded-lg bg-surface-high border border-border-light">
              <p className="text-[10px] font-[var(--font-space-grotesk)] uppercase tracking-wider text-muted mb-0.5">
                Next
              </p>
              <p className={`text-sm font-semibold ${next.color}`}>{next.label}</p>
            </div>
          </>
        )}
      </div>

      {/* Progress bar */}
      {next && (
        <div>
          <div className="h-2 rounded-full bg-surface-highest overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted mt-2">
            <span className="font-mono text-foreground">{pointsNeeded}</span> point
            {pointsNeeded === 1 ? "" : "s"} to reach{" "}
            <span className={next.color}>{next.label}</span>
          </p>
        </div>
      )}

      {/* Actions */}
      {next ? (
        <div className="space-y-2">
          <p className="text-[10px] font-[var(--font-space-grotesk)] uppercase tracking-wider text-muted">
            How to climb
          </p>
          <ul className="space-y-1.5">
            {actions.map((a) => (
              <li key={a.label} className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="w-1 h-1 rounded-full bg-primary" />
                <span className="font-mono text-foreground">{a.count}</span>
                <span>more {a.unit}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/20">
          <p className="text-xs text-secondary font-medium">
            Top tier reached — sovereign status verified.
          </p>
        </div>
      )}

      {/* Current activity footer */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
        <div>
          <p className="text-[10px] font-[var(--font-space-grotesk)] uppercase tracking-wider text-muted">Handshakes</p>
          <p className="text-sm font-mono font-semibold text-foreground">{handshakeCount}</p>
        </div>
        <div>
          <p className="text-[10px] font-[var(--font-space-grotesk)] uppercase tracking-wider text-muted">SHRs</p>
          <p className="text-sm font-mono font-semibold text-foreground">{shrCount}</p>
        </div>
        <div>
          <p className="text-[10px] font-[var(--font-space-grotesk)] uppercase tracking-wider text-muted">Attestations</p>
          <p className="text-sm font-mono font-semibold text-foreground">{attestationCount}</p>
        </div>
      </div>
    </div>
  );
}
