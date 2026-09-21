import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "../../components/ChartCard";
import PageHeader from "../../components/PageHeader";
import MetricStatusBadge from "../../scorecard/components/MetricStatusBadge";
import { useChartStyles } from "../../lib/chart";
import { weeklyHistory } from "../../scorecard/data";
import { forecastMetrics, warningIndicators } from "../../scorecard/engine";
import { METRIC_CATALOG, METRIC_KEYS, formatMetricValue } from "../../scorecard/metrics";
import type { MetricKey } from "../../scorecard/types";
import { severityStyles } from "../../scorecard/ui";

export default function ScorecardForecast() {
  const chart = useChartStyles();
  const [metric, setMetric] = useState<MetricKey>("pod");
  const forecasts = useMemo(() => forecastMetrics(weeklyHistory, 4), []);
  const warnings = useMemo(() => warningIndicators(forecasts), [forecasts]);
  const selected = forecasts.find((item) => item.key === metric) ?? forecasts[0];

  const chartData = [
    ...selected.history.map((point) => ({
      label: point.label,
      actual: point.actual,
      forecast: undefined as number | undefined,
      lower: undefined as number | undefined,
      upper: undefined as number | undefined,
      range: undefined as [number, number] | undefined,
    })),
    ...selected.forecast.map((point) => ({
      label: point.label,
      actual: undefined as number | undefined,
      forecast: point.value,
      lower: point.lower,
      upper: point.upper,
      range: [point.lower, point.upper] as [number, number],
    })),
  ];

  const lastActual = selected.history[selected.history.length - 1];
  if (lastActual) {
    const firstForecast = chartData.find((row) => row.label === selected.forecast[0]?.label);
    const bridge = chartData.find((row) => row.label === lastActual.label);
    if (bridge) {
      bridge.forecast = lastActual.actual;
    }
    if (firstForecast) {
      firstForecast.forecast = selected.forecast[0]?.value;
    }
  }

  return (
    <div>
      <PageHeader
        title="Scorecard Forecasting"
        description="Projected four-week scorecard performance with warning indicators when a metric is about to change standing."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card p-5">
          <p className="stat-label">Critical warnings</p>
          <p className="mt-2 text-3xl font-semibold text-rose-600 dark:text-rose-400">
            {warnings.filter((item) => item.severity === "critical").length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Standing drops or Poor metrics</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">Watch list</p>
          <p className="mt-2 text-3xl font-semibold text-amber-600 dark:text-amber-400">
            {warnings.filter((item) => item.severity === "watch").length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Trending toward a tier change</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">Selected projection</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
            {formatMetricValue(selected.key, selected.forecast[selected.forecast.length - 1]?.value ?? 0)}
          </p>
          <div className="mt-2">
            <MetricStatusBadge standing={selected.projectedStanding} />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {warnings.map((warning) => (
          <div key={warning.id} className={`card border px-5 py-4 ${severityStyles[warning.severity]}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{warning.title}</p>
              <span className="text-xs uppercase tracking-wide">{warning.severity}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{warning.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <ChartCard
          title={`${METRIC_CATALOG[selected.key].fullName} forecast`}
          subtitle="History plus four-week projection and confidence band"
          className="h-96"
          action={
            <select
              value={metric}
              onChange={(event) => setMetric(event.target.value as MetricKey)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-white/10 dark:bg-ink-800 dark:text-slate-200"
            >
              {METRIC_KEYS.map((key) => (
                <option key={key} value={key}>
                  {METRIC_CATALOG[key].label}
                </option>
              ))}
            </select>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="scorecardBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#146eb4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#146eb4" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis dataKey="label" stroke={chart.axis} fontSize={12} />
              <YAxis stroke={chart.axis} fontSize={12} />
              <Tooltip contentStyle={chart.tooltip} />
              <Legend />
              <Area type="monotone" dataKey="range" stroke="none" fill="url(#scorecardBand)" name="90% band" />
              <Line type="monotone" dataKey="actual" stroke="#ff9900" strokeWidth={2} dot={{ r: 3 }} name="Actual" />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#00a8b5"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Forecast"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
