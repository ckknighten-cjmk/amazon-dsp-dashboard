import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import DamagePhotoPair from "../components/DamagePhotoPair";
import DamageReportTable from "../components/DamageReportTable";
import { useAuth } from "../lib/auth";
import { useData } from "../lib/data";
import {
  buildDamageIntelligence,
  DAMAGE_TYPE_LABEL,
  INVESTIGATION_LABEL,
  SEVERITY_SCORE_LABEL,
  WORKFLOW_LABEL,
  WORKFLOW_NEXT,
} from "../lib/damage";
import { cn } from "../lib/cn";
import { formatDate, formatUsd } from "../lib/format";
import type { DamageSeverityScore, DamageWorkflowStatus, InvestigationStatus } from "../types/database";

const severityClass: Record<DamageSeverityScore, string> = {
  minor: "badge-info",
  moderate: "badge-warning",
  severe: "badge-danger",
  ground_vehicle: "badge-danger",
};

const investigationClass: Record<InvestigationStatus, string> = {
  open: "badge-danger",
  pending_driver: "badge-warning",
  charged: "badge-danger",
  cleared: "badge-success",
  closed: "badge-neutral",
};

const workflowClass: Record<DamageWorkflowStatus, string> = {
  new: "badge-danger",
  under_review: "badge-warning",
  approved: "badge-info",
  scheduled_repair: "badge-info",
  repaired: "badge-success",
};

interface ReportOverride {
  workflow_status: DamageWorkflowStatus;
  investigation_status: InvestigationStatus;
  grounding_recommended: boolean;
}

export default function DamageReport() {
  const { filtered } = useData();
  const { user } = useAuth();
  const view = buildDamageIntelligence(filtered);
  const [overrides, setOverrides] = useState<Record<string, ReportOverride>>({});
  const canManage = user?.role === "owner" || user?.role === "operations_manager" || user?.role === "safety_manager";

  const rows = useMemo(
    () =>
      view.reportRows.map((row) => {
        const override = overrides[row.id];
        return override ? { ...row, ...override } : row;
      }),
    [overrides, view.reportRows],
  );

  return (
    <div>
      <PageHeader
        title="New Damage Report"
        description="Vehicle, date damage detected, previous driver, current driver, route, damage type, and open investigation status."
      >
        <div className="flex gap-4">
          <Link to="/damage" className="text-sm font-medium text-brand-blue">
            Damage board
          </Link>
          <Link to="/damage/pipeline" className="text-sm font-medium text-brand-blue">
            Photo pipeline
          </Link>
        </div>
      </PageHeader>

      <div className="card overflow-x-auto">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Damage report</h3>
          <p className="text-xs text-slate-500">
            {view.totals.openInvestigations} open investigations · {rows.length} events
          </p>
        </div>
        <DamageReportTable rows={rows} empty="No damage events in the current filter." />
      </div>

      <div className="mt-4 space-y-4">
        {rows.map((row) => {
          const nextWorkflow = WORKFLOW_NEXT[row.workflow_status];
          return (
            <article key={row.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {row.vanId} · {row.zoneLabel} · {row.damage_type}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">{row.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={cn("badge", severityClass[row.severity_score])}>{SEVERITY_SCORE_LABEL[row.severity_score]}</span>
                  <span className={cn("badge", workflowClass[row.workflow_status])}>{WORKFLOW_LABEL[row.workflow_status]}</span>
                  <span className={cn("badge", investigationClass[row.investigation_status])}>
                    {INVESTIGATION_LABEL[row.investigation_status]}
                  </span>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 xl:grid-cols-7">
                <Field label="Vehicle" value={`${row.vanId} · ${row.stationCode}`} />
                <Field label="Date damage detected" value={`${formatDate(row.detectedDate)} · ${row.detectedDate}`} />
                <Field label="Previous driver" value={row.priorDriverName} />
                <Field label="Current driver" value={row.currentDriverName} />
                <Field label="Route" value={row.routeCode} />
                <Field label="Damage type" value={DAMAGE_TYPE_LABEL[row.damage_type]} />
                <Field label="Open investigation status" value={INVESTIGATION_LABEL[row.investigation_status]} />
              </dl>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <Field label="Estimated repair" value={formatUsd(row.estimated_cost)} />
                <Field label="Actual repair" value={row.actualCost === null ? "Pending" : formatUsd(row.actualCost)} />
                <Field label="Approval workflow" value={WORKFLOW_LABEL[row.workflow_status]} />
              </dl>

              <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Before and after photos</p>
                  <DamagePhotoPair before={row.beforePhoto} after={row.afterPhoto} zone={row.zoneLabel} />
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Grounding</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {row.grounding_recommended ? row.grounding_reason ?? "Ground this van before the next wave." : "No grounding recommended."}
                  </p>
                  {canManage && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-md bg-rose-600 px-2 py-1 text-xs font-medium text-white"
                        onClick={() =>
                          setOverrides((current) => ({
                            ...current,
                            [row.id]: {
                              workflow_status: row.workflow_status,
                              investigation_status: row.investigation_status,
                              grounding_recommended: true,
                            },
                          }))
                        }
                      >
                        Recommend ground
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white"
                        onClick={() =>
                          setOverrides((current) => ({
                            ...current,
                            [row.id]: {
                              workflow_status: row.workflow_status,
                              investigation_status: "charged",
                              grounding_recommended: row.grounding_recommended,
                            },
                          }))
                        }
                      >
                        Charge driver
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs dark:border-white/10"
                        onClick={() =>
                          setOverrides((current) => ({
                            ...current,
                            [row.id]: {
                              workflow_status: row.workflow_status,
                              investigation_status: "cleared",
                              grounding_recommended: row.grounding_recommended,
                            },
                          }))
                        }
                      >
                        Clear driver
                      </button>
                      {nextWorkflow && (
                        <button
                          type="button"
                          className="rounded-md bg-brand-blue px-2 py-1 text-xs font-medium text-white"
                          onClick={() =>
                            setOverrides((current) => ({
                              ...current,
                              [row.id]: {
                                workflow_status: nextWorkflow,
                                investigation_status: nextWorkflow === "repaired" ? "closed" : row.investigation_status,
                                grounding_recommended: nextWorkflow === "repaired" ? false : row.grounding_recommended,
                              },
                            }))
                          }
                        >
                          Advance to {WORKFLOW_LABEL[nextWorkflow]}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900 dark:text-white">{value}</dd>
    </div>
  );
}
