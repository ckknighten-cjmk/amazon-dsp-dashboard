import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import PageHeader from "../components/PageHeader";
import { useData } from "../lib/data";
import { buildVehicleDetail } from "../lib/fleetReadiness";
import { cn } from "../lib/cn";
import { formatDate, formatNumber, formatUsd } from "../lib/format";
import {
  fleetBoardClass,
  fleetBoardLabel,
  inspectionClass,
  workOrderPriorityClass,
  workOrderStatusClass,
} from "../lib/statusStyles";

export default function VehicleDetail() {
  const { vehicleId } = useParams();
  const { filtered } = useData();
  const view = vehicleId ? buildVehicleDetail(filtered, vehicleId) : null;

  if (!vehicleId) return <Navigate to="/fleet" replace />;
  if (!view) {
    return (
      <div>
        <PageHeader title="Vehicle not found" description="That van is not in the current station filter." />
        <Link to="/fleet" className="text-sm text-brand-blue hover:underline">
          Back to fleet board
        </Link>
      </div>
    );
  }

  const { vehicle } = view;

  return (
    <div>
      <Link
        to="/fleet"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Fleet Readiness
      </Link>

      <PageHeader
        title={vehicle.van_id}
        description={`${vehicle.year} ${vehicle.make} ${vehicle.model} · ${vehicle.stationCode}`}
      >
        <span className={cn("badge", fleetBoardClass[vehicle.boardState])}>{fleetBoardLabel[vehicle.boardState]}</span>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Vehicle profile</h3>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
            <Field label="VIN" value={vehicle.vin} mono />
            <Field label="Mileage" value={`${formatNumber(vehicle.odometer_miles)} mi`} />
            <Field label="Powertrain" value={vehicle.powertrain.toUpperCase()} />
            <Field label="Assigned driver" value={vehicle.driverName} />
            <Field label="Today's route" value={vehicle.routeCode} />
            <Field label="Utilization" value={`${vehicle.utilization_pct}%`} />
            <Field label="Last service" value={formatDate(vehicle.last_service_date)} />
            <Field label="Next PM" value={`${formatNumber(vehicle.next_service_miles)} mi`} />
            <Field
              label="DVIC"
              value={
                <span className={cn("badge capitalize", inspectionClass[vehicle.inspectionStatus])}>
                  {vehicle.inspectionStatus}
                </span>
              }
            />
          </dl>
          {vehicle.blockingReason && (
            <p className="mt-4 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
              {vehicle.blockingReason}
            </p>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Cost & downtime</h3>
          <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">{formatUsd(view.costTotal)}</p>
          <p className="text-xs text-slate-500">Repair cost on record</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Open work orders</dt>
              <dd className="font-medium">{vehicle.openWorkOrders}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Downtime hours</dt>
              <dd className="font-medium">{formatNumber(view.downtime.reduce((sum, row) => sum + row.hours, 0), 1)}h</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Tomorrow</dt>
              <dd className={vehicle.availableTomorrow ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                {vehicle.availableTomorrow ? "Ready" : "Not ready"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <HistoryCard title="Service history" subtitle="PM, repairs, and inspections">
          {view.serviceHistory.map((event) => (
            <li key={event.id} className="px-5 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{event.title}</p>
                <span className="badge badge-info capitalize">{event.event_type}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {formatDate(event.occurred_at.slice(0, 10))} · {formatNumber(event.odometer_miles)} mi · {event.technician}
              </p>
              <p className="mt-1 text-xs text-slate-500">{event.description}</p>
            </li>
          ))}
          {view.serviceHistory.length === 0 && <Empty text="No service events on file." />}
        </HistoryCard>

        <HistoryCard title="Damage history" subtitle="Body, collision, and property events">
          {view.damageHistory.map((event) => (
            <li key={event.id} className="px-5 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{event.title}</p>
                <span className="badge badge-danger">Damage</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{formatDate(event.occurred_at.slice(0, 10))}</p>
              <p className="mt-1 text-xs text-slate-500">{event.description}</p>
            </li>
          ))}
          {view.damageHistory.length === 0 && <Empty text="No damage events on file." />}
        </HistoryCard>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Route history</h3>
          <p className="text-xs text-slate-500">Recent assignments, packages, and miles</p>
        </div>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Route</th>
              <th className="px-3 py-2 font-medium">Driver</th>
              <th className="px-3 py-2 font-medium">Packages</th>
              <th className="px-5 py-2 font-medium">Miles</th>
            </tr>
          </thead>
          <tbody>
            {view.routeHistory.map((row) => (
              <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">
                <td className="px-5 py-3">{formatDate(row.date)}</td>
                <td className="px-3 py-3 font-medium text-slate-900 dark:text-white">{row.route}</td>
                <td className="px-3 py-3">{row.driver}</td>
                <td className="px-3 py-3 tabular-nums">{formatNumber(row.packages)}</td>
                <td className="px-5 py-3 tabular-nums">{row.miles} mi</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card overflow-x-auto">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Work orders</h3>
          </div>
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">WO</th>
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {view.orders.map((order) => (
                <tr key={order.id} className="border-t border-slate-200 dark:border-white/5">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{order.wo_number}</p>
                    <p className="text-xs text-slate-500">{order.title}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn("badge capitalize", workOrderPriorityClass[order.priority])}>{order.priority}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("badge capitalize", workOrderStatusClass[order.status])}>{order.status.replace("_", " ")}</span>
                  </td>
                </tr>
              ))}
              {view.orders.length === 0 && (
                <tr>
                  <td className="px-5 py-6 text-sm text-slate-500" colSpan={3}>
                    No work orders for this van.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <HistoryCard title="Status history" subtitle="Grounding and return-to-service">
          {view.history.map((row) => (
            <li key={row.id} className="px-5 py-3">
              <p className="text-sm font-medium capitalize text-slate-900 dark:text-white">
                {row.from_status} → {row.to_status}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatDate(row.changed_at.slice(0, 10))} · {row.changed_by}
              </p>
              <p className="mt-1 text-xs text-slate-500">{row.reason}</p>
            </li>
          ))}
          {view.history.length === 0 && <Empty text="No status changes recorded." />}
        </HistoryCard>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={cn("mt-1 font-medium text-slate-900 dark:text-white", mono && "font-mono text-xs sm:text-sm")}>{value}</dd>
    </div>
  );
}

function HistoryCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <ul className="divide-y divide-slate-200 dark:divide-white/5">{children}</ul>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <li className="px-5 py-6 text-center text-sm text-slate-500">{text}</li>;
}
