import {
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
import StatCard from "../../components/StatCard";
import { useData } from "../../lib/data";
import { buildStaffingForecast } from "../../lib/workforce";
import { useChartStyles } from "../../lib/chart";
import { cn } from "../../lib/cn";
import { routeStatusClass, routeStatusLabel } from "../../lib/statusStyles";

export default function StaffingForecast() {
  const { filtered } = useData();
  const view = buildStaffingForecast(filtered);
  const chart = useChartStyles();

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {view.kpis.map((kpi) => (
          <StatCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Staffing vs. routes" subtitle="Available DAs against today's wave scale" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={view.series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis dataKey="day" stroke={chart.axis} fontSize={12} />
              <YAxis stroke={chart.axis} fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={chart.tooltip} />
              <Legend />
              <Line type="monotone" dataKey="plannedRoutes" stroke="#146eb4" strokeWidth={2} name="Routes" />
              <Line type="monotone" dataKey="available" stroke="#ff9900" strokeWidth={2} name="Available DAs" />
              <Line type="monotone" dataKey="gap" stroke="#f43f5e" strokeWidth={2} strokeDasharray="4 4" name="Gap" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="card overflow-x-auto">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Open routes</h3>
            <p className="text-xs text-slate-500">Unassigned or not launched — cover before wave</p>
          </div>
          {view.openRoutes.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">Every route has a DA assigned.</p>
          ) : (
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Route</th>
                  <th className="px-3 py-2 font-medium">Station</th>
                  <th className="px-3 py-2 font-medium">Stops</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {view.openRoutes.map((route) => (
                  <tr key={route.id} className="border-t border-slate-200 dark:border-white/5">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{route.route_code}</p>
                      <p className="text-xs text-slate-500">{route.reason}</p>
                    </td>
                    <td className="px-3 py-3">{route.stationCode}</td>
                    <td className="px-3 py-3 tabular-nums">{route.stops_planned}</td>
                    <td className="px-5 py-3">
                      <span className={cn("badge", routeStatusClass[route.status])}>{routeStatusLabel[route.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Station shortages</h3>
          <p className="text-xs text-slate-500">Today's routes versus DAs not on PTO / call-out / no-show</p>
        </div>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Station</th>
              <th className="px-3 py-2 font-medium">Roster</th>
              <th className="px-3 py-2 font-medium">Available</th>
              <th className="px-3 py-2 font-medium">Routes</th>
              <th className="px-3 py-2 font-medium">Open</th>
              <th className="px-3 py-2 font-medium">PTO</th>
              <th className="px-5 py-2 font-medium">Gap</th>
            </tr>
          </thead>
          <tbody>
            {view.stationRows.map((row) => (
              <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                  {row.code} · {row.name}
                </td>
                <td className="px-3 py-3 tabular-nums">{row.roster}</td>
                <td className="px-3 py-3 tabular-nums">{row.available}</td>
                <td className="px-3 py-3 tabular-nums">{row.routes}</td>
                <td className="px-3 py-3 tabular-nums">{row.open}</td>
                <td className="px-3 py-3 tabular-nums">{row.ptoOut}</td>
                <td className={cn("px-5 py-3 tabular-nums font-medium", row.gap > 0 ? "text-rose-500" : "text-emerald-500")}>
                  {row.gap > 0 ? `+${row.gap}` : row.gap}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
