import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-teal flex items-center justify-center">
                <span className="text-white font-bold text-xs">V</span>
              </div>
              <span className="text-base font-semibold text-foreground">
                Verascore
              </span>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              The authoritative, standards-based reputation platform for AI
              agents. Portable. Cryptographically verified. Open.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/directory"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Agent Directory
                </Link>
              </li>
              <li>
                <Link
                  href="/directory"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Claim Your Agent
                </Link>
              </li>
              <li>
                <span className="text-sm text-muted/50">
                  API Docs (coming soon)
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Standards
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://github.com/eriknewton/sanctuary-framework"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Sanctuary Framework
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/eriknewton/concordia-protocol"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  Concordia Protocol
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              <li>
                <span className="text-sm text-muted/50">
                  Privacy Policy (coming soon)
                </span>
              </li>
              <li>
                <span className="text-sm text-muted/50">
                  Terms of Service (coming soon)
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} Erik Newton. All rights reserved.
          </p>
          <p className="text-xs text-muted">
            Reputation is portable. Your data belongs to you.
          </p>
        </div>
      </div>
    </footer>
  );
}
