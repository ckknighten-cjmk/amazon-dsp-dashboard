"use client";

import { cn } from "@/lib/utils";

export function Sparkline({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 72;
  const h = 28;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const last = values[values.length - 1];
  const first = values[0];
  const up = last >= first;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("h-7 w-[72px]", className)}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={up ? "var(--great)" : "var(--poor)"}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}
