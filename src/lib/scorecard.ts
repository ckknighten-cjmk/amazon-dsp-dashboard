import type { ScorecardMetric, ScorecardTier } from "@/lib/types";

/**
 * Illustrative DSP scorecard bands used when Amazon did not publish a
 * numeric threshold. Badges prefer `reportedTier` from DSP Console.
 */
export function gradeMetric(metric: ScorecardMetric): ScorecardTier | null {
  if (metric.unit === "unavailable" || metric.unit === "compliance") return null;
  if (metric.reportedTier) return metric.reportedTier;
  if (metric.current == null || !metric.thresholds) return null;

  const { current, higherIsBetter, thresholds } = metric;
  if (higherIsBetter) {
    if (current >= thresholds.fantastic) return "fantastic";
    if (current >= thresholds.great) return "great";
    if (current >= thresholds.fair) return "fair";
    return "poor";
  }
  if (current <= thresholds.fantastic) return "fantastic";
  if (current <= thresholds.great) return "great";
  if (current <= thresholds.fair) return "fair";
  return "poor";
}

export function metricDelta(metric: ScorecardMetric): number | null {
  if (metric.current == null || metric.prior == null) return null;
  return metric.current - metric.prior;
}
