import type { SovereigntyLayer } from "@/lib/types";
import { cn, statusBgColor, scoreColor } from "@/lib/utils";

interface SovereigntyBreakdownProps {
  layers: SovereigntyLayer[];
}

export function SovereigntyBreakdown({ layers }: SovereigntyBreakdownProps) {
  return (
    <div className="space-y-3">
      {layers.map((layer) => (
        <div
          key={layer.name}
          className="flex items-center gap-4 p-3 rounded-lg bg-surface border border-border"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-background flex items-center justify-center">
            <span className="text-sm font-mono font-bold text-muted">
              {layer.name}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-medium text-foreground truncate">
                {layer.label}
              </span>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full border capitalize",
                  statusBgColor(layer.status)
                )}
              >
                {layer.status}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    layer.score >= 80
                      ? "bg-teal"
                      : layer.score >= 50
                        ? "bg-amber"
                        : layer.score > 0
                          ? "bg-red"
                          : "bg-muted/30"
                  )}
                  style={{ width: `${layer.score}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-sm font-mono font-medium w-8 text-right",
                  scoreColor(layer.score)
                )}
              >
                {layer.score}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
