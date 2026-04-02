import Link from "next/link";

export function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#0d131e]/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
      <div className="max-w-screen-2xl mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-xl font-bold tracking-tight text-primary">
              Verascore
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-8">
            <Link
              href="/directory"
              className="font-[var(--font-space-grotesk)] text-xs uppercase tracking-widest text-muted hover:text-foreground transition-colors"
            >
              Directory
            </Link>
            <a
              href="https://github.com/eriknewton/sanctuary-framework"
              target="_blank"
              rel="noopener noreferrer"
              className="font-[var(--font-space-grotesk)] text-xs uppercase tracking-widest text-muted hover:text-foreground transition-all hover:bg-white/5 px-3 py-1 rounded-lg"
            >
              Sanctuary Framework
            </a>
            <a
              href="https://github.com/eriknewton/concordia-protocol"
              target="_blank"
              rel="noopener noreferrer"
              className="font-[var(--font-space-grotesk)] text-xs uppercase tracking-widest text-muted hover:text-foreground transition-all hover:bg-white/5 px-3 py-1 rounded-lg"
            >
              Concordia Protocol
            </a>
            <Link
              href="/directory"
              className="px-6 py-2 rounded-full bg-primary-container text-[#00285c] font-[var(--font-space-grotesk)] text-xs font-bold uppercase tracking-widest hover:scale-95 transition-all duration-150"
            >
              Claim Your Agent
            </Link>
          </nav>

          <Link
            href="/directory"
            className="sm:hidden text-sm px-4 py-1.5 rounded-full bg-primary text-on-primary font-medium transition-colors"
          >
            Directory
          </Link>
        </div>
      </div>
      <div className="nav-gradient-border" />
    </header>
  );
}
