import PageHeader from "../components/PageHeader";
import { useData } from "../lib/data";
import { buildInsights } from "../lib/aggregations";
import { cn } from "../lib/cn";
import type { InsightCategory, InsightSeverity } from "../types/database";

const severityClass: Record<InsightSeverity, string> = {
  critical: "badge-danger",
  warning: "badge-warning",
  watch: "badge-info",
};

const categoryLabel: Record<InsightCategory, string> = {
  staffing: "Staffing",
  overtime: "Overtime",
  routes: "Routes",
  safety: "High-risk drivers",
  profitability: "Profitability",
};

export default function Insights() {
  const { filtered } = useData();
  const view = buildInsights(filtered);

  return (
    <div>
      <PageHeader
        title="AI Insights"
        description="Operational recommendations for staffing shortages, overtime risk, underperforming routes, high-risk drivers, and P&L."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Summary label="Recommendations" value={String(view.insights.length)} />
        <Summary label="Critical" value={String(view.counts.critical ?? 0)} warn={(view.counts.critical ?? 0) > 0} />
        <Summary label="Warning" value={String(view.counts.warning ?? 0)} />
        <Summary label="Watch" value={String(view.counts.watch ?? 0)} />
        <Summary label="High-risk drivers" value={String(view.counts.safety ?? 0)} className="col-span-2 lg:col-span-1" />
      </div>

      <ul className="mt-4 space-y-3">
        {view.insights.map((insight) => (
          <li key={insight.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("badge capitalize", severityClass[insight.severity])}>{insight.severity}</span>
                  <span className="badge badge-neutral">{categoryLabel[insight.category]}</span>
                  {insight.stationCode && <span className="text-xs text-slate-500">{insight.stationCode}</span>}
                </div>
                <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{insight.title}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{insight.recommendation}</p>
                <p className="mt-2 text-xs text-slate-500">{insight.metric}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Summary({
  label,
  value,
  warn,
  className,
}: {
  label: string;
  value: string;
  warn?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("card p-5", className)}>
      <p className="stat-label">{label}</p>
      <p className={cn("mt-2 text-3xl font-semibold", warn ? "text-rose-500" : "text-slate-900 dark:text-white")}>{value}</p>
    </div>
  );
}
