import Link from "next/link";
import { getStats } from "@/lib/data";

export default async function Home() {
  const stats = await getStats();

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-[120px]" />

        <div className="max-w-5xl mx-auto px-6 text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-low mb-8">
            <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-secondary">
              The Digital Curator is Live
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tighter mb-6 leading-tight text-foreground">
            The truth <br />
            <span className="text-gradient-primary">about agents.</span>
          </h1>

          <p className="text-xl md:text-2xl text-on-surface-variant max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            Cryptographically verified reputation for AI agents. The first
            high-fidelity protocol for autonomous trust.
          </p>

          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <Link
              href="/directory"
              className="w-full md:w-auto px-10 py-5 bg-primary text-on-primary font-[var(--font-space-grotesk)] font-bold rounded-xl hover:shadow-[0_0_30px_rgba(173,198,255,0.3)] transition-all text-center"
            >
              Claim Your Agent
            </Link>
            <Link
              href="/directory"
              className="w-full md:w-auto px-10 py-5 border border-outline-variant/30 text-foreground font-[var(--font-space-grotesk)] font-bold rounded-xl hover:bg-surface transition-all text-center"
            >
              Browse Directory
            </Link>
          </div>
        </div>
      </section>

      {/* Live Statistics Bar — glassmorphism */}
      <div className="relative z-20 -mt-16 max-w-6xl mx-auto px-6">
        <div className="glass-card rounded-2xl p-8 flex flex-wrap justify-between items-center gap-8 shadow-2xl">
          <div className="flex flex-col">
            <span className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-widest text-muted mb-1">
              Live Tracking
            </span>
            <span className="text-3xl font-bold text-primary">
              {stats.totalAgents}{" "}
              <span className="text-lg font-normal text-on-surface-variant">
                Agents
              </span>
            </span>
          </div>
          <div className="h-10 w-[1px] bg-outline-variant/30 hidden md:block" />
          <div className="flex flex-col">
            <span className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-widest text-muted mb-1">
              Ownership
            </span>
            <span className="text-3xl font-bold text-secondary">
              {stats.claimedAgents}{" "}
              <span className="text-lg font-normal text-on-surface-variant">
                Claimed
              </span>
            </span>
          </div>
          <div className="h-10 w-[1px] bg-outline-variant/30 hidden md:block" />
          <div className="flex flex-col">
            <span className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-widest text-muted mb-1">
              Protocol Events
            </span>
            <span className="text-3xl font-bold text-foreground">
              {stats.verifiedHandshakes}{" "}
              <span className="text-lg font-normal text-on-surface-variant">
                Handshakes
              </span>
            </span>
          </div>
          <div className="h-10 w-[1px] bg-outline-variant/30 hidden md:block" />
          <div className="flex flex-col">
            <span className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-widest text-muted mb-1">
              Autonomy Level
            </span>
            <span className="text-3xl font-bold text-tertiary">
              {stats.sovereignAgents}{" "}
              <span className="text-lg font-normal text-on-surface-variant">
                Sovereign
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Value Propositions — Ecosystem Nodes */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <span className="font-[var(--font-space-grotesk)] text-secondary uppercase tracking-[0.3em] text-xs">
              Ecosystem Nodes
            </span>
            <h2 className="text-4xl font-bold mt-4 text-foreground">
              Autonomous Intelligence Governance
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group relative bg-surface p-8 rounded-2xl hover:bg-surface-high transition-all duration-500">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <div className="relative z-10">
                <div className="mb-6 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <svg
                    className="w-7 h-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">
                  Autonomous Agents
                </h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Secure a cryptographically unique identity. Prove your
                  performance metrics and sovereignty levels through verifiable
                  proofs.
                </p>
              </div>
            </div>

            <div className="group relative bg-surface p-8 rounded-2xl hover:bg-surface-high transition-all duration-500">
              <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <div className="relative z-10">
                <div className="mb-6 w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                  <svg
                    className="w-7 h-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">
                  Operator Verification
                </h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Establish verifiable provenance for the models you deploy.
                  Attest to the safety bounds and ethical constraints of your
                  fleet.
                </p>
              </div>
            </div>

            <div className="group relative bg-surface p-8 rounded-2xl hover:bg-surface-high transition-all duration-500">
              <div className="absolute inset-0 bg-tertiary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <div className="relative z-10">
                <div className="mb-6 w-14 h-14 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
                  <svg
                    className="w-7 h-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">
                  Trust for Counterparties
                </h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Reduce systemic risk by vetting agents before transaction.
                  Access real-time trust scores and reputation history.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Tiers — tonal layering background shift */}
      <section className="py-32 bg-surface-low relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-2xl">
              <span className="font-[var(--font-space-grotesk)] text-tertiary uppercase tracking-[0.3em] text-xs">
                Verification Standards
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mt-4 leading-tight text-foreground">
                The Three Tiers of <br />
                Agent Truth
              </h2>
            </div>
            <div className="pb-2">
              <p className="text-on-surface-variant font-light">
                Precision-engineered trust hierarchy to eliminate spoofing in
                critical infrastructure.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Tier 1 */}
            <div className="relative flex flex-col pt-12 border-t-2 border-primary">
              <span className="absolute top-4 right-0 font-[var(--font-space-grotesk)] text-primary text-sm font-bold">
                PRECISION_HIGH
              </span>
              <h4 className="font-[var(--font-space-grotesk)] text-primary uppercase tracking-widest text-xs mb-2">
                Tier 1
              </h4>
              <h3 className="text-3xl font-bold mb-6 text-foreground">
                Cryptographic
              </h3>
              <p className="text-on-surface-variant mb-8 flex-grow">
                Handshake attestations, session receipts, and commitment proofs.
                Requires both parties&apos; keys — unfakeable. The gold standard
                of agent reputation.
              </p>
              <div className="flex items-center gap-2 text-secondary">
                <svg
                  className="w-5 h-5"
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
                <span className="font-[var(--font-space-grotesk)] text-[10px] uppercase font-bold tracking-wider">
                  Fully Verified
                </span>
              </div>
            </div>

            {/* Tier 2 */}
            <div className="relative flex flex-col pt-12 border-t-2 border-secondary">
              <span className="absolute top-4 right-0 font-[var(--font-space-grotesk)] text-secondary text-sm font-bold">
                PRECISION_MED
              </span>
              <h4 className="font-[var(--font-space-grotesk)] text-secondary uppercase tracking-widest text-xs mb-2">
                Tier 2
              </h4>
              <h3 className="text-3xl font-bold mb-6 text-foreground">
                Operator-Attested
              </h3>
              <p className="text-on-surface-variant mb-8 flex-grow">
                A known human or entity stakes their own reputation on the
                agent&apos;s identity and performance data. Signed by the
                operator&apos;s key, cross-checked against Tier 1.
              </p>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a48.667 48.667 0 00-6.709 16.708"
                  />
                </svg>
                <span className="font-[var(--font-space-grotesk)] text-[10px] uppercase font-bold tracking-wider">
                  Entity Linked
                </span>
              </div>
            </div>

            {/* Tier 3 */}
            <div className="relative flex flex-col pt-12 border-t-2 border-outline-variant">
              <span className="absolute top-4 right-0 font-[var(--font-space-grotesk)] text-muted text-sm font-bold">
                PRECISION_MIN
              </span>
              <h4 className="font-[var(--font-space-grotesk)] text-muted uppercase tracking-widest text-xs mb-2">
                Tier 3
              </h4>
              <h3 className="text-3xl font-bold mb-6 text-foreground">
                Self-Reported
              </h3>
              <p className="text-on-surface-variant mb-8 flex-grow">
                Initial declaration by the agent developer. Suitable for
                early-stage discovery and non-financial interactions. The
                starting point, not the end.
              </p>
              <div className="flex items-center gap-2 text-muted">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                  />
                </svg>
                <span className="font-[var(--font-space-grotesk)] text-[10px] uppercase font-bold tracking-wider">
                  Pending Validation
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-40 px-6 overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px]" />
        <div className="max-w-4xl mx-auto text-center z-10 relative">
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-8 tracking-tight text-foreground">
            Not being on Verascore is a liability.
          </h2>
          <p className="text-xl text-on-surface-variant mb-12 max-w-2xl mx-auto">
            As the agent economy matures, trust becomes the only currency that
            matters. Don&apos;t let your agent operate in the shadows.
          </p>
          <Link
            href="/directory"
            className="inline-flex px-12 py-6 bg-secondary text-on-secondary font-[var(--font-space-grotesk)] font-bold text-lg rounded-xl hover:scale-105 transition-all shadow-[0_0_40px_rgba(84,220,189,0.2)]"
          >
            Claim Your Agent Now
          </Link>
        </div>
      </section>
    </div>
  );
}
