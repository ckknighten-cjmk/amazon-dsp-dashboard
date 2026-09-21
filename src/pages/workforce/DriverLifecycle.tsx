import type { ReactNode } from "react";
import ProgressBar from "../../components/ProgressBar";
import StatCard from "../../components/StatCard";
import { useData } from "../../lib/data";
import { buildDriverLifecycle } from "../../lib/workforce";
import { cn } from "../../lib/cn";
import { employmentClass, trainingStatusClass } from "../../lib/statusStyles";
import { formatPct } from "../../lib/format";

export default function DriverLifecycle() {
  const { filtered } = useData();
  const view = buildDriverLifecycle(filtered);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {view.kpis.map((kpi) => (
          <StatCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <LifecycleColumn
          title="Driver onboarding"
          subtitle="New-hire training to first solo route"
          empty="No DAs in onboarding for this station filter."
        >
          {view.onboarding.map((driver) => (
            <article key={driver.id} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{driver.full_name}</p>
                  <p className="text-xs text-slate-500">
                    {driver.stationCode} · hired {driver.hire_date} · {driver.source}
                  </p>
                </div>
                <span className={cn("badge capitalize", employmentClass[driver.employment_status])}>
                  {driver.employment_status}
                </span>
              </div>
              <div className="mt-3">
                <ProgressBar value={driver.pct} tone={driver.pct >= 0.7 ? "ok" : driver.pct >= 0.4 ? "warn" : "bad"} />
              </div>
              <ul className="mt-3 space-y-1.5">
                {driver.records.map((record) => (
                  <li key={record.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-slate-700 dark:text-slate-300">{record.course}</span>
                    <span className={cn("badge capitalize", trainingStatusClass[record.status])}>
                      {record.status.replace("_", " ")}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </LifecycleColumn>

        <LifecycleColumn
          title="Driver offboarding"
          subtitle="Exit checklist, van turn-in, and final pay"
          empty="No offboarding in progress."
        >
          {view.offboarding.map((driver) => (
            <article key={driver.id} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{driver.full_name}</p>
                  <p className="text-xs text-slate-500">
                    {driver.stationCode} · {driver.employee_code}
                  </p>
                </div>
                <span className={cn("badge capitalize", employmentClass[driver.employment_status])}>
                  {driver.employment_status}
                </span>
              </div>
              <div className="mt-3">
                <ProgressBar value={driver.pct} tone={driver.pct >= 0.7 ? "ok" : "warn"} />
              </div>
              <ul className="mt-3 space-y-1.5">
                {driver.records
                  .filter((record) => record.category === "offboarding")
                  .map((record) => (
                    <li key={record.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{record.course}</span>
                      <span className={cn("badge capitalize", trainingStatusClass[record.status])}>
                        {record.status.replace("_", " ")}
                      </span>
                    </li>
                  ))}
              </ul>
            </article>
          ))}
          {view.terminated.map((driver) => (
            <article key={driver.id} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{driver.full_name}</p>
                  <p className="text-xs text-slate-500">Separated {driver.termination_date} · {driver.stationCode}</p>
                </div>
                <span className={cn("badge capitalize", employmentClass.terminated)}>terminated</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">Offboarding checklist complete.</p>
            </article>
          ))}
        </LifecycleColumn>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card overflow-x-auto">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Training completion</h3>
            <p className="text-xs text-slate-500">Required courses across onboarding, safety, compliance, and offboarding</p>
          </div>
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Course</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Done</th>
                <th className="px-5 py-2 font-medium">Overdue</th>
              </tr>
            </thead>
            <tbody>
              {view.courses.map((row) => (
                <tr key={row.course} className="border-t border-slate-200 dark:border-white/5">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{row.course}</td>
                  <td className="px-3 py-3 capitalize">{row.category}</td>
                  <td className="px-3 py-3 tabular-nums">
                    {row.completed}/{row.total} · {formatPct(row.pct * 100)}
                  </td>
                  <td className="px-5 py-3 tabular-nums">{row.overdue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Overdue training</h3>
            <p className="text-xs text-slate-500">Past-due required courses</p>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-white/5">
            {view.overdue.length === 0 && <li className="px-5 py-6 text-sm text-slate-500">No overdue training.</li>}
            {view.overdue.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{row.driverName}</p>
                  <p className="text-xs text-slate-500">
                    {row.stationCode} · {row.course} · due {row.due_date}
                  </p>
                </div>
                <span className={cn("badge", trainingStatusClass.overdue)}>Overdue</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function LifecycleColumn({
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
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-xs text-slate-500">{subtitle}</p>
      <div className="mt-4 space-y-3">{children || <p className="text-sm text-slate-500">{empty}</p>}</div>
    </div>
  );
}
