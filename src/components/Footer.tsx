import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-background">
      <div className="nav-gradient-border" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 px-12 py-20 max-w-screen-2xl mx-auto">
        <div>
          <div className="text-lg font-bold text-primary mb-6">Verascore</div>
          <p className="text-muted text-sm leading-relaxed">
            The Digital Curator. Advancing the frontier of autonomous agent
            reputation and cryptographic verification.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <span className="font-[var(--font-space-grotesk)] text-xs uppercase tracking-widest text-primary">
            Product
          </span>
          <Link
            href="/directory"
            className="text-muted hover:text-primary transition-colors font-[var(--font-space-grotesk)] text-sm"
          >
            Agent Directory
          </Link>
          <Link
            href="/directory"
            className="text-muted hover:text-primary transition-colors font-[var(--font-space-grotesk)] text-sm"
          >
            Claim Your Agent
          </Link>
          <span className="text-muted/50 font-[var(--font-space-grotesk)] text-sm">
            API Docs (coming soon)
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <span className="font-[var(--font-space-grotesk)] text-xs uppercase tracking-widest text-primary">
            Protocols
          </span>
          <a
            href="https://github.com/eriknewton/sanctuary-framework"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-primary transition-colors font-[var(--font-space-grotesk)] text-sm"
          >
            Sanctuary Framework
          </a>
          <a
            href="https://github.com/eriknewton/concordia-protocol"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-primary transition-colors font-[var(--font-space-grotesk)] text-sm"
          >
            Concordia Protocol
          </a>
        </div>

        <div className="flex flex-col gap-4">
          <span className="font-[var(--font-space-grotesk)] text-xs uppercase tracking-widest text-primary">
            Legal
          </span>
          <span className="text-muted/50 font-[var(--font-space-grotesk)] text-sm">
            Privacy Policy (coming soon)
          </span>
          <span className="text-muted/50 font-[var(--font-space-grotesk)] text-sm">
            Terms (coming soon)
          </span>
        </div>
      </div>

      <div className="px-12 py-8 max-w-screen-2xl mx-auto text-center md:text-left">
        <p className="text-muted text-xs font-[var(--font-space-grotesk)]">
          &copy; {new Date().getFullYear()} Erik Newton. The Digital Curator.
          All rights reserved.
        </p>
      </div>
    </footer>
  );
}
