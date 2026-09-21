import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { formatDelta, formatMetricValue, isImproving, METRIC_CATALOG, evaluateStanding } from "../metrics";
import type { MetricKey } from "../types";
import MetricStatusBadge from "./MetricStatusBadge";

export default function ScorecardMetricCard({
  metricKey,
  value,
  previous,
}: {
  metricKey: MetricKey;
  value: number;
  previous?: number;
}) {
  const def = METRIC_CATALOG[metricKey];
  const standing = evaluateStanding(metricKey, value);
  const delta = previous === undefined ? 0 : value - previous;
  const improving = isImproving(metricKey, delta);
  const flat = Math.abs(delta) < 0.0001;
  const trendClass = flat ? "text-slate-400" : improving ? "text-emerald-400" : "text-rose-400";

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="stat-label">{def.label}</p>
          <p className="mt-1 text-xs text-slate-500">{def.fullName}</p>
        </div>
        <MetricStatusBadge standing={standing} />
      </div>
      <div className="mt-3 flex items-end justify-between">
        <span className="text-3xl font-semibold text-white">{formatMetricValue(metricKey, value)}</span>
        <span className={`flex items-center gap-1 text-sm font-medium ${trendClass}`}>
          {flat ? <Minus className="h-4 w-4" /> : improving ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          {previous === undefined ? "—" : formatDelta(metricKey, delta)}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Fantastic {def.polarity === "higher_better" ? "≥" : "≤"} {formatMetricValue(metricKey, def.fantastic)}
      </p>
    </div>
  );
}
