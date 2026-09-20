import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import DamagePhotoPair from "../components/DamagePhotoPair";
import CvPipelineStepper from "../components/CvPipelineStepper";
import { useData } from "../lib/data";
import {
  CV_PIPELINE_STEPS,
  buildCvPipelineBoard,
  pipelineForPhoto,
  resolveUploadPipeline,
  runningStatuses,
  type CvStageStatus,
} from "../lib/cvPipeline";
import { ZONE_LABEL } from "../lib/damage";
import { cn } from "../lib/cn";

export default function DamagePipeline() {
  const { filtered } = useData();
  const board = useMemo(() => buildCvPipelineBoard(filtered), [filtered]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [statuses, setStatuses] = useState<CvStageStatus[]>(CV_PIPELINE_STEPS.map(() => "pending"));
  const [details, setDetails] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const result = fileName && done ? resolveUploadPipeline(fileName, filtered) : null;
  const resultSteps = result ? pipelineForPhoto(result) : null;
  const baseline = result
    ? filtered.damagePhotos.find((photo) => photo.id === result.compared_to_photo_id) ?? null
    : null;

  useEffect(() => {
    if (activeIndex < 0 || !fileName || done) return;
    const photo = resolveUploadPipeline(fileName, filtered);
    const resolved = pipelineForPhoto(photo);
    setStatuses(runningStatuses(activeIndex));
    const timer = window.setTimeout(() => {
      if (activeIndex >= CV_PIPELINE_STEPS.length - 1) {
        setStatuses(resolved.map((step) => step.status));
        setDetails(resolved.map((step) => step.detail));
        setDone(true);
        return;
      }
      setActiveIndex((index) => index + 1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [activeIndex, done, fileName, filtered]);

  return (
    <div>
      <PageHeader
        title="Photo Pipeline"
        description="Photo upload → computer vision analysis → damage location detection → compare to previous photos → potential new damage alert."
      >
        <Link to="/damage" className="text-sm font-medium text-brand-blue">
          Damage board
        </Link>
      </PageHeader>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Computer vision flow</h3>
        <p className="mt-1 text-xs text-slate-500">
          {board.uploaded} uploaded · {board.analyzed} analyzed · {board.compared} compared · {board.alertCount} new-damage alerts
        </p>
        <div className="mt-4">
          <CvPipelineStepper
            statuses={done && resultSteps ? resultSteps.map((step) => step.status) : statuses}
            details={done && resultSteps ? resultSteps.map((step) => step.detail) : details}
            activeIndex={activeIndex < 0 ? undefined : activeIndex}
          />
        </div>
      </div>

      <div className="card mt-4 p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Photo upload</h3>
        <p className="mt-1 text-xs text-slate-500">
          Demo analysis maps the file name to a seeded DVIC pair (try <code>ev-210-door.jpg</code> or <code>ev-224-quarter.jpg</code>).
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="image/*"
            className="text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-blue file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white dark:text-slate-300"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setFileName(file?.name ?? null);
              setActiveIndex(-1);
              setDone(false);
              setStatuses(CV_PIPELINE_STEPS.map(() => "pending"));
              setDetails([]);
            }}
          />
          <button
            type="button"
            className="rounded-md bg-brand-blue px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            disabled={!fileName || (activeIndex >= 0 && !done)}
            onClick={() => {
              setDone(false);
              setDetails([]);
              setActiveIndex(0);
            }}
          >
            Run pipeline
          </button>
          {fileName && <span className="text-xs text-slate-500">{fileName}</span>}
        </div>

        {result && resultSteps && (
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Compare to previous photos</p>
              <DamagePhotoPair before={baseline} after={result} zone={ZONE_LABEL[result.zone]} />
            </div>
            <div className={cn("rounded-lg border p-4", resultSteps[4].status === "alert" ? "border-rose-400/40 bg-rose-500/10" : "border-slate-200 dark:border-white/5")}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Potential new damage alert</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                {ZONE_LABEL[result.zone]} · {result.camera_angle}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{result.ai_notes ?? "Comparison complete."}</p>
              <p className="mt-2 text-xs text-slate-500">
                {result.compared_to_photo_id ? `Matched ${result.compared_to_photo_id}` : "No prior photo"}
                {result.similarity_score !== null ? ` · sim ${result.similarity_score.toFixed(2)}` : ""}
                {result.change_confidence !== null ? ` · Δ ${result.change_confidence.toFixed(2)}` : ""}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="card mt-4 overflow-x-auto">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Potential new damage alerts</h3>
          <p className="text-xs text-slate-500">Photos where computer vision found a high-confidence change vs the prior DVIC.</p>
        </div>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Vehicle</th>
              <th className="px-3 py-2 font-medium">Location</th>
              <th className="px-3 py-2 font-medium">Δ confidence</th>
              <th className="px-5 py-2 font-medium">Alert</th>
            </tr>
          </thead>
          <tbody>
            {board.alerts.map((row) => (
              <tr key={row.photo.id} className="border-t border-slate-200 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{row.vanId}</td>
                <td className="px-3 py-3 capitalize">{row.zone.replace(/_/g, " ")}</td>
                <td className="px-3 py-3 tabular-nums">{(row.photo.change_confidence ?? 0).toFixed(2)}</td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{row.notes ?? "Potential new damage"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
