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
      return "text-secondary bg-secondary/10";
    case "verified-degraded":
      return "text-tertiary bg-tertiary/10";
    case "self-attested":
      return "text-muted bg-muted/10";
    case "unverified":
      return "text-error bg-error/10";
  }
}

export function statusColor(status: SovereigntyLevel): string {
  switch (status) {
    case "active":
      return "text-secondary";
    case "degraded":
      return "text-tertiary";
    case "inactive":
      return "text-error";
    case "unverified":
      return "text-muted";
  }
}

export function statusBgColor(status: SovereigntyLevel): string {
  switch (status) {
    case "active":
      return "bg-secondary/15 text-secondary";
    case "degraded":
      return "bg-tertiary/15 text-tertiary";
    case "inactive":
      return "bg-error/15 text-error";
    case "unverified":
      return "bg-muted/15 text-muted";
  }
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-secondary";
  if (score >= 60) return "text-tertiary";
  if (score >= 30) return "text-tertiary";
  return "text-error";
}

export function activityBucket(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const hours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (hours < 24) return "Active today";
  if (hours < 24 * 7) return "Active this week";
  if (hours < 24 * 30) return "Active this month";
  return "Inactive";
}

export function truncateDid(did: string): string {
  if (!did) return "No DID";
  if (did.length <= 30) return did;
  return `${did.slice(0, 20)}...${did.slice(-8)}`;
}
