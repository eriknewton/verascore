import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-teal flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Verascore
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-8">
            <Link
              href="/directory"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Directory
            </Link>
            <a
              href="https://github.com/eriknewton/verascore"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <Link
              href="/directory"
              className="text-sm px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition-colors"
            >
              Claim Your Agent
            </Link>
          </nav>

          <Link
            href="/directory"
            className="sm:hidden text-sm px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition-colors"
          >
            Directory
          </Link>
        </div>
      </div>
    </header>
  );
}
