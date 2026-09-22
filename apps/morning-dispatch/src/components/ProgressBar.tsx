import { cn } from "../lib/cn";

export default function ProgressBar({
  value,
  tone = "ok",
}: {
  value: number;
  tone?: "ok" | "warn" | "bad";
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "ok" && "bg-emerald-500",
            tone === "warn" && "bg-amber-500",
            tone === "bad" && "bg-rose-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-slate-500">{pct}%</span>
    </div>
  );
}
