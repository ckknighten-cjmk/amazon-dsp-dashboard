import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../components/PageHeader";
import ChartCard from "../components/ChartCard";
import ProgressBar from "../components/ProgressBar";
import { useData } from "../lib/data";
import { buildLiveOperations } from "../lib/aggregations";
import { useChartStyles } from "../lib/chart";
import { formatPct } from "../lib/format";
import { cn } from "../lib/cn";
import {
  driverStatusClass,
  driverStatusLabel,
  rescueStatusClass,
  routeStatusClass,
  routeStatusLabel,
} from "../lib/statusStyles";

export default function LiveOperations() {
  const { filtered } = useData();
  const view = buildLiveOperations(filtered);
  const chart = useChartStyles();

  return (
    <div>
      <PageHeader
        title="Live Operations Center"
        description="Active routes, completion tracking, rescues, failed deliveries, and station performance."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi label="Active routes" value={String(view.active)} />
        <Kpi label="Completed" value={String(view.completed)} />
        <Kpi label="Rescues" value={String(view.rescueActive)} warn={view.rescueActive > 0} />
        <Kpi label="Failed deliveries" value={String(view.failedCount)} warn={view.failedCount > 0} />
        <Kpi label="Network on-time" value={formatPct(view.networkOnTime)} className="col-span-2 lg:col-span-1" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <ChartCard title="Route completion" subtitle="Planned vs delivered packages by hour" className="h-80 xl:col-span-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={view.hourlyProgress} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis dataKey="hour" stroke={chart.axis} fontSize={12} />
              <YAxis stroke={chart.axis} fontSize={12} />
              <Tooltip contentStyle={chart.tooltip} />
              <Line type="monotone" dataKey="planned" stroke="#146eb4" strokeWidth={2} dot={false} name="Planned" />
              <Line type="monotone" dataKey="delivered" stroke="#ff9900" strokeWidth={2} dot={false} name="Delivered" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="card xl:col-span-2">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Rescue dashboard</h3>
            <p className="text-xs text-slate-500">Distressed routes and helper assignments</p>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-white/5">
            {view.rescueRows.map((rescue) => (
              <li key={rescue.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {rescue.distressedRoute} · {rescue.distressedDriver}
                    </p>
                    <p className="text-xs text-slate-500">
                      Helper {rescue.rescueRoute} ({rescue.rescueDriver}) · {rescue.stops_transferred} stops
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{rescue.reason}</p>
                  </div>
                  <span className={cn("badge capitalize", rescueStatusClass[rescue.status])}>{rescue.status.replace("_", " ")}</span>
                </div>
              </li>
            ))}
            {view.rescueRows.length === 0 && <li className="px-5 py-6 text-sm text-slate-500">No rescues this wave.</li>}
          </ul>
        </div>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Active routes</h3>
          <p className="text-xs text-slate-500">Stop-level completion tracking</p>
        </div>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Route</th>
              <th className="px-3 py-2 font-medium">Driver</th>
              <th className="px-3 py-2 font-medium">Station</th>
              <th className="px-3 py-2 font-medium">Stops</th>
              <th className="px-3 py-2 font-medium">Completion</th>
              <th className="px-3 py-2 font-medium">Failed</th>
              <th className="px-5 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {view.routeRows.map((route) => (
              <tr key={route.id} className="border-t border-slate-200 dark:border-white/5">
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-900 dark:text-white">{route.route_code}</p>
                  <p className="text-xs text-slate-500">{route.vanId}</p>
                </td>
                <td className="px-3 py-3">
                  <p>{route.driverName}</p>
                  <span className={cn("badge mt-1", driverStatusClass[route.driverStatus])}>
                    {driverStatusLabel[route.driverStatus]}
                  </span>
                </td>
                <td className="px-3 py-3">{route.stationCode}</td>
                <td className="px-3 py-3 tabular-nums">
                  {route.stops_completed}/{route.stops_planned}
                </td>
                <td className="px-3 py-3 min-w-[140px]">
                  <ProgressBar
                    value={route.completion}
                    tone={route.completion > 0.85 ? "ok" : route.completion > 0.6 ? "warn" : "bad"}
                  />
                </td>
                <td className="px-3 py-3 tabular-nums">{route.failed_count}</td>
                <td className="px-5 py-3">
                  <span className={cn("badge", routeStatusClass[route.status])}>{routeStatusLabel[route.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card overflow-x-auto">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Failed deliveries</h3>
            <p className="text-xs text-slate-500">Returns, access, and customer-not-available</p>
          </div>
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Tracking</th>
                <th className="px-3 py-2 font-medium">Route</th>
                <th className="px-3 py-2 font-medium">Reason</th>
                <th className="px-5 py-2 font-medium">Notified</th>
              </tr>
            </thead>
            <tbody>
              {view.failedRows.map((row) => (
                <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{row.tracking_id}</p>
                    <p className="text-xs text-slate-500">{row.driverName}</p>
                  </td>
                  <td className="px-3 py-3">{row.routeCode}</td>
                  <td className="px-3 py-3">{row.reason}</td>
                  <td className="px-5 py-3">{row.customer_notified ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card overflow-x-auto">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Station performance</h3>
            <p className="text-xs text-slate-500">Today's wave</p>
          </div>
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Station</th>
                <th className="px-3 py-2 font-medium">Routes</th>
                <th className="px-3 py-2 font-medium">Pace</th>
                <th className="px-3 py-2 font-medium">Failed</th>
                <th className="px-5 py-2 font-medium">On-time</th>
              </tr>
            </thead>
            <tbody>
              {view.stationPerf.map((station) => (
                <tr key={station.id} className="border-t border-slate-200 dark:border-white/5">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                    {station.code} · {station.name}
                  </td>
                  <td className="px-3 py-3">{station.routes}</td>
                  <td className="px-3 py-3 min-w-[120px]">
                    <ProgressBar value={station.completion} tone={station.completion > 0.8 ? "ok" : "warn"} />
                  </td>
                  <td className="px-3 py-3">{station.failed}</td>
                  <td className="px-5 py-3 tabular-nums">{formatPct(station.onTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  warn,
  className,
}: {
  label: string;
  value: string;
  warn?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("card p-5", className)}>
      <p className="stat-label">{label}</p>
      <p className={cn("mt-2 text-3xl font-semibold", warn ? "text-rose-500" : "text-slate-900 dark:text-white")}>
        {value}
      </p>
    </div>
  );
}
