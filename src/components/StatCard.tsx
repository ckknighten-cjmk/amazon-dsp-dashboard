import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { Kpi } from "../types/database";
import { cn } from "../lib/cn";

const TrendIcon = ({ trend }: { trend: Kpi["trend"] }) => {
  if (trend === "up") return <ArrowUpRight className="h-4 w-4" />;
  if (trend === "down") return <ArrowDownRight className="h-4 w-4" />;
  return <Minus className="h-4 w-4" />;
};

export default function StatCard({ kpi }: { kpi: Kpi }) {
  const favorable = kpi.favorable ?? "up";
  const good = kpi.trend === "flat" ? null : kpi.trend === favorable;
  return (
    <div className="card p-5">
      <p className="stat-label">{kpi.label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {kpi.value}
        </span>
        <span
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            good === null && "text-slate-400",
            good === true && "text-emerald-500 dark:text-emerald-400",
            good === false && "text-rose-500 dark:text-rose-400",
          )}
        >
          <TrendIcon trend={kpi.trend} />
          {kpi.delta}
        </span>
      </div>
      {kpi.hint && <p className="mt-1 text-xs text-slate-500">{kpi.hint}</p>}
    </div>
  );
}
