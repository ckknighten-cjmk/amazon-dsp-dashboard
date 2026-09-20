import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ProgressBar from "../components/ProgressBar";
import { useData } from "../lib/data";
import { buildFleet } from "../lib/aggregations";
import { cn } from "../lib/cn";
import { formatNumber } from "../lib/format";
import { inspectionClass } from "../lib/statusStyles";

const vehicleStatusClass = {
  active: "badge-success",
  maintenance: "badge-warning",
  oos: "badge-danger",
} as const;

export default function Fleet() {
  const { filtered } = useData();
  const view = buildFleet(filtered);

  return (
    <div>
      <PageHeader
        title="Fleet Management"
        description="Van utilization, service cadence, pre-trips, and assignment for today's wave."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {view.kpis.map((kpi) => (
          <StatCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="card mt-4 overflow-x-auto">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Fleet board</h3>
          <p className="text-xs text-slate-500">E-Transit assignments, odometer, and next service</p>
        </div>
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Van</th>
              <th className="px-3 py-2 font-medium">Driver</th>
              <th className="px-3 py-2 font-medium">Route</th>
              <th className="px-3 py-2 font-medium">Odometer</th>
              <th className="px-3 py-2 font-medium">Next service</th>
              <th className="px-3 py-2 font-medium">Utilization</th>
              <th className="px-3 py-2 font-medium">Pre-trip</th>
              <th className="px-5 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {view.rows.map((van) => (
              <tr key={van.id} className="border-t border-slate-200 dark:border-white/5">
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-900 dark:text-white">{van.van_id}</p>
                  <p className="text-xs text-slate-500">
                    {van.year} {van.model} · {van.stationCode}
                  </p>
                </td>
                <td className="px-3 py-3">{van.driverName}</td>
                <td className="px-3 py-3">{van.routeCode}</td>
                <td className="px-3 py-3 tabular-nums">{formatNumber(van.odometer_miles)} mi</td>
                <td className="px-3 py-3">
                  <span className={cn(van.serviceDue && "text-amber-600 dark:text-amber-400")}>
                    {formatNumber(van.next_service_miles)} mi
                  </span>
                </td>
                <td className="px-3 py-3 min-w-[120px]">
                  <ProgressBar value={van.utilization_pct / 100} tone={van.utilization_pct > 60 ? "ok" : "warn"} />
                </td>
                <td className="px-3 py-3">
                  <span className={cn("badge capitalize", inspectionClass[van.inspectionStatus])}>
                    {van.inspectionStatus}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={cn("badge capitalize", vehicleStatusClass[van.status])}>{van.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
