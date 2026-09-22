import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "../../components/ChartCard";
import PageHeader from "../../components/PageHeader";
import ScorecardMetricCard from "../../scorecard/components/ScorecardMetricCard";
import MetricStatusBadge from "../../scorecard/components/MetricStatusBadge";
import { useChartStyles } from "../../lib/chart";
import { historyFor, scorecardFor } from "../../scorecard/data";
import { METRIC_CATALOG, METRIC_KEYS, evaluateStanding, formatMetricValue, qualityIndex } from "../../scorecard/metrics";
import type { MetricKey, PeriodType } from "../../scorecard/types";

const TREND_COLORS: Record<MetricKey, string> = {
  dcr: "#ff9900",
  pod: "#146eb4",
  cdf: "#00a8b5",
  fico: "#8b5cf6",
  safety: "#f43f5e",
  dnr: "#f59e0b",
  dsc: "#22c55e",
  ce: "#38bdf8",
};

export default function ExecutiveScorecard() {
  const chart = useChartStyles();
  const [period, setPeriod] = useState<PeriodType>("weekly");
  const [visible, setVisible] = useState<MetricKey[]>(["dcr", "pod", "cdf", "safety"]);

  const scorecard = scorecardFor(period);
  const history = historyFor(period);
  const previous = history.length > 1 ? history[history.length - 2] : undefined;

  const trendData = useMemo(
    () =>
      history.map((point) => {
        const indexed = { label: point.label } as { label: string } & Record<MetricKey, number>;
        METRIC_KEYS.forEach((key) => {
          indexed[key] = qualityIndex(key, point.metrics[key]);
        });
        return indexed;
      }),
    [history],
  );

  const standingCounts = METRIC_KEYS.reduce(
    (counts, key) => {
      counts[evaluateStanding(key, scorecard.metrics[key])] += 1;
      return counts;
    },
    { fantastic: 0, great: 0, fair: 0, poor: 0 },
  );

  const toggleMetric = (key: MetricKey) => {
    setVisible((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  };

  return (
    <div>
      <PageHeader
        title="Executive Scorecard"
        description={`${scorecard.stationName} · ${scorecard.label}. Weekly and monthly Amazon DSP scorecard with trend analysis.`}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-white/5">
          {(["weekly", "monthly"] as PeriodType[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPeriod(option)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
                period === option
                  ? "bg-brand-blue/20 text-slate-900 dark:bg-brand-blue/30 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-slate-500">
            Composite{" "}
            <span className="font-semibold text-slate-900 dark:text-white">{scorecard.compositeScore.toFixed(0)}</span>
          </span>
          <MetricStatusBadge standing={scorecard.standing} />
          <span className="text-slate-500">{scorecard.packagesDelivered.toLocaleString()} packages</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {METRIC_KEYS.map((key) => (
          <ScorecardMetricCard
            key={key}
            metricKey={key}
            value={scorecard.metrics[key]}
            previous={previous?.metrics[key]}
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Scorecard Trend Analysis"
          subtitle={`${period === "weekly" ? "Trailing 12 weeks" : "Trailing 6 months"} · quality index (Fantastic = 100)`}
          className="h-[28rem] lg:col-span-2"
          action={
            <div className="flex flex-wrap justify-end gap-1">
              {METRIC_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleMetric(key)}
                  className={`rounded px-2 py-1 text-[11px] font-medium ${
                    visible.includes(key)
                      ? "bg-slate-200 text-slate-900 dark:bg-white/10 dark:text-white"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {METRIC_CATALOG[key].label}
                </button>
              ))}
            </div>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis dataKey="label" stroke={chart.axis} fontSize={12} />
              <YAxis stroke={chart.axis} fontSize={12} domain={[40, 100]} />
              <Tooltip contentStyle={chart.tooltip} />
              <Legend />
              {visible.map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={TREND_COLORS[key]}
                  strokeWidth={2}
                  dot={false}
                  name={METRIC_CATALOG[key].label}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Standing mix</h3>
          <p className="text-xs text-slate-500">Current {period} scorecard</p>
          <div className="mt-4 space-y-3">
            {(["fantastic", "great", "fair", "poor"] as const).map((standing) => (
              <div key={standing} className="flex items-center justify-between">
                <MetricStatusBadge standing={standing} />
                <span className="text-sm text-slate-900 dark:text-white">{standingCounts[standing]} metrics</span>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2 border-t border-slate-200 pt-4 dark:border-white/5">
            {METRIC_KEYS.map((key) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{METRIC_CATALOG[key].label}</span>
                <span className="text-slate-900 dark:text-white">{formatMetricValue(key, scorecard.metrics[key])}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
