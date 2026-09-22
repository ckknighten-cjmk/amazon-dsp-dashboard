import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import ScoreRing from "../components/ScoreRing";
import { useData } from "../lib/data";
import { buildExecutive, STANDING_LABEL } from "../lib/aggregations";
import { useChartStyles } from "../lib/chart";
import { chartPalette } from "../data/seed";
import { standingClass } from "../lib/statusStyles";
import { cn } from "../lib/cn";
import { formatPct } from "../lib/format";
import type { ScoreStanding } from "../types/database";

export default function ExecutiveDashboard() {
  const { filtered } = useData();
  const view = buildExecutive(filtered);
  const chart = useChartStyles();

  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        description="Revenue, profit, DCR, attendance, safety, and Amazon scorecard standing across the network."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {view.kpis.map((kpi) => (
          <StatCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          title="Amazon Scorecard"
          subtitle={`${STANDING_LABEL[view.standing]} standing · week of ${view.currentSc[0]?.week_start ?? "—"}`}
          className="xl:col-span-2"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {view.scorecardMetrics.map((metric) => (
              <div key={metric.label} className="rounded-lg border border-slate-200 p-3 dark:border-white/5">
                <p className="text-xs text-slate-500">{metric.label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{metric.value}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">{metric.target}</span>
                  <span className={cn("badge", standingClass[metric.status as ScoreStanding])}>
                    {STANDING_LABEL[metric.status as ScoreStanding]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Health rings" subtitle="Network snapshot">
          <div className="flex flex-col gap-4">
            <ScoreRing
              value={Number.parseFloat(view.kpis[2].value)}
              label="Delivery completion rate"
              standing={view.scorecardMetrics[0].status}
            />
            <ScoreRing
              value={Number.parseFloat(view.kpis[3].value)}
              label="Attendance / reliability"
              standing={view.scorecardMetrics[6].status}
            />
            <ScoreRing
              value={Number.parseFloat(view.kpis[4].value.replace(/,/g, ""))}
              max={1000}
              label="Safety score"
              standing={view.scorecardMetrics[5].status}
            />
          </div>
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Deliveries: Planned vs. Actual" subtitle="Trailing 7 days" className="lg:col-span-2 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={view.volumeDays} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="delivered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff9900" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ff9900" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis dataKey="day" stroke={chart.axis} fontSize={12} />
              <YAxis stroke={chart.axis} fontSize={12} />
              <Tooltip contentStyle={chart.tooltip} />
              <Area type="monotone" dataKey="planned" stroke="#146eb4" fill="transparent" strokeDasharray="4 4" name="Planned" />
              <Area type="monotone" dataKey="delivered" stroke="#ff9900" fill="url(#delivered)" name="Delivered" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Volume by Station" subtitle="Packages today" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={view.stationMix} dataKey="value" nameKey="code" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {view.stationMix.map((_, i) => (
                  <Cell key={i} fill={chartPalette[i % chartPalette.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={chart.tooltip} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Station scorecards</h3>
          <p className="text-xs text-slate-500">Amazon weekly KPIs</p>
        </div>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Station</th>
              <th className="px-3 py-2 font-medium">Standing</th>
              <th className="px-3 py-2 font-medium">DCR</th>
              <th className="px-3 py-2 font-medium">Safety</th>
              <th className="px-3 py-2 font-medium">Attendance</th>
              <th className="px-5 py-2 font-medium">Today volume</th>
            </tr>
          </thead>
          <tbody>
            {view.stationMix.map((station) => (
              <tr key={station.id} className="border-t border-slate-200 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{station.name}</td>
                <td className="px-3 py-3">
                  <span className={cn("badge", standingClass[station.standing])}>{STANDING_LABEL[station.standing]}</span>
                </td>
                <td className="px-3 py-3 tabular-nums">{formatPct(station.dcr)}</td>
                <td className="px-3 py-3 tabular-nums">{Math.round(station.safety)}</td>
                <td className="px-3 py-3 tabular-nums">{formatPct(station.attendance)}</td>
                <td className="px-5 py-3 tabular-nums">{station.value.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
