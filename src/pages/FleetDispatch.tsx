import { Link } from "react-router-dom";
import { AlertTriangle, Ban, CheckCircle2, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { useData } from "../lib/data";
import { buildFleetReadiness } from "../lib/fleetReadiness";
import { cn } from "../lib/cn";
import { formatDate } from "../lib/format";
import { fleetBoardClass, inspectionClass, workOrderPriorityClass } from "../lib/statusStyles";

export default function FleetDispatch() {
  const { filtered } = useData();
  const view = buildFleetReadiness(filtered);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary icon={CheckCircle2} label="Available tomorrow" value={view.available.length} tone="ok" />
        <Summary icon={Ban} label="Grounded" value={view.grounded.length} tone="bad" />
        <Summary icon={AlertTriangle} label="New damage" value={view.newDamage.length} tone="warn" />
        <Summary icon={Wrench} label="Open DVIC" value={view.dvic.length} tone="warn" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <BoardColumn
          title="Available tomorrow"
          subtitle={`${view.tomorrowLabel} · can take a route`}
          empty="No launch-ready vans in this station filter."
        >
          {view.available.map((van) => (
            <VanCard
              key={van.id}
              to={`/fleet/vehicles/${van.id}`}
              title={van.van_id}
              meta={`${van.stationCode} · ${van.driverName}`}
              badge={<span className={cn("badge", fleetBoardClass.available)}>Ready</span>}
              detail={`Route ${van.routeCode} · DVIC ${van.inspectionStatus}`}
            />
          ))}
        </BoardColumn>

        <BoardColumn
          title="Grounded vehicles"
          subtitle="OOS, accident, or inspection hold"
          empty="No grounded vans."
        >
          {view.grounded.map((van) => (
            <VanCard
              key={van.id}
              to={`/fleet/vehicles/${van.id}`}
              title={van.van_id}
              meta={`${van.stationCode} · ${van.driverName}`}
              badge={<span className={cn("badge", fleetBoardClass.grounded)}>Grounded</span>}
              detail={van.blockingReason ?? "Out of service"}
            />
          ))}
        </BoardColumn>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">New damage alerts</h3>
            <p className="text-xs text-slate-500">Last 3 operating days</p>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-white/5">
            {view.newDamage.map((event) => {
              const van = view.rows.find((row) => row.id === event.vehicle_id);
              return (
                <li key={event.id} className="px-5 py-3">
                  <Link to={`/fleet/vehicles/${event.vehicle_id}`} className="block hover:opacity-90">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {van?.van_id ?? event.vehicle_id} · {event.title}
                      </p>
                      <span className="badge badge-danger">Damage</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(event.occurred_at.slice(0, 10))} · {event.description}
                    </p>
                  </Link>
                </li>
              );
            })}
            {view.newDamage.length === 0 && <EmptyRow text="No new damage in the last 3 days." />}
          </ul>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Open DVIC issues</h3>
            <p className="text-xs text-slate-500">Defects that block or watch tomorrow's wave</p>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-white/5">
            {view.dvic.map((van) => {
              const order = view.openWorkOrders.find((row) => row.vehicle_id === van.id && (row.type === "dvic" || row.type === "repair" || row.type === "tire"));
              return (
                <li key={van.id} className="px-5 py-3">
                  <Link to={`/fleet/vehicles/${van.id}`} className="block hover:opacity-90">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{van.van_id}</p>
                      <span className={cn("badge capitalize", inspectionClass[van.inspectionStatus])}>{van.inspectionStatus}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {van.defects.join(", ") || van.blockingReason || "Open inspection defect"}
                    </p>
                    {order && (
                      <p className="mt-1 text-xs text-slate-500">
                        {order.wo_number} ·{" "}
                        <span className={cn("badge capitalize", workOrderPriorityClass[order.priority])}>{order.priority}</span>
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
            {view.dvic.length === 0 && <EmptyRow text="No open DVIC defects." />}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Summary({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
  tone: "ok" | "warn" | "bad";
}) {
  const toneClass =
    tone === "ok"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : tone === "bad"
        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
        : "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", toneClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function BoardColumn({
  title,
  subtitle,
  empty,
  children,
}: {
  title: string;
  subtitle: string;
  empty: string;
  children: ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="max-h-[28rem] space-y-2 overflow-y-auto p-3">
        {items.length ? children : <p className="px-2 py-6 text-center text-sm text-slate-500">{empty}</p>}
      </div>
    </div>
  );
}

function VanCard({
  to,
  title,
  meta,
  badge,
  detail,
}: {
  to: string;
  title: string;
  meta: string;
  badge: ReactNode;
  detail: string;
}) {
  return (
    <Link to={to} className="block rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 hover:border-brand-blue/40 dark:border-white/5 dark:bg-ink-800/60">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{title}</p>
        {badge}
      </div>
      <p className="mt-1 text-xs text-slate-500">{meta}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </Link>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <li className="px-5 py-6 text-center text-sm text-slate-500">{text}</li>;
}
