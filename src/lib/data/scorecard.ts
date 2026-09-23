import type { ScorecardMetric, ScorecardSnapshot } from "@/lib/types";
import { gradeByThreshold } from "@/lib/scorecard";

export const SCORECARD_WEEKS = [38, 37] as const;
export type ScorecardWeek = (typeof SCORECARD_WEEKS)[number];

export const SCORECARD_DISCLAIMER =
  "Values pulled from Amazon DSP Console → Performance Summary for CJMK Inc. / DNA4 Memphis, Week 37 (Sep 6–12, 2026). Fantastic / Great / Fair / Poor threshold bands shown on each tile are illustrative only — Amazon does not publish the exact numeric cutoffs in Console. Badges match the standing Amazon displayed. No prior-week comparison was shown in that summary.";

export const SCORECARD_WEEK38_DISCLAIMER =
  "Week 38 Sep 13–19 DNA4 from Console Performance Summary. Values pulled from Amazon DSP Console → Performance Summary for CJMK Inc. / DNA4 Memphis. Fantastic / Great / Fair / Poor threshold bands shown on each tile are illustrative only — Amazon does not publish the exact numeric cutoffs in Console. Badges match the standing Amazon displayed. No prior-week comparison was shown in that summary.";

function metric(partial: Omit<ScorecardMetric, "prior">): ScorecardMetric {
  return { ...partial, prior: null };
}

