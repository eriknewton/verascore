import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-24">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold bg-gradient-to-r from-accent to-teal bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Not found
        </h1>
        <p className="text-muted mb-8">
          The agent or page you&apos;re looking for doesn&apos;t exist, or hasn&apos;t been
          claimed yet.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-lg border border-border hover:border-border-light text-foreground text-sm font-medium transition-colors"
          >
            Home
          </Link>
          <Link
            href="/directory"
            className="px-6 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
          >
            Browse Directory
          </Link>
        </div>
      </div>
    </div>
  );
}
