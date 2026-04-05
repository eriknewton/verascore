import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUserFromCookies } from "@/lib/auth";
import { getOwnedAgents } from "@/lib/fleet";

export const metadata: Metadata = {
  title: "Your Fleet",
  description: "Agents you own on Verascore.",
};

const tierLabel: Record<string, string> = {
  verified_sovereign: "Verified Sovereign",
  verified_degraded: "Verified Degraded",
  self_attested: "Self-Attested",
  unverified: "Unverified",
};

const tierStyle: Record<string, string> = {
  verified_sovereign:
    "bg-[color:var(--color-secondary-container)]/20 text-secondary border-[color:var(--color-secondary)]/30",
  verified_degraded:
    "bg-[color:var(--color-tertiary-container)]/20 text-tertiary border-[color:var(--color-tertiary)]/30",
  self_attested:
    "bg-surface-high text-on-surface-variant border-[var(--color-border-light)]",
  unverified:
    "bg-surface text-muted border-[var(--color-border-light)]",
};

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function FleetPage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/login");

  const agents = await getOwnedAgents(user.id);

  return (
    <div className="max-w-screen-xl mx-auto px-6 sm:px-8 py-8 sm:py-12 pt-24">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className="font-[var(--font-space-grotesk)] text-secondary uppercase tracking-[0.3em] text-xs mb-2 block">
            Your Fleet
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
            Owned Agents
          </h1>
          <p className="text-on-surface-variant">
            {agents.length} agent{agents.length === 1 ? "" : "s"} claimed by {user.email}.
          </p>
        </div>
        <a
          href="/api/fleet/export"
          className="rounded-lg bg-surface-high text-foreground px-4 py-2 text-sm font-medium hover:bg-surface-highest transition-colors border border-[var(--color-border-light)]"
        >
          Export CSV
        </a>
      </div>

      {agents.length === 0 ? (
        <div className="glass-card rounded-xl p-8 border border-[var(--color-border-light)] text-center">
          <p className="text-on-surface-variant mb-2">
            You haven&apos;t claimed any agents yet.
          </p>
          <p className="text-sm text-muted">
            Run the claim flow to prove ownership of an agent by signing a challenge with its private key.
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-xl border border-[var(--color-border-light)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border-light)] text-left">
                <th className="px-4 py-3 text-xs uppercase tracking-[0.15em] text-secondary font-[var(--font-space-grotesk)]">
                  Name
                </th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.15em] text-secondary font-[var(--font-space-grotesk)]">
                  DID
                </th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.15em] text-secondary font-[var(--font-space-grotesk)]">
                  Score
                </th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.15em] text-secondary font-[var(--font-space-grotesk)]">
                  Tier
                </th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.15em] text-secondary font-[var(--font-space-grotesk)]">
                  Last Activity
                </th>
                <th className="px-4 py-3 text-xs uppercase tracking-[0.15em] text-secondary font-[var(--font-space-grotesk)]">
                  Handshakes
                </th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-[var(--color-border-light)] last:border-0 hover:bg-surface-high/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <a
                      href={`/agent/${a.id}`}
                      className="text-foreground hover:text-primary font-medium"
                    >
                      {a.name}
                    </a>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted truncate max-w-[240px]">
                    {a.did || "—"}
                  </td>
                  <td className="px-4 py-3 text-foreground font-medium">
                    {a.overallScore}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-md border ${tierStyle[a.trustTier] ?? tierStyle.unverified}`}
                    >
                      {tierLabel[a.trustTier] ?? a.trustTier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {formatDate(a.lastActive)}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {a.handshakeCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
