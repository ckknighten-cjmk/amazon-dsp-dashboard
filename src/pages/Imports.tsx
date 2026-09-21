import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { useData } from "../lib/data";
import { buildImports } from "../lib/aggregations";
import { cn } from "../lib/cn";
import { importClass } from "../lib/statusStyles";

export default function Imports() {
  const { filtered } = useData();
  const view = buildImports(filtered);
  const [ran, setRan] = useState<Record<string, string>>({});

  return (
    <div>
      <PageHeader
        title="Data Integration"
        description="Placeholders for Amazon scorecard, payroll, fuel-card, and fleet-maintenance imports. Demo mode stages a run without a live connector."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi label="Connectors" value={String(view.jobs.length)} />
        <Kpi label="Ready / mapped" value={String(view.ready)} />
        <Kpi label="Records imported" value={String(view.imported)} hint={view.failed ? `${view.failed} failed last cycle` : "Last successful cycle"} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {view.jobs.map((job) => (
          <article key={job.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{job.label}</h3>
                <p className="mt-1 text-xs text-slate-500">{job.connector}</p>
              </div>
              <span className={cn("badge capitalize", importClass[ran[job.id] ? "imported" : job.status])}>
                {ran[job.id] ? "imported" : job.status}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{job.mapping_notes}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
              <div>
                <dt>Last run</dt>
                <dd className="mt-0.5 text-slate-800 dark:text-slate-200">{ran[job.id] ?? job.last_run_at?.replace("T", " ").slice(0, 16) ?? "Never"}</dd>
              </div>
              <div>
                <dt>Next run</dt>
                <dd className="mt-0.5 text-slate-800 dark:text-slate-200">{job.next_run_at?.replace("T", " ").slice(0, 16) ?? "Unscheduled"}</dd>
              </div>
              <div>
                <dt>Imported</dt>
                <dd className="mt-0.5 text-slate-800 dark:text-slate-200">{ran[job.id] ? job.records_imported + 8 : job.records_imported}</dd>
              </div>
              <div>
                <dt>Failed</dt>
                <dd className="mt-0.5 text-slate-800 dark:text-slate-200">{job.records_failed}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="mt-4 rounded-md bg-brand-blue px-3 py-1.5 text-xs font-medium text-white"
              onClick={() => setRan((current) => ({ ...current, [job.id]: "2026-09-20 19:30" }))}
            >
              Run import (demo)
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="stat-label">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
