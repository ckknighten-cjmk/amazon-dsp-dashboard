import { ArrowDown, ArrowRight } from "lucide-react";
import { CV_PIPELINE_STEPS, type CvStageStatus } from "../lib/cvPipeline";
import { cn } from "../lib/cn";

const statusClass: Record<CvStageStatus, string> = {
  pending: "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-ink-800 dark:text-slate-400",
  running: "border-brand-blue/40 bg-brand-blue/10 text-brand-blue",
  complete: "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  skipped: "border-slate-200 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-ink-800",
  alert: "border-rose-400/50 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

export default function CvPipelineStepper({
  statuses,
  details,
  activeIndex,
}: {
  statuses?: CvStageStatus[];
  details?: string[];
  activeIndex?: number;
}) {
  return (
    <ol className="flex flex-col gap-2 xl:flex-row xl:items-stretch">
      {CV_PIPELINE_STEPS.map((step, index) => {
        const status = statuses?.[index] ?? (activeIndex === undefined ? "pending" : index < activeIndex ? "complete" : index === activeIndex ? "running" : "pending");
        return (
          <li key={step.id} className="flex flex-1 flex-col xl:flex-row xl:items-stretch">
            <div className={cn("flex min-h-[5.5rem] flex-1 flex-col rounded-lg border px-3 py-3", statusClass[status])}>
              <p className="text-[11px] font-semibold uppercase tracking-wide">
                {index + 1}. {step.label}
              </p>
              <p className="mt-1 text-xs capitalize">{status === "alert" ? "Alert" : status}</p>
              {details?.[index] && <p className="mt-1 text-[11px] leading-snug opacity-80">{details[index]}</p>}
            </div>
            {index < CV_PIPELINE_STEPS.length - 1 && (
              <div className="flex items-center justify-center px-1 py-1 text-slate-400 xl:px-2">
                <ArrowDown className="h-4 w-4 xl:hidden" aria-hidden />
                <ArrowRight className="hidden h-4 w-4 xl:block" aria-hidden />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
