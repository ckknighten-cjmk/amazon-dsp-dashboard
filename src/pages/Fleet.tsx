import { Link } from "react-router-dom";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import ScoreRing from "../components/ScoreRing";
import { useData } from "../lib/data";
import { buildFleetReadiness } from "../lib/fleetReadiness";
import { useChartStyles } from "../lib/chart";
import { cn } from "../lib/cn";
import { formatNumber } from "../lib/format";
import { fleetBoardClass, fleetBoardLabel, inspectionClass } from "../lib/statusStyles";

export default function Fleet() {
  const { filtered } = useData();
  const view = buildFleetReadiness(filtered);
  const chart = useChartStyles();
  const standing = view.readinessPct >= 90 ? "fantastic" : view.readinessPct >= 80 ? "great" : view.readinessPct >= 70 ? "fair" : "poor";

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {view.kpis.map((kpi) => (
          <StatCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          title="Tomorrow's mix"
          subtitle={`${view.tomorrowLabel} launch plan`}
          className="h-80"
        >
          <div className="flex h-full items-center gap-4">
            <div className="h-full min-w-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={view.mix} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={3}>
                    {view.mix.map((row) => (
                      <Cell key={row.name} fill={row.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chart.tooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-40 shrink-0 space-y-2 text-sm">
              {view.mix.map((row) => (
                <li key={row.name} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: row.fill }} />
                    {row.name}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">{row.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </ChartCard>

        <div className="card flex flex-col justify-between p-5">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Readiness for {view.tomorrowLabel}</p>
            <p className="mt-1 text-xs text-slate-500">Share of the fleet that can take a route tomorrow morning.</p>
          </div>
          <ScoreRing value={view.readinessPct} label={`${view.available.length} of ${view.rows.length} vans launch-ready`} standing={standing} />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Grounded</p>
              <p className="font-semibold text-rose-600 dark:text-rose-400">{view.grounded.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Open DVIC</p>
              <p className="font-semibold text-amber-600 dark:text-amber-400">{view.dvic.length}</p>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Holds before wave</h3>
            <p className="text-xs text-slate-500">Grounded vans and blocking defects</p>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-white/5">
            {view.rows
              .filter((row) => !row.availableTomorrow)
              .slice(0, 5)
              .map((row) => (
                <li key={row.id} className="px-5 py-3">
                  <Link to={`/fleet/vehicles/${row.id}`} className="block hover:opacity-90">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{row.van_id}</p>
                      <span className={cn("badge", fleetBoardClass[row.boardState])}>{fleetBoardLabel[row.boardState]}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{row.blockingReason}</p>
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Fleet board</h3>
          <p className="text-xs text-slate-500">Click a van for VIN, mileage, service, damage, and route history</p>
        </div>
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Van</th>
              <th className="px-3 py-2 font-medium">Driver</th>
              <th className="px-3 py-2 font-medium">Mileage</th>
              <th className="px-3 py-2 font-medium">Next PM</th>
              <th className="px-3 py-2 font-medium">DVIC</th>
              <th className="px-3 py-2 font-medium">Tomorrow</th>
              <th className="px-5 py-2 font-medium">State</th>
            </tr>
          </thead>
          <tbody>
            {view.rows.map((van) => (
              <tr key={van.id} className="border-t border-slate-200 dark:border-white/5">
                <td className="px-5 py-3">
                  <Link to={`/fleet/vehicles/${van.id}`} className="hover:text-brand-blue">
                    <p className="font-medium text-slate-900 dark:text-white">{van.van_id}</p>
                    <p className="text-xs text-slate-500">
                      {van.year} {van.model} · {van.stationCode}
                    </p>
                  </Link>
                </td>
                <td className="px-3 py-3">{van.driverName}</td>
                <td className="px-3 py-3 tabular-nums">{formatNumber(van.odometer_miles)} mi</td>
                <td className="px-3 py-3 tabular-nums">
                  <span className={cn(van.serviceDue && "text-amber-600 dark:text-amber-400")}>
                    {formatNumber(van.next_service_miles)} mi
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className={cn("badge capitalize", inspectionClass[van.inspectionStatus])}>
                    {van.inspectionStatus}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className={cn("badge", van.availableTomorrow ? "badge-success" : "badge-danger")}>
                    {van.availableTomorrow ? "Ready" : "Not ready"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={cn("badge", fleetBoardClass[van.boardState])}>{fleetBoardLabel[van.boardState]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
