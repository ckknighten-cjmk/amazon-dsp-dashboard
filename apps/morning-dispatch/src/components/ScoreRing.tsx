import type { ScoreStanding } from "../types/database";
import { cn } from "../lib/cn";

const colors: Record<ScoreStanding, string> = {
  fantastic: "stroke-emerald-500",
  great: "stroke-sky-500",
  fair: "stroke-amber-500",
  poor: "stroke-rose-500",
};

export default function ScoreRing({
  value,
  max = 100,
  label,
  standing = "great",
}: {
  value: number;
  max?: number;
  label: string;
  standing?: ScoreStanding;
}) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 88 88" className="h-20 w-20 shrink-0">
        <circle cx="44" cy="44" r={radius} className="fill-none stroke-slate-200 dark:stroke-white/10" strokeWidth="8" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          className={cn("fill-none", colors[standing])}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          transform="rotate(-90 44 44)"
        />
        <text
          x="44"
          y="48"
          textAnchor="middle"
          className="fill-slate-900 text-[14px] font-semibold dark:fill-white"
        >
          {max === 100 ? `${Math.round(value)}` : Math.round(value)}
        </text>
      </svg>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
    </div>
  );
}
