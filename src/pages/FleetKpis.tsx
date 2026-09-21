import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import { useData } from "../lib/data";
import { buildFleetReadiness } from "../lib/fleetReadiness";
import { useChartStyles } from "../lib/chart";
import { formatNumber, formatUsd } from "../lib/format";

export default function FleetKpis() {
  const { filtered } = useData();
  const view = buildFleetReadiness(filtered);
  const chart = useChartStyles();

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {view.kpiCards.map((kpi) => (
          <StatCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Fleet availability" subtitle="Ready share vs grounded vans · 14 days" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={view.availabilityTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis dataKey="day" stroke={chart.axis} fontSize={12} />
              <YAxis yAxisId="pct" domain={[70, 100]} stroke={chart.axis} fontSize={12} />
              <YAxis yAxisId="count" orientation="right" allowDecimals={false} stroke={chart.axis} fontSize={12} />
              <Tooltip contentStyle={chart.tooltip} />
              <Legend />
              <Line yAxisId="pct" type="monotone" dataKey="availability" stroke="#10b981" strokeWidth={2} name="Availability %" dot={false} />
              <Line yAxisId="count" type="monotone" dataKey="grounded" stroke="#f43f5e" strokeWidth={2} name="Grounded" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Repair costs" subtitle="Daily shop spend" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={view.costTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis dataKey="day" stroke={chart.axis} fontSize={12} />
              <YAxis stroke={chart.axis} fontSize={12} />
              <Tooltip contentStyle={chart.tooltip} cursor={{ fill: chart.cursor }} formatter={(value) => formatUsd(Number(value))} />
              <Bar dataKey="amount" fill="#ff9900" radius={[4, 4, 0, 0]} name="Repair cost" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Cost and downtime by van</h3>
          <p className="text-xs text-slate-500">
            MTD repair cost {formatUsd(view.repairTotal)} · {formatNumber(view.mtdMiles)} estimated miles ·{" "}
            {formatUsd(view.costPerMile, 2)} / mi
          </p>
        </div>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Van</th>
              <th className="px-3 py-2 font-medium">Station</th>
              <th className="px-3 py-2 font-medium">Repair cost</th>
              <th className="px-5 py-2 font-medium">Downtime</th>
            </tr>
          </thead>
          <tbody>
            {view.costByVehicle.map((row) => (
              <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">
                <td className="px-5 py-3">
                  <Link to={`/fleet/vehicles/${row.id}`} className="font-medium text-slate-900 hover:text-brand-blue dark:text-white">
                    {row.vanId}
                  </Link>
                </td>
                <td className="px-3 py-3">{row.stationCode}</td>
                <td className="px-3 py-3 tabular-nums">{formatUsd(row.amount)}</td>
                <td className="px-5 py-3 tabular-nums">{formatNumber(row.downtimeHours, 1)}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
