import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ProgressBar from "../components/ProgressBar";
import { useAuth } from "../lib/auth";
import { useData } from "../lib/data";
import { buildRouteManagement } from "../lib/aggregations";
import { formatPct, formatUsd } from "../lib/format";
import { cn } from "../lib/cn";
import type { RescueStatus } from "../types/database";
import { rescueStatusClass, routeStatusClass, routeStatusLabel } from "../lib/statusStyles";

interface RescueOverride {
  rescue_route_id: string | null;
  status: RescueStatus;
}

export default function RoutesBoard() {
  const { filtered } = useData();
  const { user } = useAuth();
  const view = buildRouteManagement(filtered);
  const [overrides, setOverrides] = useState<Record<string, RescueOverride>>({});
  const canManage = user?.role === "owner" || user?.role === "operations_manager" || user?.role === "dispatcher";

  const rescueRows = useMemo(
    () =>
      view.rescueRows.map((rescue) => {
        const override = overrides[rescue.id];
        if (!override) return rescue;
        const helper = view.routeRows.find((route) => route.id === override.rescue_route_id);
        return {
          ...rescue,
          status: override.status,
          rescue_route_id: override.rescue_route_id,
          rescueRoute: helper?.route_code ?? (override.rescue_route_id ? rescue.rescueRoute : "Unassigned"),
          rescueDriver: helper?.driverName ?? (override.rescue_route_id ? rescue.rescueDriver : "Pending"),
        };
      }),
    [overrides, view.rescueRows, view.routeRows],
  );

  const helperOptions = view.routeRows.filter((route) => route.status === "in_progress" && route.completion >= 0.55);

  return (
    <div>
      <PageHeader
        title="Route Management"
        description="Profitability, completion, rescue assignment, and stop-level variance versus the 16:30 pace plan."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {view.kpis.map((kpi) => (
          <StatCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="card overflow-x-auto xl:col-span-3">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Route variance</h3>
            <p className="text-xs text-slate-500">Actual stop completion vs. expected pace</p>
          </div>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Route</th>
                <th className="px-3 py-2 font-medium">Pace</th>
                <th className="px-3 py-2 font-medium">Variance</th>
                <th className="px-3 py-2 font-medium">Left</th>
                <th className="px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {view.variance.map((row) => (
                <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {row.route_code} · {row.stationCode}
                    </p>
                    <p className="text-xs text-slate-500">{row.driverName}</p>
                  </td>
                  <td className="px-3 py-3 min-w-[140px]">
                    <ProgressBar value={row.actual} tone={row.actual > 0.85 ? "ok" : row.actual > 0.6 ? "warn" : "bad"} />
                  </td>
                  <td className={cn("px-3 py-3 tabular-nums", row.stopVariance < 0 ? "text-rose-500" : "text-emerald-600")}>
                    {row.stopVariance > 0 ? "+" : ""}
                    {row.stopVariance.toFixed(1)}pp
                  </td>
                  <td className="px-3 py-3 tabular-nums">{row.remaining}</td>
                  <td className="px-5 py-3">
                    <span className={cn("badge", routeStatusClass[row.status])}>{routeStatusLabel[row.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card xl:col-span-2">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Rescue assignment</h3>
            <p className="text-xs text-slate-500">Assign a helper and close the rescue</p>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-white/5">
            {rescueRows.map((rescue) => (
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
                    {canManage && rescue.status !== "completed" && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <select
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-white/10 dark:bg-ink-800"
                          value={rescue.rescue_route_id ?? ""}
                          onChange={(event) =>
                            setOverrides((current) => ({
                              ...current,
                              [rescue.id]: {
                                rescue_route_id: event.target.value || null,
                                status: event.target.value ? "in_progress" : "requested",
                              },
                            }))
                          }
                        >
                          <option value="">Unassigned</option>
                          {helperOptions
                            .filter((route) => route.id !== rescue.distressed_route_id)
                            .map((route) => (
                              <option key={route.id} value={route.id}>
                                {route.route_code} · {route.driverName}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white"
                          onClick={() =>
                            setOverrides((current) => ({
                              ...current,
                              [rescue.id]: { rescue_route_id: rescue.rescue_route_id, status: "completed" },
                            }))
                          }
                        >
                          Complete
                        </button>
                      </div>
                    )}
                  </div>
                  <span className={cn("badge capitalize", rescueStatusClass[rescue.status])}>
                    {rescue.status.replace("_", " ")}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Route profitability</h3>
          <p className="text-xs text-slate-500">Amazon package/stop rate versus labor, OT, energy, and van cost</p>
        </div>
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Route</th>
              <th className="px-3 py-2 font-medium">Driver</th>
              <th className="px-3 py-2 font-medium">Revenue</th>
              <th className="px-3 py-2 font-medium">Labor + OT</th>
              <th className="px-3 py-2 font-medium">Fuel</th>
              <th className="px-5 py-2 font-medium">Profit</th>
            </tr>
          </thead>
          <tbody>
            {view.routeProfit.map((row) => (
              <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                  {row.routeCode} · {row.stationCode}
                </td>
                <td className="px-3 py-3">{row.driverName}</td>
                <td className="px-3 py-3 tabular-nums">{formatUsd(row.revenue)}</td>
                <td className="px-3 py-3 tabular-nums">{formatUsd(row.labor + row.overtime)}</td>
                <td className="px-3 py-3 tabular-nums">{formatUsd(row.fuel)}</td>
                <td className={`px-5 py-3 tabular-nums ${row.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                  {formatUsd(row.profit)} ({formatPct(row.margin * 100)})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
