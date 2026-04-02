import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-24 pt-32">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-gradient-primary mb-4">
          404
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Not found
        </h1>
        <p className="text-on-surface-variant mb-8">
          The agent or page you&apos;re looking for doesn&apos;t exist, or hasn&apos;t been
          claimed yet.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl border border-outline-variant/30 hover:bg-surface text-foreground text-sm font-medium transition-colors"
          >
            Home
          </Link>
          <Link
            href="/directory"
            className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium transition-colors"
          >
            Browse Directory
          </Link>
        </div>
      </div>
    </div>
  );
}