export const scorecardMetrics: ScorecardMetric[] = [
  metric({
    id: "on-road-safety",
    key: "on_road_safety_score",
    name: "On-Road Safety Score",
    shortName: "On-road",
    description: "Amazon on-road safety standing. Numeric score was not shown in Console.",
    category: "safety_compliance",
    unit: "score",
    current: null,
    higherIsBetter: true,
    thresholds: null,
    reportedTier: "fantastic",
  }),
  metric({
    id: "safe-driving",
    key: "safe_driving_metric",
    name: "Safe Driving Metric",
    shortName: "Safe driving",
    description: "DSP Console showed No Data for Week 37.",
    category: "safety_compliance",
    unit: "unavailable",
    current: null,
    higherIsBetter: true,
    thresholds: null,
    reportedTier: null,
  }),
  metric({
    id: "seatbelt",
    key: "seatbelt_off_rate",
    name: "Seatbelt-Off Rate",
    shortName: "Seatbelt",
    description: "Seatbelt-off events per 100 trips.",
    category: "safety_compliance",
    unit: "rate",
    unitSuffix: "events/100 trips",
    digits: 1,
    current: 0.5,
    higherIsBetter: false,
    thresholds: { fantastic: 1, great: 2, fair: 4 },
    reportedTier: "fantastic",
  }),
  metric({
    id: "speeding",
    key: "speeding_event_rate",
    name: "Speeding Event Rate",
    shortName: "Speeding",
    description: "Speeding events logged on-road this scorecard week.",
    category: "safety_compliance",
    unit: "rate",
    digits: 1,
    current: 1.4,
    higherIsBetter: false,
    thresholds: { fantastic: 2, great: 4, fair: 8 },
    reportedTier: "fantastic",
  }),
  metric({
    id: "distractions",
    key: "distractions_rate",
    name: "Distractions Rate",
    shortName: "Distractions",
    description: "Device / distraction events this scorecard week.",
    category: "safety_compliance",
    unit: "rate",
    digits: 1,
    current: 2.4,
    higherIsBetter: false,
    thresholds: { fantastic: 3, great: 6, fair: 10 },
    reportedTier: "fantastic",
  }),
  metric({
    id: "following",
    key: "following_distance_rate",
    name: "Following Distance Rate",
    shortName: "Following",
    description: "Following-distance events this scorecard week.",
    category: "safety_compliance",
    unit: "rate",
    digits: 1,
    current: 0.5,
    higherIsBetter: false,
    thresholds: { fantastic: 1, great: 2, fair: 4 },
    reportedTier: "fantastic",
  }),
  metric({
    id: "sign-signal",
    key: "sign_signal_violations",
    name: "Sign/Signal Violations",
    shortName: "Sign/signal",
    description: "Stop-sign and signal violation rate this scorecard week.",
    category: "safety_compliance",
    unit: "rate",
    digits: 1,
    current: 5.6,
    higherIsBetter: false,
    thresholds: { fantastic: 8, great: 12, fair: 20 },
    reportedTier: "fantastic",
  }),
  metric({
    id: "working-device",
    key: "working_device_metric",
    name: "Working Device Metric (Preview)",
    shortName: "Working device",
    description: "DSP Console showed No Data for this preview metric in Week 37.",
    category: "safety_compliance",
    unit: "unavailable",
    current: null,
    higherIsBetter: true,
    thresholds: null,
    reportedTier: null,
  }),
  metric({
    id: "boc",
    key: "breach_of_contract",
    name: "Breach of Contract",
    shortName: "BOC",
    description: "Contract compliance standing from DSP Console.",
    category: "safety_compliance",
    unit: "compliance",
    current: null,
    higherIsBetter: true,
    thresholds: null,
    reportedTier: null,
    compliance: "compliant",
  }),
  metric({
    id: "audit",
    key: "comprehensive_audit",
    name: "Comprehensive Audit",
    shortName: "Audit",
    description: "Comprehensive audit standing from DSP Console.",
    category: "safety_compliance",
    unit: "compliance",
    current: null,
    higherIsBetter: true,
    thresholds: null,
    reportedTier: null,
    compliance: "compliant",
  }),
  metric({
    id: "dcr-dpmo",
    key: "delivery_completion_dpmo",
    name: "Delivery Completion DPMO",
    shortName: "DCR DPMO",
    description: "Delivery completion defects per million opportunities.",
    category: "quality",
    unit: "dpmo",
    unitSuffix: "DPMO",
    digits: 1,
    current: 1953.7,
    higherIsBetter: false,
    thresholds: { fantastic: 2500, great: 4000, fair: 6000 },
    reportedTier: "fantastic",
  }),
  metric({
    id: "dsb",
    key: "delivery_success_behaviors",
    name: "Delivery Success Behaviors",
    shortName: "DSB",
    description: "Delivery success-behavior score from DSP Console.",
    category: "quality",
    unit: "score",
    digits: 0,
    current: 145,
    higherIsBetter: true,
    thresholds: { fantastic: 100, great: 50, fair: 25 },
    reportedTier: "fantastic",
  }),
  metric({
    id: "ced-dpmo",
    key: "customer_escalation_defect_dpmo",
    name: "Customer Escalation Defect DPMO",
    shortName: "CED DPMO",
    description: "Customer escalation defects per million opportunities.",
    category: "quality",
    unit: "dpmo",
    unitSuffix: "DPMO",
    digits: 0,
    current: 0,
    higherIsBetter: false,
    thresholds: { fantastic: 0, great: 50, fair: 150 },
    reportedTier: "fantastic",
  }),
  metric({
    id: "cdf-dpmo",
    key: "cdf_dpmo",
    name: "CDF DPMO",
    shortName: "CDF",
    description: "Customer Delivery Feedback defects per million opportunities.",
    category: "quality",
    unit: "dpmo",
    unitSuffix: "DPMO",
    digits: 0,
    current: 1048,
    higherIsBetter: false,
    thresholds: { fantastic: 500, great: 1500, fair: 3000 },
    reportedTier: "great",
  }),
  metric({
    id: "pod",
    key: "pod_acceptance_rate",
    name: "POD Acceptance Rate",
    shortName: "POD",
    description: "Photo-on-delivery captures accepted this scorecard week.",
    category: "quality",
    unit: "percent",
    digits: 1,
    current: 99.3,
    higherIsBetter: true,
    thresholds: { fantastic: 98, great: 95, fair: 90 },
    reportedTier: "fantastic",
  }),
  metric({
    id: "psb",
    key: "pickup_success_behaviors",
    name: "Pickup Success Behaviors",
    shortName: "PSB",
    description: "Pickup success-behavior score from DSP Console.",
    category: "quality",
    unit: "score",
    digits: 2,
    current: 0,
    higherIsBetter: false,
    thresholds: { fantastic: 0, great: 1, fair: 3 },
    reportedTier: "fantastic",
  }),
  metric({
    id: "fleet-exec",
    key: "fleet_execution",
    name: "Fleet Execution",
    shortName: "Fleet exec",
    description: "Fleet execution standing from DSP Console.",
    category: "service_reliability",
    unit: "score",
    digits: 2,
    current: 2.22,
    higherIsBetter: true,
    thresholds: { fantastic: 2, great: 1.5, fair: 1 },
    reportedTier: "fantastic",
  }),
  metric({
    id: "tenured",
    key: "tenured_workforce",
    name: "Tenured Workforce",
    shortName: "Tenure",
    description: "Share of the workforce Amazon counts as tenured.",
    category: "service_reliability",
    unit: "percent",
    digits: 1,
    current: 94.4,
    higherIsBetter: true,
    thresholds: { fantastic: 90, great: 80, fair: 70 },
    reportedTier: "fantastic",
  }),
];

