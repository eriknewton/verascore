import type { SovereigntyLevel, TrustTier } from "./types";

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(dateString);
}

export function trustTierLabel(tier: TrustTier): string {
  switch (tier) {
    case "verified-sovereign":
      return "Verified Sovereign";
    case "verified-degraded":
      return "Verified Degraded";
    case "self-attested":
      return "Self-Attested";
    case "unverified":
      return "Unverified";
  }
}

export function trustTierColor(tier: TrustTier): string {
  switch (tier) {
    case "verified-sovereign":
      return "text-teal bg-teal/10 border-teal/30";
    case "verified-degraded":
      return "text-amber bg-amber/10 border-amber/30";
    case "self-attested":
      return "text-muted bg-muted/10 border-muted/30";
    case "unverified":
      return "text-red bg-red/10 border-red/30";
  }
}

export function statusColor(status: SovereigntyLevel): string {
  switch (status) {
    case "active":
      return "text-teal";
    case "degraded":
      return "text-amber";
    case "inactive":
      return "text-red";
    case "unverified":
      return "text-muted";
  }
}

export function statusBgColor(status: SovereigntyLevel): string {
  switch (status) {
    case "active":
      return "bg-teal/15 border-teal/30 text-teal";
    case "degraded":
      return "bg-amber/15 border-amber/30 text-amber";
    case "inactive":
      return "bg-red/15 border-red/30 text-red";
    case "unverified":
      return "bg-muted/15 border-muted/30 text-muted";
  }
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-teal";
  if (score >= 60) return "text-amber";
  if (score >= 30) return "text-amber-dim";
  return "text-red";
}

export function truncateDid(did: string): string {
  if (!did) return "No DID";
  if (did.length <= 30) return did;
  return `${did.slice(0, 20)}...${did.slice(-8)}`;
}
