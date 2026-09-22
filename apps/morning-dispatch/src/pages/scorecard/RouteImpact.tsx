import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "../../components/ChartCard";
import PageHeader from "../../components/PageHeader";
import MetricStatusBadge from "../../scorecard/components/MetricStatusBadge";
import { useChartStyles } from "../../lib/chart";
import { routeRows, weeklyScorecard } from "../../scorecard/data";
import { analyzeRoutes, highRiskRoutes } from "../../scorecard/engine";
import { METRIC_CATALOG, METRIC_KEYS, formatMetricValue } from "../../scorecard/metrics";

export default function RouteImpact() {
  const chartStyles = useChartStyles();
  const routes = useMemo(() => analyzeRoutes(routeRows, weeklyScorecard.metrics), []);
  const risks = highRiskRoutes(routes);
  const chart = [...routes]
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .map((route) => ({
      name: route.routeCode,
      score: route.compositeScore,
      highRisk: route.highRisk,
    }));

  return (
    <div>
      <PageHeader
        title="Route Impact Analysis"
        description="Route-level scorecard performance and high-risk lanes that are pulling the station down."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-1">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">High-risk routes</h3>
          <p className="text-xs text-slate-500">{risks.length} routes need intervention</p>
          <div className="mt-4 space-y-3">
            {risks.map((route) => (
              <div key={route.routeCode} className="rounded-lg border border-rose-500/15 bg-rose-500/5 px-3 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{route.routeCode}</p>
                  <MetricStatusBadge standing={route.standing} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{route.riskFactors.join(" · ")}</p>
                <p className="mt-2 text-xs text-rose-600 dark:text-rose-300/80">{route.riskReasons.join(" · ")}</p>
              </div>
            ))}
          </div>
        </div>

        <ChartCard
          title="Route composite score"
          subtitle="Equal-weight standing index"
          className="h-[28rem] lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.grid} />
              <XAxis type="number" domain={[40, 100]} stroke={chartStyles.axis} fontSize={12} />
              <YAxis type="category" dataKey="name" stroke={chartStyles.axis} fontSize={12} width={60} />
              <Tooltip contentStyle={chartStyles.tooltip} cursor={{ fill: chartStyles.cursor }} />
              <Bar dataKey="score" name="Composite" radius={[0, 4, 4, 0]}>
                {chart.map((row) => (
                  <Cell key={row.name} fill={row.highRisk ? "#f43f5e" : "#00a8b5"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Route scorecard</h3>
          <p className="text-xs text-slate-500">All tracked Amazon DSP metrics by route</p>
        </div>
        <table className="w-full min-w-[72rem] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Route</th>
              <th className="px-3 py-2 font-medium">Standing</th>
              <th className="px-3 py-2 font-medium">Risk</th>
              {METRIC_KEYS.map((key) => (
                <th key={key} className="px-3 py-2 font-medium">
                  {METRIC_CATALOG[key].label}
                </th>
              ))}
              <th className="px-5 py-2 font-medium">Composite</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <tr key={route.routeCode} className="border-t border-slate-200 dark:border-white/5">
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-900 dark:text-white">{route.routeCode}</p>
                  <p className="text-xs text-slate-500">{route.packagesDelivered.toLocaleString()} pkgs</p>
                </td>
                <td className="px-3 py-3">
                  <MetricStatusBadge standing={route.standing} />
                </td>
                <td className="px-3 py-3">
                  {route.highRisk ? (
                    <span className="text-xs font-medium text-rose-600 dark:text-rose-400">High</span>
                  ) : (
                    <span className="text-xs text-slate-500">Stable</span>
                  )}
                </td>
                {METRIC_KEYS.map((key) => (
                  <td key={key} className="px-3 py-3 text-slate-600 dark:text-slate-300">
                    {formatMetricValue(key, route.metrics[key])}
                  </td>
                ))}
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{route.compositeScore.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
