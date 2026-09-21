import { useMemo, useState } from "react";
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
import { driverRows, weeklyScorecard } from "../../scorecard/data";
import { analyzeDrivers, atRiskDrivers, topPerformers } from "../../scorecard/engine";
import { METRIC_CATALOG, METRIC_KEYS, formatMetricValue } from "../../scorecard/metrics";
import type { MetricKey } from "../../scorecard/types";
import { formatContribution, tooltipStyle } from "../../scorecard/ui";

export default function DriverImpact() {
  const [metric, setMetric] = useState<MetricKey>("dcr");
  const drivers = useMemo(() => analyzeDrivers(driverRows, weeklyScorecard.metrics), []);
  const leaders = topPerformers(drivers);
  const risks = atRiskDrivers(drivers);

  const contributionChart = [...drivers]
    .sort((a, b) => b.contributions[metric] - a.contributions[metric])
    .map((driver) => ({
      name: driver.driverName.split(" ").slice(-1)[0],
      contribution: driver.contributions[metric],
    }));

  return (
    <div>
      <PageHeader
        title="Driver Impact Analysis"
        description="How each driver lifts or drags DCR, POD, CDF, FICO, Safety, DNR, DSC, and CE."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white">Top performers</h3>
          <p className="text-xs text-slate-500">Highest composite, not at risk</p>
          <div className="mt-4 space-y-3">
            {leaders.map((driver, index) => (
              <div key={driver.driverId} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    #{index + 1} {driver.driverName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {driver.primaryRoute} · {driver.packagesDelivered.toLocaleString()} pkgs
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-400">{driver.compositeScore.toFixed(0)}</p>
                  <MetricStatusBadge standing={driver.standing} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white">At-risk drivers</h3>
          <p className="text-xs text-slate-500">Poor metrics, Fair safety, or composite below Great</p>
          <div className="mt-4 space-y-3">
            {risks.map((driver) => (
              <div key={driver.driverId} className="rounded-lg bg-white/5 px-3 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">{driver.driverName}</p>
                  <MetricStatusBadge standing={driver.standing} />
                </div>
                <p className="mt-1 text-xs text-rose-300/80">{driver.riskReasons.join(" · ")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <ChartCard
          title="Driver contribution"
          subtitle={`${METRIC_CATALOG[metric].fullName} vs. fleet, volume-weighted`}
          className="h-80"
          action={
            <select
              value={metric}
              onChange={(event) => setMetric(event.target.value as MetricKey)}
              className="rounded-md border border-white/10 bg-ink-800 px-2 py-1 text-xs text-slate-200"
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
            <BarChart data={contributionChart} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="contribution" name="Contribution" radius={[4, 4, 0, 0]}>
                {contributionChart.map((row) => (
                  <Cell key={row.name} fill={row.contribution >= 0 ? "#00a8b5" : "#f43f5e"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <div className="border-b border-white/5 px-5 py-4">
          <h3 className="text-sm font-semibold text-white">Driver scorecard contributions</h3>
          <p className="text-xs text-slate-500">Positive contribution lifts the fleet metric</p>
        </div>
        <table className="w-full min-w-[72rem] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Driver</th>
              <th className="px-3 py-2 font-medium">Route</th>
              <th className="px-3 py-2 font-medium">Standing</th>
              {METRIC_KEYS.map((key) => (
                <th key={key} className="px-3 py-2 font-medium">
                  {METRIC_CATALOG[key].label}
                </th>
              ))}
              <th className="px-5 py-2 font-medium">Impact ({METRIC_CATALOG[metric].label})</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => (
              <tr key={driver.driverId} className="border-t border-white/5">
                <td className="px-5 py-3">
                  <p className="font-medium text-white">{driver.driverName}</p>
                  <p className="text-xs text-slate-500">{driver.driverId}</p>
                </td>
                <td className="px-3 py-3 text-slate-300">{driver.primaryRoute}</td>
                <td className="px-3 py-3">
                  <MetricStatusBadge standing={driver.standing} />
                </td>
                {METRIC_KEYS.map((key) => (
                  <td key={key} className="px-3 py-3 text-slate-300">
                    {formatMetricValue(key, driver.metrics[key])}
                  </td>
                ))}
                <td className={`px-5 py-3 font-medium ${driver.contributions[metric] >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {formatContribution(driver.contributions[metric])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
