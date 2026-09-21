import type { Recommendation, Standing, WarningSeverity } from "./types";

export const standingStyles: Record<Standing, string> = {
  fantastic: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  great: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  fair: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  poor: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
};

export const standingText: Record<Standing, string> = {
  fantastic: "text-emerald-600 dark:text-emerald-400",
  great: "text-sky-600 dark:text-sky-400",
  fair: "text-amber-600 dark:text-amber-400",
  poor: "text-rose-600 dark:text-rose-400",
};

export const priorityStyles: Record<Recommendation["priority"], string> = {
  high: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  low: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
};

export const severityStyles: Record<WarningSeverity, string> = {
  critical: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20",
  watch: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
  info: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/20",
};

export function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatContribution(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(3)}`;
}