const categories = [
  { id: "safety_compliance" as const, name: "Safety and Compliance", tier: "fantastic" as const },
  { id: "quality" as const, name: "Quality", tier: "fantastic" as const },
  { id: "service_reliability" as const, name: "Service Reliability", tier: "fantastic" as const },
];

export const scorecardWeek37: ScorecardSnapshot = {
  weekNumber: 37,
  weekLabel: "Week 37",
  periodLabel: "Sep 6–12, 2026",
  priorWeekLabel: null,
  asOf: "2026-09-12T23:59:00",
  overallScore: 85.8,
  overallTier: "fantastic",
  categories,
  metrics: scorecardMetrics,
  disclaimer: SCORECARD_DISCLAIMER,
};

/**
 * Week 38 Console Performance Summary, captured 2026-09-23.
 * Numbers and tiers are the capture. Illustrative bands that would grade a
 * value differently from Amazon's displayed tier are omitted.
 */
const WEEK38_PATCH: Record<string, Partial<ScorecardMetric>> = {
  "safe-driving": {
    description: "DSP Console showed No Data for Week 38.",
  },
  seatbelt: { current: 0 },
  speeding: { current: 3.6 },
  distractions: { current: 2.3 },
  following: { current: 0 },
  "sign-signal": { current: 1.8 },
  "working-device": {
    description: "DSP Console showed No Data for this preview metric in Week 38.",
  },
  "dcr-dpmo": { current: 4166.9, reportedTier: "great" },
  dsb: { current: 119 },
  "cdf-dpmo": { current: 1360 },
  pod: { current: 99.46, digits: 2 },
  tenured: { current: 94.01, digits: 2 },
};

function week38Metric(metric: ScorecardMetric): ScorecardMetric {
  const next: ScorecardMetric = { ...metric, ...WEEK38_PATCH[metric.id], prior: null };
  const graded = gradeByThreshold(next);
  if (next.reportedTier && graded && graded !== next.reportedTier) {
    return { ...next, thresholds: null };
  }
  return next;
}

for (const id of Object.keys(WEEK38_PATCH)) {
  if (!scorecardMetrics.some((metric) => metric.id === id)) {
    throw new Error(`Week 38 scorecard patch has no Week 37 metric ${id}.`);
  }
}

export const scorecardWeek38: ScorecardSnapshot = {
  weekNumber: 38,
  weekLabel: "Week 38",
  periodLabel: "Sep 13–19, 2026",
  priorWeekLabel: null,
  asOf: "2026-09-23T12:01:44.632Z",
  overallScore: 84,
  overallTier: "fantastic",
  categories,
  metrics: scorecardMetrics.map(week38Metric),
  disclaimer: SCORECARD_WEEK38_DISCLAIMER,
};

const BY_WEEK: Record<ScorecardWeek, ScorecardSnapshot> = {
  37: scorecardWeek37,
  38: scorecardWeek38,
};

export function parseScorecardWeek(value: string | string[] | undefined | null): ScorecardWeek {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "37" ? 37 : 38;
}

export function getScorecardSnapshot(week: ScorecardWeek = 38) {
  return BY_WEEK[week];
}

/** @deprecated Week 37 snapshot. Week 38 is the default via getScorecardSnapshot. */
export const scorecard = scorecardWeek37;
