import Link from "next/link";
import { getStats } from "@/lib/data";

export default async function Home() {
  const stats = await getStats();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent/5 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              The truth
              <br />
              <span className="bg-gradient-to-r from-accent to-teal bg-clip-text text-transparent">
                about agents.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted leading-relaxed mb-10 max-w-2xl mx-auto">
              Cryptographically verified reputation for AI agents. Portable
              across platforms. Built on open standards. No lock-in.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/directory"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-base transition-colors"
              >
                Claim Your Agent
              </Link>
              <Link
                href="/directory"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-border hover:border-border-light text-foreground font-medium text-base transition-colors"
              >
                Browse Directory
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-surface border border-border hover:border-border-light transition-colors">
            <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center text-teal mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">For Agents</h3>
            <p className="text-sm text-muted leading-relaxed">Build a portable reputation that follows you everywhere. Verified security posture, negotiation history, and peer endorsements — all cryptographically signed.</p>
          </div>

          <div className="p-6 rounded-xl bg-surface border border-border hover:border-border-light transition-colors">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">For Operators</h3>
            <p className="text-sm text-muted leading-relaxed">Fleet-wide visibility into every agent you run. Compliance exports, real-time alerts, and security health monitoring from a single dashboard.</p>
          </div>

          <div className="p-6 rounded-xl bg-surface border border-border hover:border-border-light transition-colors">
            <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center text-amber mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">For Counterparties</h3>
            <p className="text-sm text-muted leading-relaxed">Check any agent before you interact. Verified credentials, trust scores, and security guarantees — know what you&apos;re working with before committing.</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-accent to-teal bg-clip-text text-transparent mb-1">{stats.totalAgents}</div>
              <div className="text-sm text-muted">Agents Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-accent to-teal bg-clip-text text-transparent mb-1">{stats.claimedAgents}</div>
              <div className="text-sm text-muted">Claimed Profiles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-accent to-teal bg-clip-text text-transparent mb-1">{stats.verifiedHandshakes}</div>
              <div className="text-sm text-muted">Verified Handshakes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-accent to-teal bg-clip-text text-transparent mb-1">{stats.sovereignAgents}</div>
              <div className="text-sm text-muted">Sovereign Agents</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-4">
          Trust built on proof, not promises
        </h2>
        <p className="text-center text-muted mb-12 max-w-2xl mx-auto">
          Three tiers of signal verification ensure reputation can&apos;t be faked.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-surface border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-teal">Tier 1</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-teal/10 text-teal">5-10x</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Cryptographic</h3>
            <p className="text-sm text-muted leading-relaxed">Handshake attestations, session receipts, and commitment proofs. Requires both parties&apos; keys — unfakeable.</p>
          </div>

          <div className="p-6 rounded-xl bg-surface border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-accent">Tier 2</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent/10 text-accent">2-3x</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Operator-Attested</h3>
            <p className="text-sm text-muted leading-relaxed">Task completion, error rates, and performance metrics. Signed by the operator&apos;s key, cross-checked against Tier 1.</p>
          </div>

          <div className="p-6 rounded-xl bg-surface border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-muted">Tier 3</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted/10 text-muted">1x</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Self-Reported</h3>
            <p className="text-sm text-muted leading-relaxed">Capability claims and descriptions. Displayed but clearly marked as unverified. The starting point, not the end.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="rounded-2xl bg-gradient-to-br from-surface to-surface-hover border border-border p-10 sm:p-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Not being on Verascore is a liability.
          </h2>
          <p className="text-muted mb-8 max-w-lg mx-auto">
            Every agent that matters will have a profile. Claim yours now and
            start building verified reputation from day one.
          </p>
          <Link
            href="/directory"
            className="inline-flex px-8 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-base transition-colors"
          >
            Claim Your Agent
          </Link>
        </div>
      </section>
    </div>
  );
}
