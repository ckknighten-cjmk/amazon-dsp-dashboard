import ChartCard from "../../components/ChartCard";
import StatCard from "../../components/StatCard";
import { useData } from "../../lib/data";
import { buildRecruitingPipeline } from "../../lib/workforce";
import { cn } from "../../lib/cn";
import { interviewResultClass, recruitingStageClass, recruitingStatusClass } from "../../lib/statusStyles";

export default function RecruitingPipeline() {
  const { filtered } = useData();
  const view = buildRecruitingPipeline(filtered);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {view.kpis.map((kpi) => (
          <StatCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {view.columns.map((column) => (
          <div key={column.stage} className="card flex min-h-[280px] flex-col p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{column.label}</h3>
              <span className="text-xs text-slate-500">{column.candidates.length}</span>
            </div>
            <ul className="space-y-2">
              {column.candidates.length === 0 && <li className="text-xs text-slate-500">Empty</li>}
              {column.candidates.map((candidate) => (
                <li key={candidate.id} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{candidate.full_name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {candidate.stationCode} · {candidate.source}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{candidate.notes}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className={cn("badge capitalize", recruitingStatusClass[candidate.status])}>{candidate.status}</span>
                    {candidate.nextInterview && (
                      <span className={cn("badge capitalize", interviewResultClass[candidate.nextInterview.result])}>
                        {candidate.nextInterview.stage.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard title="Closed / withdrawn" subtitle="Not advancing" className="xl:col-span-1">
          <ul className="space-y-3">
            {view.closed.map((row) => (
              <li key={row.id} className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{row.full_name}</p>
                    <p className="text-xs text-slate-500">{row.notes}</p>
                  </div>
                  <span className={cn("badge capitalize", recruitingStageClass[row.stage])}>{row.stage}</span>
                </div>
              </li>
            ))}
          </ul>
        </ChartCard>

        <div className="card overflow-x-auto xl:col-span-2">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Interview stages</h3>
            <p className="text-xs text-slate-500">Phone screen, ops interview, ride-along, background, offer review</p>
          </div>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Candidate</th>
                <th className="px-3 py-2 font-medium">Stage</th>
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Interviewer</th>
                <th className="px-5 py-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {view.interviewRows.map((row) => (
                <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{row.candidateName}</p>
                    <p className="text-xs text-slate-500">
                      {row.stationCode} · {row.source}
                    </p>
                  </td>
                  <td className="px-3 py-3 capitalize">{row.stage.replace("_", " ")}</td>
                  <td className="px-3 py-3 text-xs">{row.scheduled_at.replace("T", " ").slice(0, 16)}</td>
                  <td className="px-3 py-3">{row.interviewer}</td>
                  <td className="px-5 py-3">
                    <span className={cn("badge capitalize", interviewResultClass[row.result])}>
                      {row.result.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
