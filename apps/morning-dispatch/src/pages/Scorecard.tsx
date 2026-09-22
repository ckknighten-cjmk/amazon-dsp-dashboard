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
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import { useData } from "../lib/data";
import { buildScorecard, STANDING_LABEL } from "../lib/aggregations";
import { useChartStyles } from "../lib/chart";
import { cn } from "../lib/cn";
import { formatPct } from "../lib/format";
import { standingClass } from "../lib/statusStyles";

export default function Scorecard() {
  const { filtered } = useData();
  const view = buildScorecard(filtered);
  const chart = useChartStyles();

  return (
    <div>
      <PageHeader
        title="Amazon DSP Scorecard"
        description="DCR, POD, CDF, Safety, FICO, and weekly standing trends from the Amazon scorecard."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {view.kpis.map((kpi) => (
          <StatCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {view.tiles.map((tile) => (
          <div key={tile.label} className="card p-4">
            <p className="text-xs text-slate-500">{tile.label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{tile.value}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">{tile.target}</span>
              <span className={cn("badge", standingClass[tile.status])}>{STANDING_LABEL[tile.status]}</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">{tile.delta} vs last week</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard title="Weekly scorecard trends" subtitle="Network averages · 8 weeks" className="h-80 xl:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={view.weeklyTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis dataKey="week" stroke={chart.axis} fontSize={12} />
              <YAxis yAxisId="pct" domain={[96, 100]} stroke={chart.axis} fontSize={12} />
              <YAxis yAxisId="fico" orientation="right" domain={[780, 920]} stroke={chart.axis} fontSize={12} />
              <Tooltip contentStyle={chart.tooltip} />
              <Legend />
              <Line yAxisId="pct" type="monotone" dataKey="dcr" stroke="#ff9900" strokeWidth={2} name="DCR" dot={false} />
              <Line yAxisId="pct" type="monotone" dataKey="pod" stroke="#146eb4" strokeWidth={2} name="POD" dot={false} />
              <Line yAxisId="fico" type="monotone" dataKey="fico" stroke="#8b5cf6" strokeWidth={2} name="FICO" dot={false} />
              <Line yAxisId="fico" type="monotone" dataKey="safety" stroke="#00a8b5" strokeWidth={2} name="Safety" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Lowest FICO drivers</h3>
            <p className="text-xs text-slate-500">Mentor score watchlist</p>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-white/5">
            {view.driverFico.slice(0, 6).map((driver) => (
              <li key={driver.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{driver.name}</p>
                  <p className="text-xs text-slate-500">
                    {driver.stationCode} · DCR {formatPct(driver.dcr)}
                  </p>
                </div>
                <span className={cn("badge", driver.fico < 780 ? "badge-danger" : "badge-warning")}>{driver.fico}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Station scorecards</h3>
          <p className="text-xs text-slate-500">Current Amazon week</p>
        </div>
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Station</th>
              <th className="px-3 py-2 font-medium">Standing</th>
              <th className="px-3 py-2 font-medium">DCR</th>
              <th className="px-3 py-2 font-medium">POD</th>
              <th className="px-3 py-2 font-medium">CDF</th>
              <th className="px-3 py-2 font-medium">Safety</th>
              <th className="px-3 py-2 font-medium">FICO</th>
              <th className="px-3 py-2 font-medium">DNR</th>
              <th className="px-5 py-2 font-medium">CE</th>
            </tr>
          </thead>
          <tbody>
            {view.stationRows.map((row) => (
              <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                  {row.code} · {row.name}
                </td>
                <td className="px-3 py-3">
                  <span className={cn("badge capitalize", standingClass[row.standing])}>{row.standing}</span>
                </td>
                <td className="px-3 py-3 tabular-nums">{formatPct(row.dcr)}</td>
                <td className="px-3 py-3 tabular-nums">{formatPct(row.pod)}</td>
                <td className="px-3 py-3 tabular-nums">{row.cdf.toFixed(2)}</td>
                <td className="px-3 py-3 tabular-nums">{row.safety.toFixed(0)}</td>
                <td className="px-3 py-3 tabular-nums">{row.fico}</td>
                <td className="px-3 py-3 tabular-nums">{formatPct(row.dnr, 2)}</td>
                <td className="px-5 py-3 tabular-nums">{row.ce}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
