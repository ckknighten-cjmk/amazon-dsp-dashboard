import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ScoreRing from "../components/ScoreRing";
import ProgressBar from "../components/ProgressBar";
import { useData } from "../lib/data";
import { buildMorningDispatch } from "../lib/readiness";
import { cn } from "../lib/cn";
import { formatNumber, formatPct } from "../lib/format";
import {
  dispatchStatusClass,
  dispatchStatusLabel,
  driverStatusClass,
  driverStatusLabel,
  inspectionClass,
  launchGateClass,
  routeStatusClass,
  routeStatusLabel,
  weatherSeverityClass,
} from "../lib/statusStyles";
import {
  CloudLightning,
  ClipboardCheck,
  Thermometer,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import type { InsightSeverity, LaunchGate, ScoreStanding } from "../types/database";

const severityClass: Record<InsightSeverity, string> = {
  critical: "badge-danger",
  warning: "badge-warning",
  watch: "badge-info",
};

const gateCopy: Record<LaunchGate, { title: string; detail: string }> = {
  go: {
    title: "Clear to launch",
    detail: "Staffing, fleet, and coverage are inside operating limits. Continue the published wave.",
  },
  conditional: {
    title: "Launch with conditions",
    detail: "The wave can roll, but open routes, grounded vans, or weather require named actions first.",
  },
  hold: {
    title: "Hold launch",
    detail: "Do not lock the wave until open routes and critical defects are covered.",
  },
};

function scoreStanding(value: number): ScoreStanding {
  if (value >= 90) return "fantastic";
  if (value >= 80) return "great";
  if (value >= 70) return "fair";
  return "poor";
}

function formatCheckIn(value: string | null): string {
  if (!value) return "—";
  if (value.length === 5) return value;
  const time = value.slice(11, 16);
  return time || "—";
}

export default function MorningDispatch() {
  const { filtered } = useData();
  const view = buildMorningDispatch(filtered);
  const gate = view.gate;
  const launchStanding = scoreStanding(view.launchReadinessScore);

  return (
    <div>
      <PageHeader
        title="Morning Dispatch Readiness Center"
        description="Single launch screen for dispatchers, operations managers, and owners — staffing, fleet, routes, weather, and recommended actions for today's wave."
      />

      <div
        className={cn(
          "mb-4 flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between",
          gate === "go" && "border-emerald-500/30 bg-emerald-500/10",
          gate === "conditional" && "border-amber-500/30 bg-amber-500/10",
          gate === "hold" && "border-rose-500/30 bg-rose-500/10",
        )}
      >
        <div className="flex items-start gap-4">
          <ScoreRing value={view.launchReadinessScore} label="Launch score" standing={launchStanding} />
          <div>
            <span className={cn("badge capitalize", launchGateClass[gate])}>{gate === "go" ? "Go" : gate}</span>
            <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{gateCopy[gate].title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{gateCopy[gate].detail}</p>
          </div>
        </div>
        <p className="text-xs text-slate-500">Live board · vs yesterday {view.prior ? formatPct(view.prior.launch_readiness_score) : "n/a"}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {view.kpis.map((kpi) => (
          <StatCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="card xl:col-span-2">
          <SectionHeader title="Executive summary" subtitle="Shortages, coverage, and shop holds" />
          <dl className="divide-y divide-slate-200 dark:divide-white/5">
            <SummaryRow label="Staffing shortages" value={view.summary.staffingShortages} warn={view.staffing.openRoutes > 0} />
            <SummaryRow label="Fleet shortages" value={view.summary.fleetShortages} warn={view.fleet.vansGrounded > 0} />
            <SummaryRow label="Route coverage" value={view.summary.coverageIssues} warn={view.routes.unassigned > 0} />
            <SummaryRow label="Critical maintenance" value={view.summary.maintenanceConcerns} warn={view.fleet.newDvicDefects > 0} />
          </dl>
        </div>

        <div className="card xl:col-span-3">
          <SectionHeader title="AI operational recommendations" subtitle={`${view.recommendations.length} actions to clear launch`} />
          <ul className="divide-y divide-slate-200 dark:divide-white/5">
            {view.recommendations.map((rec) => (
              <li key={rec.id} className="px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("badge capitalize", severityClass[rec.severity])}>{rec.severity}</span>
                  <span className="badge badge-neutral capitalize">{rec.category}</span>
                  {rec.stationCode && <span className="text-xs text-slate-500">{rec.stationCode}</span>}
                </div>
                <p className="mt-1.5 text-sm font-medium text-slate-900 dark:text-white">{rec.title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{rec.action}</p>
                <p className="mt-1 text-xs text-slate-500">{rec.metric}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <SectionHeader
            icon={Users}
            title="Staffing readiness"
            subtitle={`${formatPct(view.staffing.readinessPct)} of today's wave is checked in`}
          />
          <div className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-4">
            <Metric label="Drivers scheduled" value={view.staffing.driversScheduled} />
            <Metric label="Checked in" value={view.staffing.driversCheckedIn} />
            <Metric label="PTO today" value={view.staffing.ptoToday} warn={view.staffing.ptoToday > 0} />
            <Metric label="Call-outs" value={view.staffing.callOuts} warn={view.staffing.callOuts > 0} />
            <Metric label="No-shows" value={view.staffing.noShows} warn={view.staffing.noShows > 0} />
            <Metric label="Open routes" value={view.staffing.openRoutes} warn={view.staffing.openRoutes > 0} />
            <Metric
              label="Staffing delta"
              value={`${view.staffing.staffingDelta > 0 ? "+" : ""}${view.staffing.staffingDelta}`}
              warn={view.staffing.staffingDelta < 0}
              hint={view.staffing.staffingDelta < 0 ? "Deficit vs routes" : "Surplus vs routes"}
            />
            <div className="rounded-lg border border-slate-200 p-3 dark:border-white/5">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Readiness</p>
              <div className="mt-2">
                <ProgressBar value={view.staffing.readinessPct / 100} tone={view.staffing.readinessPct >= 90 ? "ok" : view.staffing.readinessPct >= 80 ? "warn" : "bad"} />
              </div>
            </div>
          </div>
          {(view.staffing.ptoNames.length > 0 || view.staffing.callOutNames.length > 0) && (
            <p className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-white/5">
              {view.staffing.ptoNames.length ? `PTO: ${view.staffing.ptoNames.join(", ")}` : null}
              {view.staffing.ptoNames.length && view.staffing.callOutNames.length ? " · " : null}
              {view.staffing.callOutNames.length ? `Call-out: ${view.staffing.callOutNames.join(", ")}` : null}
            </p>
          )}
        </div>

        <div className="card">
          <SectionHeader
            icon={Truck}
            title="Fleet readiness"
            subtitle="Active vans, DVIC defects, and damage alerts"
          />
          <div className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-3">
            <Metric label="Vans available" value={view.fleet.vansAvailable} />
            <Metric label="Vans grounded" value={view.fleet.vansGrounded} warn={view.fleet.vansGrounded > 0} />
            <Metric label="Vans in service" value={view.fleet.vansInService} />
            <Metric label="New DVIC defects" value={view.fleet.newDvicDefects} warn={view.fleet.newDvicDefects > 0} />
            <Metric label="New damage alerts" value={view.fleet.newDamageAlerts} warn={view.fleet.newDamageAlerts > 0} />
            <Metric label="Fleet readiness" value={formatPct(view.fleet.readinessPct)} warn={view.fleet.readinessPct < 85} />
          </div>
          <ul className="divide-y divide-slate-200 border-t border-slate-200 dark:divide-white/5 dark:border-white/5">
            {view.fleet.defects.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-3 px-5 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{row.vanId}</p>
                  <p className="text-xs text-slate-500">{row.defects.join(", ") || row.notes}</p>
                </div>
                <span className={cn("badge capitalize", inspectionClass[row.status])}>{row.status}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <SectionHeader
            icon={ClipboardCheck}
            title="Route readiness"
            subtitle={`${view.routes.rescueRiskLabel} rescue risk`}
          />
          <div className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-3">
            <Metric label="Routes assigned" value={view.routes.assigned} />
            <Metric label="Routes unassigned" value={view.routes.unassigned} warn={view.routes.unassigned > 0} />
            <Metric label="Route coverage" value={formatPct(view.routes.coveragePct)} warn={view.routes.coveragePct < 95} />
            <Metric label="Rescue risk" value={view.routes.rescueRiskLabel} warn={view.routes.rescueRisk >= 30} />
            <Metric label="High-volume routes" value={view.routes.highVolume} />
            <div className="rounded-lg border border-slate-200 p-3 dark:border-white/5">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Coverage</p>
              <div className="mt-2">
                <ProgressBar
                  value={view.routes.coveragePct / 100}
                  tone={view.routes.coveragePct >= 95 ? "ok" : view.routes.coveragePct >= 85 ? "warn" : "bad"}
                />
              </div>
            </div>
          </div>
          {view.routes.highVolumeRows.length > 0 && (
            <div className="border-t border-slate-200 px-5 py-3 dark:border-white/5">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">High-volume (≥ 1,200 pkgs)</p>
              <ul className="mt-2 space-y-1 text-sm">
                {view.routes.highVolumeRows.map((row) => (
                  <li key={row.id} className="flex justify-between gap-3">
                    <span className="text-slate-800 dark:text-slate-200">
                      {row.route_code} · {row.stationCode}
                    </span>
                    <span className="tabular-nums text-slate-500">
                      {formatNumber(row.packages_planned)} · {row.driverName}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="card">
          <SectionHeader
            icon={CloudLightning}
            title="Weather & risk center"
            subtitle={`${view.weather.highRisk} high-risk operating condition${view.weather.highRisk === 1 ? "" : "s"}`}
          />
          <div className="grid grid-cols-3 gap-3 px-5 pb-4">
            <Metric label="Weather alerts" value={view.weather.alerts.length} />
            <Metric label="Heat warnings" value={view.weather.heatWarnings} warn={view.weather.heatWarnings > 0} icon={Thermometer} />
            <Metric label="Storm warnings" value={view.weather.stormWarnings} warn={view.weather.stormWarnings > 0} icon={CloudLightning} />
          </div>
          <ul className="divide-y divide-slate-200 border-t border-slate-200 dark:divide-white/5 dark:border-white/5">
            {view.weather.alerts.map((alert) => (
              <li key={alert.id} className="px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("badge capitalize", weatherSeverityClass[alert.severity])}>{alert.severity}</span>
                  <span className="badge badge-neutral capitalize">{alert.alert_type.replace("_", " ")}</span>
                  <span className="text-xs text-slate-500">
                    {alert.stationCode} · {alert.stationName}
                  </span>
                  {alert.high_risk && <span className="badge badge-danger">High risk</span>}
                </div>
                <p className="mt-1.5 text-sm font-medium text-slate-900 dark:text-white">{alert.title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{alert.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <SectionHeader
          icon={Wrench}
          title="Dispatch command board"
          subtitle="Driver, route, van, check-in, and dispatch status"
        />
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Driver</th>
              <th className="px-3 py-2 font-medium">Route</th>
              <th className="px-3 py-2 font-medium">Van</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Check-in</th>
              <th className="px-5 py-2 font-medium">Dispatch status</th>
            </tr>
          </thead>
          <tbody>
            {view.commandBoard.map((row) => (
              <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-900 dark:text-white">{row.driverName}</p>
                  <span className={cn("badge mt-1", driverStatusClass[row.driverStatus])}>
                    {driverStatusLabel[row.driverStatus]}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <p className="font-medium">{row.routeCode}</p>
                  <p className="text-xs text-slate-500">{row.stationCode}</p>
                </td>
                <td className="px-3 py-3">{row.vanId}</td>
                <td className="px-3 py-3">
                  <span className={cn("badge", routeStatusClass[row.status])}>{routeStatusLabel[row.status]}</span>
                </td>
                <td className="px-3 py-3 tabular-nums">{formatCheckIn(row.checkInTime)}</td>
                <td className="px-5 py-3">
                  <span className={cn("badge", dispatchStatusClass[row.dispatchStatus])}>
                    {dispatchStatusLabel[row.dispatchStatus]}
                  </span>
                  {row.notes && <p className="mt-1 max-w-xs text-xs text-slate-500">{row.notes}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  icon?: typeof Users;
}) {
  return (
    <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-brand-orange" />}
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function SummaryRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="px-5 py-3">
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={cn("mt-1 text-sm", warn ? "text-amber-700 dark:text-amber-300" : "text-slate-700 dark:text-slate-200")}>{value}</dd>
    </div>
  );
}

function Metric({
  label,
  value,
  warn,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  warn?: boolean;
  hint?: string;
  icon?: typeof Users;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-white/5">
      <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-500">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums", warn ? "text-rose-500" : "text-slate-900 dark:text-white")}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}
