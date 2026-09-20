import { cn } from "../lib/cn";
import type { DamagePhoto } from "../types/database";

export default function DamagePhotoPair({
  before,
  after,
  zone,
}: {
  before: DamagePhoto | null;
  after: DamagePhoto | null;
  zone: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <PhotoCard label="Before" photo={before} zone={zone} tone="before" />
      <PhotoCard label="After" photo={after} zone={zone} tone="after" />
    </div>
  );
}

function PhotoCard({
  label,
  photo,
  zone,
  tone,
}: {
  label: string;
  photo: DamagePhoto | null;
  zone: string;
  tone: "before" | "after";
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-white/5">
      <div
        className={cn(
          "flex h-24 items-center justify-center px-2 text-center text-[11px] font-medium",
          tone === "before" ? "bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300",
        )}
      >
        {label}
        <br />
        {zone}
        {photo ? ` · ${photo.camera_angle}` : ""}
      </div>
      <div className="px-2 py-1.5 text-[10px] text-slate-500">
        {photo ? (
          <>
            <p className="truncate">{photo.storage_path.split("/").slice(-1)[0]}</p>
            {photo.similarity_score !== null && (
              <p>
                sim {photo.similarity_score.toFixed(2)}
                {photo.change_confidence !== null ? ` · Δ ${photo.change_confidence.toFixed(2)}` : ""}
              </p>
            )}
          </>
        ) : (
          <p>No photo on file</p>
        )}
      </div>
    </div>
  );
}
