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
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import { useData } from "../lib/data";
import { buildForecasting } from "../lib/aggregations";
import { useChartStyles } from "../lib/chart";
import { formatNumber } from "../lib/format";

export default function Forecasting() {
  const { filtered } = useData();
  const view = buildForecasting(filtered);
  const chart = useChartStyles();

  return (
    <div>
      <PageHeader
        title="Forecasting"
        description="Route, volume, staffing, and overtime forecasts for the next operating week."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {view.kpis.map((kpi) => (
          <StatCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Volume forecast" subtitle="Actuals, forecast, and 90% band" className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={view.series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#146eb4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#146eb4" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis dataKey="day" stroke={chart.axis} fontSize={12} />
              <YAxis stroke={chart.axis} fontSize={12} />
              <Tooltip contentStyle={chart.tooltip} />
              <Legend />
              <Area type="monotone" dataKey="range" stroke="none" fill="url(#band)" name="90% CI" />
              <Line type="monotone" dataKey="actual" stroke="#ff9900" strokeWidth={2} dot={{ r: 3 }} connectNulls name="Actual" />
              <Line type="monotone" dataKey="forecast" stroke="#00a8b5" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Forecast" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Staffing & overtime" subtitle="Headcount vs. premium hours" className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={view.table} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis dataKey="day" stroke={chart.axis} fontSize={12} />
              <YAxis yAxisId="left" stroke={chart.axis} fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke={chart.axis} fontSize={12} />
              <Tooltip contentStyle={chart.tooltip} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="staffing" stroke="#ff9900" strokeWidth={2} name="Staffing" />
              <Line yAxisId="left" type="monotone" dataKey="routes" stroke="#146eb4" strokeWidth={2} name="Routes" />
              <Line yAxisId="right" type="monotone" dataKey="overtime" stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 4" name="OT hours" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">14-day outlook</h3>
          <p className="text-xs text-slate-500">Volume, routes, staffing, overtime</p>
        </div>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Volume</th>
              <th className="px-3 py-2 font-medium">Band</th>
              <th className="px-3 py-2 font-medium">Routes</th>
              <th className="px-3 py-2 font-medium">Staffing</th>
              <th className="px-5 py-2 font-medium">OT hours</th>
            </tr>
          </thead>
          <tbody>
            {view.table.map((row) => (
              <tr key={row.date} className="border-t border-slate-200 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                  {row.day} {row.date.slice(5)}
                </td>
                <td className="px-3 py-3 tabular-nums">
                  {row.actual ? formatNumber(row.actual) : formatNumber(row.forecast)}
                  {row.actual ? "" : " *"}
                </td>
                <td className="px-3 py-3 tabular-nums text-slate-500">
                  {formatNumber(row.lower)} – {formatNumber(row.upper)}
                </td>
                <td className="px-3 py-3 tabular-nums">{row.routes}</td>
                <td className="px-3 py-3 tabular-nums">{row.staffing}</td>
                <td className="px-5 py-3 tabular-nums">{formatNumber(row.overtime, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
