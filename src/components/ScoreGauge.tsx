"use client";

import { cn, scoreColor } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function ScoreGauge({ score, size = "md", label }: ScoreGaugeProps) {
  const dimensions = {
    sm: { width: 80, stroke: 6, fontSize: "text-lg", radius: 34 },
    md: { width: 120, stroke: 8, fontSize: "text-3xl", radius: 50 },
    lg: { width: 160, stroke: 10, fontSize: "text-4xl", radius: 68 },
  };

  const { width, stroke, fontSize, radius } = dimensions[size];
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = width / 2;

  const gradientId = `gauge-gradient-${size}-${score}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width, height: width }}>
        <svg
          width={width}
          height={width}
          viewBox={`0 0 ${width} ${width}`}
          className="-rotate-90"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop
                offset="0%"
                stopColor={score >= 60 ? "#14b8a6" : "#ef4444"}
              />
              <stop
                offset="100%"
                stopColor={score >= 80 ? "#3b82f6" : score >= 60 ? "#f59e0b" : "#ef4444"}
              />
            </linearGradient>
          </defs>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-border"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", fontSize, scoreColor(score))}>
            {score}
          </span>
        </div>
      </div>
      {label && <span className="text-xs text-muted uppercase tracking-wider">{label}</span>}
    </div>
  );
}
