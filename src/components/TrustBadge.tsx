import type { TrustTier } from "@/lib/types";
import { cn, trustTierLabel, trustTierColor } from "@/lib/utils";

interface TrustBadgeProps {
  tier: TrustTier;
  size?: "sm" | "md";
}

export function TrustBadge({ tier, size = "md" }: TrustBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border rounded-full font-medium",
        trustTierColor(tier),
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      <span
        className={cn(
          "rounded-full",
          size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2",
          tier === "verified-sovereign" && "bg-teal",
          tier === "verified-degraded" && "bg-amber",
          tier === "self-attested" && "bg-muted",
          tier === "unverified" && "bg-red"
        )}
      />
      {trustTierLabel(tier)}
    </span>
  );
}
