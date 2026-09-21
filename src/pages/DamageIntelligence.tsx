import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import { useData } from "../lib/data";
import {
  buildDamageIntelligence,
  SEVERITY_SCORE_LABEL,
  WORKFLOW_LABEL,
  ZONE_LABEL,
} from "../lib/damage";
import { useChartStyles } from "../lib/chart";
import { cn } from "../lib/cn";
import { formatUsd } from "../lib/format";
import DamagePhotoPair from "../components/DamagePhotoPair";
import DamageReportTable from "../components/DamageReportTable";
import CvPipelineStepper from "../components/CvPipelineStepper";
import { buildCvPipelineBoard } from "../lib/cvPipeline";
import type { DamageSeverityScore, DamageWorkflowStatus } from "../types/database";

const scoreClass: Record<DamageSeverityScore, string> = {
  minor: "badge-info",
  moderate: "badge-warning",
  severe: "badge-danger",
  ground_vehicle: "badge-danger",
};

const workflowClass: Record<DamageWorkflowStatus, string> = {
  new: "badge-danger",
  under_review: "badge-warning",
  approved: "badge-info",
  scheduled_repair: "badge-info",
  repaired: "badge-success",
};

export default function DamageIntelligence() {
  const { filtered } = useData();
  const view = buildDamageIntelligence(filtered);
  const pipeline = buildCvPipelineBoard(filtered);
  const chart = useChartStyles();

  return (
    <div>
      <PageHeader
        title="DVIC Damage Intelligence"
        description="Before/after photos, severity scores, repair estimates, driver accountability, approval workflow, and grounding recommendations."
      >
        <div className="flex gap-4">
          <Link to="/damage/report" className="text-sm font-medium text-brand-blue">
            Damage report
          </Link>
          <Link to="/damage/pipeline" className="text-sm font-medium text-brand-blue">
            Photo pipeline
          </Link>
          <Link to="/fleet" className="text-sm font-medium text-brand-blue">
            Fleet board
          </Link>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {view.kpis.map((kpi) => (
          <StatCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="card mt-4 p-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Computer vision pipeline</h3>
            <p className="text-xs text-slate-500">
              Photo upload → analysis → location detection → compare to previous photos → potential new damage alert.
            </p>
          </div>
          <Link to="/damage/pipeline" className="text-xs font-medium text-brand-blue">
            Run a photo
          </Link>
        </div>
        <CvPipelineStepper
          statuses={["complete", "complete", "complete", "complete", pipeline.alertCount ? "alert" : "complete"]}
          details={[
            `${pipeline.uploaded} photos uploaded`,
            `${pipeline.analyzed} embeddings ready`,
            `${pipeline.runs.length} zones detected`,
            `${pipeline.compared} compared to prior DVICs`,
            `${pipeline.alertCount} potential new damage alerts`,
          ]}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {view.severityBoard.map((row) => (
          <div key={row.score} className="card p-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Severity</p>
            <span className={cn("badge mt-2", scoreClass[row.score])}>{row.label}</span>
            <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{row.count}</p>
            <p className="text-xs text-slate-500">{formatUsd(row.estimated)} estimated</p>
          </div>
        ))}
      </div>

      <div className="card mt-4 p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Damage workflow</h3>
        <p className="mt-1 text-xs text-slate-500">New → Under review → Approved → Scheduled repair → Repaired</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          {view.workflowBoard.map((column) => (
            <div key={column.status} className="rounded-lg border border-slate-200 p-3 dark:border-white/5">
              <div className="flex items-center justify-between gap-2">
                <span className={cn("badge", workflowClass[column.status])}>{column.label}</span>
                <span className="text-xs text-slate-500">{column.rows.length}</span>
              </div>
              <ul className="mt-3 space-y-2">
                {column.rows.map((row) => (
                  <li key={row.id} className="text-xs text-slate-600 dark:text-slate-300">
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      {row.vanId} · {row.zoneLabel}
                    </p>
                    <p>
                      {row.routeCode} · {formatUsd(row.estimated_cost)}
                    </p>
                  </li>
                ))}
                {column.rows.length === 0 && <li className="text-xs text-slate-400">None</li>}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Vehicle grounding recommendations</h3>
          <p className="text-xs text-slate-500">Hold these vans before the next wave. Ground-vehicle severity or progressed structural damage.</p>
        </div>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Vehicle</th>
              <th className="px-3 py-2 font-medium">Severity</th>
              <th className="px-3 py-2 font-medium">Workflow</th>
              <th className="px-3 py-2 font-medium">Estimate</th>
              <th className="px-5 py-2 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {view.grounding.map((row) => (
              <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {row.vanId} · {row.zoneLabel}
                  </p>
                  <p className="text-xs text-slate-500">
                    {row.stationCode} · {row.damage_type}
                  </p>
                </td>
                <td className="px-3 py-3">
                  <span className={cn("badge", scoreClass[row.severity_score])}>{SEVERITY_SCORE_LABEL[row.severity_score]}</span>
                </td>
                <td className="px-3 py-3">
                  <span className={cn("badge", workflowClass[row.workflow_status])}>{WORKFLOW_LABEL[row.workflow_status]}</span>
                </td>
                <td className="px-3 py-3 tabular-nums">{formatUsd(row.estimated_cost)}</td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{row.grounding_reason ?? "Ground before next wave."}</td>
              </tr>
            ))}
            {view.grounding.length === 0 && (
              <tr>
                <td className="px-5 py-6 text-sm text-slate-500" colSpan={5}>
                  No grounding recommendations.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Driver accountability</h3>
          <p className="text-xs text-slate-500">
            Previous driver, current driver, route assignment, and open investigation status.
          </p>
        </div>
        <DamageReportTable rows={view.reportRows} empty="No damage events in the current filter." />
      </div>

      <div className="card mt-4">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Before and after photos</h3>
          <p className="text-xs text-slate-500">Baseline prior-DVIC photo vs the finding that opened the event. Placeholders carry embedding refs for later AI comparison.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {view.pairs.slice(0, 6).map((row) => (
            <div key={row.id}>
              <p className="mb-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                {row.vanId} · {row.zoneLabel} · {formatUsd(row.estimated_cost)}
              </p>
              <DamagePhotoPair before={row.beforePhoto} after={row.afterPhoto} zone={row.zoneLabel} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card overflow-x-auto">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Unresolved damage</h3>
            <p className="text-xs text-slate-500">Open events with estimated and actual repair cost</p>
          </div>
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Event</th>
                <th className="px-3 py-2 font-medium">Shop</th>
                <th className="px-3 py-2 font-medium">Estimate</th>
                <th className="px-5 py-2 font-medium">Actual</th>
              </tr>
            </thead>
            <tbody>
              {view.unresolved.map((row) => (
                <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {row.vanId} · {row.zoneLabel}
                    </p>
                    <p className="text-xs text-slate-500">
                      {row.responsibleName} · {WORKFLOW_LABEL[row.workflow_status]}
                      {row.workOrder ? ` · ${row.workOrder}` : ""}
                    </p>
                  </td>
                  <td className="px-3 py-3 capitalize">{row.repair?.status ?? "unquoted"}</td>
                  <td className="px-3 py-3 tabular-nums">{formatUsd(row.estimated_cost)}</td>
                  <td className="px-5 py-3 tabular-nums">{row.actualCost === null ? "—" : formatUsd(row.actualCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ChartCard title="Repair cost trends" subtitle="Quoted vs actual by scheduled week" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={view.repairTrend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis dataKey="week" stroke={chart.axis} fontSize={12} />
              <YAxis stroke={chart.axis} fontSize={12} />
              <Tooltip contentStyle={chart.tooltip} cursor={{ fill: chart.cursor }} />
              <Legend />
              <Bar dataKey="quoted" fill="#ff9900" radius={[4, 4, 0, 0]} name="Quoted" />
              <Bar dataKey="actual" fill="#146eb4" radius={[4, 4, 0, 0]} name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card overflow-x-auto">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Damage by driver</h3>
            <p className="text-xs text-slate-500">Cost by driver — estimated and actual repair cost</p>
          </div>
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Driver</th>
                <th className="px-3 py-2 font-medium">Events</th>
                <th className="px-3 py-2 font-medium">New</th>
                <th className="px-3 py-2 font-medium">Estimate</th>
                <th className="px-5 py-2 font-medium">Actual</th>
              </tr>
            </thead>
            <tbody>
              {view.byDriver.map((row) => (
                <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{row.name}</td>
                  <td className="px-3 py-3 tabular-nums">{row.events}</td>
                  <td className="px-3 py-3 tabular-nums">{row.newThisWeek}</td>
                  <td className="px-3 py-3 tabular-nums">{formatUsd(row.estimated)}</td>
                  <td className="px-5 py-3 tabular-nums">{formatUsd(row.actual)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card overflow-x-auto">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Damage by vehicle</h3>
            <p className="text-xs text-slate-500">Cost by vehicle — estimated and actual repair cost</p>
          </div>
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Van</th>
                <th className="px-3 py-2 font-medium">Events</th>
                <th className="px-3 py-2 font-medium">Open</th>
                <th className="px-3 py-2 font-medium">Estimate</th>
                <th className="px-5 py-2 font-medium">Actual</th>
              </tr>
            </thead>
            <tbody>
              {view.byVehicle.map((row) => (
                <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{row.vanId}</p>
                    <p className="text-xs text-slate-500">{row.stationCode}</p>
                  </td>
                  <td className="px-3 py-3 tabular-nums">{row.events}</td>
                  <td className="px-3 py-3 tabular-nums">{row.unresolved}</td>
                  <td className="px-3 py-3 tabular-nums">{formatUsd(row.estimated)}</td>
                  <td className="px-5 py-3 tabular-nums">{formatUsd(row.actual)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mt-4">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Vehicle damage timeline</h3>
          <p className="text-xs text-slate-500">DVIC history, damage history, and repair history on one chain per van</p>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-white/5">
          {view.vehicleTimelines.map((vehicle) => (
            <section key={vehicle.vehicleId} className="px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {vehicle.vanId} · {vehicle.stationCode}
                </h4>
                <p className="text-xs text-slate-500">
                  {vehicle.dvicCount} DVIC · {vehicle.damageCount} damage · {vehicle.repairCount} repair
                </p>
              </div>
              <ul className="mt-3 space-y-2">
                {vehicle.entries.slice(0, 8).map((entry) => (
                  <li key={`${entry.kind}-${entry.id}`} className="flex flex-wrap items-start gap-2 text-sm">
                    <span
                      className={cn(
                        "badge",
                        entry.kind === "dvic" ? "badge-info" : entry.kind === "damage" ? "badge-warning" : "badge-success",
                      )}
                    >
                      {entry.kind === "dvic" ? "DVIC" : entry.kind === "damage" ? "Damage" : "Repair"}
                    </span>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{entry.title}</p>
                      <p className="text-xs text-slate-500">
                        {entry.at.replace("T", " ").slice(0, 16)} · {entry.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <div className="card mt-4">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Damage photo storage</h3>
          <p className="text-xs text-slate-500">
            Object-store paths plus embedding placeholders for future AI photo comparison ({view.totals.photoCount} files)
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {view.photos.map((photo) => (
            <article key={photo.id} className="rounded-lg border border-slate-200 p-3 dark:border-white/5">
              <div className="flex h-24 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-500 dark:bg-ink-800">
                {ZONE_LABEL[photo.zone]} · {photo.camera_angle}
              </div>
              <p className="mt-2 truncate text-[11px] text-slate-500">{photo.storage_bucket}/{photo.storage_path}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {photo.is_baseline ? "Baseline" : "Current"} · {photo.embedding_status}
                {photo.similarity_score !== null ? ` · sim ${photo.similarity_score.toFixed(2)}` : ""}
                {photo.change_confidence !== null ? ` · Δ ${photo.change_confidence.toFixed(2)}` : ""}
              </p>
              {photo.ai_notes && <p className="mt-1 text-xs text-slate-500">{photo.ai_notes}</p>}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
