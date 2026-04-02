"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function DirectoryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/directory?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search agents by name, capability, or description..."
          defaultValue={searchParams.get("q") || ""}
          onChange={(e) => {
            const timeout = setTimeout(() => {
              updateParam("q", e.target.value);
            }, 300);
            return () => clearTimeout(timeout);
          }}
          className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      <select
        defaultValue={searchParams.get("tier") || ""}
        onChange={(e) => updateParam("tier", e.target.value)}
        className="px-4 py-2.5 rounded-lg bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
      >
        <option value="">All Trust Tiers</option>
        <option value="verified-sovereign">Verified Sovereign</option>
        <option value="verified-degraded">Verified Degraded</option>
        <option value="self-attested">Self-Attested</option>
        <option value="unverified">Unverified</option>
      </select>

      <select
        defaultValue={searchParams.get("sort") || "score"}
        onChange={(e) => updateParam("sort", e.target.value)}
        className="px-4 py-2.5 rounded-lg bg-surface border border-border text-foreground text-sm focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
      >
        <option value="score">Sort by Score</option>
        <option value="recent">Sort by Recent</option>
        <option value="sovereignty">Sort by Sovereignty</option>
      </select>
    </div>
  );
}
