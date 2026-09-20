import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
import { useData } from "../lib/data";
import { buildFinancial } from "../lib/aggregations";
import { useChartStyles } from "../lib/chart";
import { chartPalette } from "../data/seed";
import { formatPct, formatUsdCompact } from "../lib/format";

export default function Financial() {
  const { filtered } = useData();
  const view = buildFinancial(filtered);
  const chart = useChartStyles();

  return (
    <div>
      <PageHeader
        title="Financial Dashboard"
        description="Revenue, labor, overtime, fuel, vehicle cost, and station-level profitability."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {view.kpis.map((kpi) => (
          <StatCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Revenue vs. cost" subtitle="Monthly ($)" className="h-80 lg:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={view.monthly} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis dataKey="month" stroke={chart.axis} fontSize={12} />
              <YAxis stroke={chart.axis} fontSize={12} />
              <Tooltip contentStyle={chart.tooltip} cursor={{ fill: chart.cursor }} />
              <Legend />
              <Bar dataKey="revenue" fill="#ff9900" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="cost" fill="#146eb4" radius={[4, 4, 0, 0]} name="Cost" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cost breakdown" subtitle="Share of MTD spend" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={view.costBreakdown} dataKey="value" nameKey="name" outerRadius={95} label={(entry) => `${entry.value}%`}>
                {view.costBreakdown.map((_, i) => (
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
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Station profitability</h3>
          <p className="text-xs text-slate-500">Month to date</p>
        </div>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Station</th>
              <th className="px-3 py-2 font-medium">Revenue</th>
              <th className="px-3 py-2 font-medium">Labor</th>
              <th className="px-3 py-2 font-medium">Overtime</th>
              <th className="px-3 py-2 font-medium">Fuel</th>
              <th className="px-3 py-2 font-medium">Vehicle</th>
              <th className="px-5 py-2 font-medium">Margin</th>
            </tr>
          </thead>
          <tbody>
            {view.stationProfit.map((row) => (
              <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                  {row.code} · {row.name}
                </td>
                <td className="px-3 py-3 tabular-nums">{formatUsdCompact(row.revenue)}</td>
                <td className="px-3 py-3 tabular-nums">{formatUsdCompact(row.labor)}</td>
                <td className="px-3 py-3 tabular-nums">{formatUsdCompact(row.overtime)}</td>
                <td className="px-3 py-3 tabular-nums">{formatUsdCompact(row.fuel)}</td>
                <td className="px-3 py-3 tabular-nums">{formatUsdCompact(row.vehicle)}</td>
                <td className="px-5 py-3 tabular-nums text-emerald-600 dark:text-emerald-400">{formatPct(row.margin * 100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
