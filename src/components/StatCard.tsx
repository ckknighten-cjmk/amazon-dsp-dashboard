import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { Kpi } from "../data/mockData";

const trendStyles: Record<Kpi["trend"], string> = {
  up: "text-emerald-400",
  down: "text-rose-400",
  flat: "text-slate-400",
};

const TrendIcon = ({ trend }: { trend: Kpi["trend"] }) => {
  if (trend === "up") return <ArrowUpRight className="h-4 w-4" />;
  if (trend === "down") return <ArrowDownRight className="h-4 w-4" />;
  return <Minus className="h-4 w-4" />;
};

export default function StatCard({ kpi }: { kpi: Kpi }) {
  return (
    <div className="card p-5">
      <p className="stat-label">{kpi.label}</p>
      <div className="mt-2 flex items-end justify-between">
        <span className="text-3xl font-semibold text-white">{kpi.value}</span>
        <span className={`flex items-center gap-1 text-sm font-medium ${trendStyles[kpi.trend]}`}>
          <TrendIcon trend={kpi.trend} />
          {kpi.delta}
        </span>
      </div>
      {kpi.hint && <p className="mt-1 text-xs text-slate-500">{kpi.hint}</p>}
    </div>
  );
}
