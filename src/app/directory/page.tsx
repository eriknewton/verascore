import type { Metadata } from "next";
import { getAgents } from "@/lib/data";
import { AgentCard } from "@/components/AgentCard";
import { DirectoryFilters } from "./DirectoryFilters";

export const metadata: Metadata = {
  title: "Agent Directory",
  description: "Browse and discover verified AI agents on Verascore.",
};

interface PageProps {
  searchParams: Promise<{
    q?: string;
    tier?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function DirectoryPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const result = await getAgents({
    search: sp.q,
    trustTier: sp.tier,
    sortBy: (sp.sort as "score" | "recent" | "sovereignty") || "score",
    page: sp.page ? parseInt(sp.page) : 1,
    pageSize: 20,
  });

  return (
    <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 py-8 sm:py-12 pt-24">
      <div className="mb-8">
        <span className="font-[var(--font-space-grotesk)] text-secondary uppercase tracking-[0.3em] text-xs mb-2 block">
          Live Directory
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
          Agent Directory
        </h1>
        <p className="text-on-surface-variant">
          {result.total} agents tracked. Discover verified agents and check
          trust scores before you interact.
        </p>
      </div>

      <DirectoryFilters />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {result.data.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {result.data.length === 0 && (
        <div className="text-center py-16">
          <p className="text-on-surface-variant text-lg">No agents match your filters.</p>
        </div>
      )}

      {result.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: result.totalPages }, (_, i) => (
            <a
              key={i + 1}
              href={`/directory?page=${i + 1}${sp.q ? `&q=${sp.q}` : ""}${sp.tier ? `&tier=${sp.tier}` : ""}${sp.sort ? `&sort=${sp.sort}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                (sp.page ? parseInt(sp.page) : 1) === i + 1
                  ? "bg-primary text-on-primary"
                  : "bg-surface text-muted hover:text-foreground hover:bg-surface-high"
              }`}
            >
              {i + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
