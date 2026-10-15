import { format, parseISO } from "date-fns";
import rawWeeks from "@/lib/data/seed/scorecard/weeks.json";
import { gradeByThreshold } from "@/lib/scorecard";
import type {
  ScorecardCategory,
  ScorecardCategoryId,
  ScorecardMetric,
  ScorecardSnapshot,
  ScorecardThresholds,
  ScorecardTier,
  ScorecardValueKind,
} from "@/lib/types";

/**
 * Weekly DSP Console Performance Summary captures.
 * Weeks 42–52 are 2025. Weeks 1–41 are 2026. Week 42 of 2026 is not published.
 * Week 38 keeps the fresher `capturedAt` from this seed when the standing matches
 * the earlier in-repo capture.
 */

interface RawMetric {
  name: string;
  value: number | string;
  tier: string;
  unit?: string;
}

interface RawWeek {
  week: string;
  period: string;
  station: string;
  capturedAt: string;
  loginRequired?: boolean;
  overallStanding: { value: number; tier: string; note?: string };
  metrics: RawMetric[];
}

interface MetricTemplate {
  id: string;
  key: string;
  name: string;
  shortName: string;
  description: string;
  category: ScorecardCategoryId;
  unit: ScorecardValueKind;
  unitSuffix?: string;
  higherIsBetter: boolean;
  thresholds: ScorecardThresholds | null;
}

const CATEGORY_ROWS: Record<string, ScorecardCategoryId> = {
  "Safety and Compliance": "safety_compliance",
  Quality: "quality",
  "Service Reliability": "service_reliability",
};

const TIER_BY_LABEL: Record<string, ScorecardTier> = {
  "Fantastic Plus": "fantastic_plus",
  Fantastic: "fantastic",
  Great: "great",
  Fair: "fair",
  Poor: "poor",
};

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

export const SCORECARD_DISCLAIMER =
  "Values pulled from Amazon DSP Console → Performance Summary for CJMK Inc. / DNA4 Memphis, Week 37 (Sep 6–12, 2026). Fantastic / Great / Fair / Poor threshold bands shown on each tile are illustrative only — Amazon does not publish the exact numeric cutoffs in Console. Badges match the standing Amazon displayed. No prior-week comparison was shown in that summary.";

export const SCORECARD_WEEK38_DISCLAIMER =
  "Week 38 Sep 13–19 DNA4 from Console Performance Summary. Values pulled from Amazon DSP Console → Performance Summary for CJMK Inc. / DNA4 Memphis. Fantastic / Great / Fair / Poor threshold bands shown on each tile are illustrative only — Amazon does not publish the exact numeric cutoffs in Console. Badges match the standing Amazon displayed. No prior-week comparison was shown in that summary.";

const ILLUSTRATIVE_TAIL =
  "Values pulled from Amazon DSP Console → Performance Summary for CJMK Inc. / DNA4 Memphis. Fantastic / Great / Fair / Poor threshold bands shown on each tile are illustrative only — Amazon does not publish the exact numeric cutoffs in Console. Badges match the standing Amazon displayed. No prior-week comparison was shown in that summary.";

const TEMPLATES: MetricTemplate[] = [
  {
    id: "on-road-safety",
    key: "on_road_safety_score",
    name: "On-Road Safety Score",
    shortName: "On-road",
    description: "Amazon on-road safety standing. Numeric score was not shown in Console.",
    category: "safety_compliance",
    unit: "score",
    higherIsBetter: true,
    thresholds: null,
  },
  {
    id: "safe-driving",
    key: "safe_driving_metric",
    name: "Safe Driving Metric",
    shortName: "Safe driving",
    description: "Safe driving standing from DSP Console.",
    category: "safety_compliance",
    unit: "score",
    higherIsBetter: true,
    thresholds: null,
  },
  {
    id: "seatbelt",
    key: "seatbelt_off_rate",
    name: "Seatbelt-Off Rate",
    shortName: "Seatbelt",
    description: "Seatbelt-off events per 100 trips.",
    category: "safety_compliance",
    unit: "rate",
    unitSuffix: "events/100 trips",
    higherIsBetter: false,
    thresholds: { fantastic: 1, great: 2, fair: 4 },
  },
  {
    id: "speeding",
    key: "speeding_event_rate",
    name: "Speeding Event Rate",
    shortName: "Speeding",
    description: "Speeding events logged on-road this scorecard week.",
    category: "safety_compliance",
    unit: "rate",
    unitSuffix: "events/100 trips",
    higherIsBetter: false,
    thresholds: { fantastic: 2, great: 4, fair: 8 },
  },
  {
    id: "distractions",
    key: "distractions_rate",
    name: "Distractions Rate",
    shortName: "Distractions",
    description: "Device / distraction events this scorecard week.",
    category: "safety_compliance",
    unit: "rate",
    unitSuffix: "events/100 trips",
    higherIsBetter: false,
    thresholds: { fantastic: 3, great: 6, fair: 10 },
  },
  {
    id: "following",
    key: "following_distance_rate",
    name: "Following Distance Rate",
    shortName: "Following",
    description: "Following-distance events this scorecard week.",
    category: "safety_compliance",
    unit: "rate",
    unitSuffix: "events/100 trips",
    higherIsBetter: false,
    thresholds: { fantastic: 1, great: 2, fair: 4 },
  },
  {
    id: "sign-signal",
    key: "sign_signal_violations",
    name: "Sign/Signal Violations",
    shortName: "Sign/signal",
    description: "Stop-sign and signal violation rate this scorecard week.",
    category: "safety_compliance",
    unit: "rate",
    unitSuffix: "events/100 trips",
    higherIsBetter: false,
    thresholds: { fantastic: 8, great: 12, fair: 20 },
  },
  {
    id: "working-device",
    key: "working_device_metric",
    name: "Working Device Metric (Preview)",
    shortName: "Working device",
    description: "Working device preview metric from DSP Console.",
    category: "safety_compliance",
    unit: "score",
    higherIsBetter: true,
    thresholds: null,
  },
  {
    id: "boc",
    key: "breach_of_contract",
    name: "Breach of Contract",
    shortName: "BOC",
    description: "Contract compliance standing from DSP Console.",
    category: "safety_compliance",
    unit: "compliance",
    higherIsBetter: true,
    thresholds: null,
  },
  {
    id: "audit",
    key: "comprehensive_audit",
    name: "Comprehensive Audit",
    shortName: "Audit",
    description: "Comprehensive audit standing from DSP Console.",
    category: "safety_compliance",
    unit: "compliance",
    higherIsBetter: true,
    thresholds: null,
  },
  {
    id: "delivery-quality",
    key: "overall_delivery_quality_score",
    name: "Overall Delivery Quality Score",
    shortName: "Delivery quality",
    description: "Amazon overall delivery quality standing. Numeric score was not shown in Console.",
    category: "quality",
    unit: "score",
    higherIsBetter: true,
    thresholds: null,
  },
  {
    id: "dcr-dpmo",
    key: "delivery_completion_dpmo",
    name: "Delivery Completion DPMO",
    shortName: "DCR DPMO",
    description: "Delivery completion defects per million opportunities.",
    category: "quality",
    unit: "dpmo",
    unitSuffix: "DPMO",
    higherIsBetter: false,
    thresholds: { fantastic: 2500, great: 4000, fair: 6000 },
  },
  {
    id: "dsb",
    key: "delivery_success_behaviors",
    name: "Delivery Success Behaviors",
    shortName: "DSB",
    description: "Delivery success-behavior score from DSP Console.",
    category: "quality",
    unit: "score",
    higherIsBetter: true,
    thresholds: { fantastic: 100, great: 50, fair: 25 },
  },
  {
    id: "customer-experience",
    key: "customer_delivery_experience",
    name: "Customer Delivery Experience",
    shortName: "Experience",
    description: "Customer delivery experience standing from DSP Console. Numeric score was not shown in Console.",
    category: "quality",
    unit: "score",
    higherIsBetter: true,
    thresholds: null,
  },
  {
    id: "ced-dpmo",
    key: "customer_escalation_defect_dpmo",
    name: "Customer Escalation Defect DPMO",
    shortName: "CED DPMO",
    description: "Customer escalation defects per million opportunities.",
    category: "quality",
    unit: "dpmo",
    unitSuffix: "DPMO",
    higherIsBetter: false,
    thresholds: { fantastic: 0, great: 50, fair: 150 },
  },
  {
    id: "cdf-dpmo",
    key: "cdf_dpmo",
    name: "Customer Delivery Feedback (CDF DPMO)",
    shortName: "CDF",
    description: "Customer Delivery Feedback defects per million opportunities.",
    category: "quality",
    unit: "dpmo",
    unitSuffix: "DPMO",
    higherIsBetter: false,
    thresholds: { fantastic: 500, great: 1500, fair: 3000 },
  },
  {
    id: "pod",
    key: "pod_acceptance_rate",
    name: "POD Acceptance Rate",
    shortName: "POD",
    description: "Photo-on-delivery captures accepted this scorecard week.",
    category: "quality",
    unit: "percent",
    higherIsBetter: true,
    thresholds: { fantastic: 98, great: 95, fair: 90 },
  },
  {
    id: "pickup-quality",
    key: "overall_pickup_quality_score",
    name: "Overall Pickup Quality Score",
    shortName: "Pickup quality",
    description: "Amazon overall pickup quality standing from DSP Console.",
    category: "quality",
    unit: "score",
    higherIsBetter: true,
    thresholds: null,
  },
  {
    id: "psb",
    key: "pickup_success_behaviors",
    name: "Pickup Success Behaviors",
    shortName: "PSB",
    description: "Pickup success-behavior score from DSP Console.",
    category: "quality",
    unit: "score",
    higherIsBetter: false,
    thresholds: { fantastic: 0, great: 1, fair: 3 },
  },
  {
    id: "service-score",
    key: "overall_service_reliability_score",
    name: "Overall Service Reliability Score",
    shortName: "Service score",
    description: "Amazon service reliability standing. Numeric score was not shown in Console.",
    category: "service_reliability",
    unit: "score",
    higherIsBetter: true,
    thresholds: null,
  },
  {
    id: "fleet-exec",
    key: "fleet_execution",
    name: "Fleet Execution",
    shortName: "Fleet exec",
    description: "Fleet execution standing from DSP Console.",
    category: "service_reliability",
    unit: "score",
    higherIsBetter: true,
    thresholds: { fantastic: 2, great: 1.5, fair: 1 },
  },
  {
    id: "tenured",
    key: "tenured_workforce",
    name: "Tenured Workforce",
    shortName: "Tenure",
    description: "Share of the workforce Amazon counts as tenured.",
    category: "service_reliability",
    unit: "percent",
    higherIsBetter: true,
    thresholds: { fantastic: 90, great: 80, fair: 70 },
  },
];

const TEMPLATE_BY_NAME = new Map(TEMPLATES.map((template) => [template.name, template]));

export interface ScorecardWeekOption {
  week: ScorecardWeek;
  label: string;
  /** Calendar year of the week's last day. 2025 weeks are 42–52. */
  year: number;
  start: string;
  end: string;
}

interface BuiltWeek {
  snapshot: ScorecardSnapshot;
  option: ScorecardWeekOption;
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parsePeriod(period: string) {
  const match =
    /^([A-Za-z]+)\s+(\d{1,2})(?:,\s*(\d{4}))?\s+-\s+([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/.exec(
      period.trim()
    );
  if (!match) throw new Error(`Unparsed scorecard period: ${period}`);
  const [, startMonth, startDay, startYear, endMonth, endDay, endYearText] = match;
  const endYear = Number(endYearText);
  const start = isoDate(
    startYear ? Number(startYear) : endYear,
    monthNumber(startMonth),
    Number(startDay)
  );
  const end = isoDate(endYear, monthNumber(endMonth), Number(endDay));
  if (start > end) throw new Error(`Scorecard period ${period} ends before it starts.`);
  return { start, end };
}

function monthNumber(name: string) {
  const month = MONTHS[name.slice(0, 3).toLowerCase()];
  if (!month) throw new Error(`Unknown scorecard month ${name}`);
  return month;
}

/** Same span shape as the station period labels: Sep 6–12, Oct 26–Nov 1. */
function formatSpan(start: string, end: string) {
  const a = parseISO(start);
  const b = parseISO(end);
  if (start === end) return format(a, "MMM d, yyyy");
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) {
    return `${format(a, "MMM d")}–${format(b, "d")}`;
  }
  if (a.getFullYear() === b.getFullYear()) {
    return `${format(a, "MMM d")}–${format(b, "MMM d")}`;
  }
  return `${format(a, "MMM d, yyyy")}–${format(b, "MMM d, yyyy")}`;
}

function periodLabel(start: string, end: string) {
  const span = formatSpan(start, end);
  const year = end.slice(0, 4);
  if (start.slice(0, 4) === year && !span.includes(year)) return `${span}, ${year}`;
  return span;
}

/** Dropdown label. 2025 weeks keep the year in the text. */
export function scorecardWeekLabel(week: number, start: string, end: string) {
  const a = parseISO(start);
  const b = parseISO(end);
  const left = a.getFullYear() === b.getFullYear() ? format(a, "MMM d") : format(a, "MMM d, yyyy");
  return `Week ${week} · ${left} – ${format(b, "MMM d, yyyy")}`;
}

function toTier(label: string, context: string): ScorecardTier {
  const tier = TIER_BY_LABEL[label];
  if (!tier) throw new Error(`Unknown scorecard tier "${label}" on ${context}`);
  return tier;
}

function digitsOf(value: number) {
  const text = String(value);
  const dot = text.indexOf(".");
  if (dot === -1 || text.includes("e")) return 0;
  return text.length - dot - 1;
}

function noDataDescription(template: MetricTemplate, weekNumber: number) {
  if (template.id === "safe-driving") return `DSP Console showed No Data for Week ${weekNumber}.`;
  if (template.id === "working-device") {
    return `DSP Console showed No Data for this preview metric in Week ${weekNumber}.`;
  }
  return `DSP Console showed No Data for Week ${weekNumber}.`;
}

function clearDisagreeingThresholds(metric: ScorecardMetric): ScorecardMetric {
  const graded = gradeByThreshold(metric);
  if (metric.reportedTier && graded && graded !== metric.reportedTier) {
    return { ...metric, thresholds: null };
  }
  return metric;
}

function buildMetric(template: MetricTemplate, raw: RawMetric, weekNumber: number): ScorecardMetric {
  const context = `Week ${weekNumber} ${template.name}`;
  const noData = raw.tier === "No Data" || raw.value === "No Data";
  if (noData) {
    return {
      ...template,
      description: noDataDescription(template, weekNumber),
      unit: "unavailable",
      current: null,
      prior: null,
      thresholds: null,
      reportedTier: null,
    };
  }

  if (raw.tier === "Compliant" || raw.value === "Compliant" || raw.tier === "Noncompliant" || raw.value === "Noncompliant") {
    const compliant = raw.tier === "Compliant" || raw.value === "Compliant";
    return {
      ...template,
      unit: "compliance",
      current: null,
      prior: null,
      thresholds: null,
      reportedTier: null,
      compliance: compliant ? "compliant" : "noncompliant",
    };
  }

  const reportedTier = toTier(raw.tier, context);
  if (typeof raw.value === "number") {
    return clearDisagreeingThresholds({
      ...template,
      digits: digitsOf(raw.value),
      current: raw.value,
      prior: null,
      reportedTier,
    });
  }

  if (raw.value !== raw.tier) {
    throw new Error(`${context} value ${JSON.stringify(raw.value)} does not match tier ${raw.tier}.`);
  }
  return {
    ...template,
    current: null,
    prior: null,
    thresholds: null,
    reportedTier,
  };
}

function disclaimerFor(weekNumber: number, start: string, end: string) {
  if (weekNumber === 37) return SCORECARD_DISCLAIMER;
  if (weekNumber === 38) return SCORECARD_WEEK38_DISCLAIMER;
  return `Week ${weekNumber} ${formatSpan(start, end)} DNA4 from Console Performance Summary. ${ILLUSTRATIVE_TAIL}`;
}

function weekNumberOf(label: string) {
  const match = /^Week (\d{1,2})$/.exec(label.trim());
  if (!match) throw new Error(`Unparsed scorecard week label: ${label}`);
  return Number(match[1]);
}

function buildWeek(raw: RawWeek): BuiltWeek {
  if (raw.station !== "DNA4") throw new Error(`Scorecard station ${raw.station} is not DNA4.`);
  const weekNumber = weekNumberOf(raw.week);
  const { start, end } = parsePeriod(raw.period);
  const year = Number(end.slice(0, 4));
  if (weekNumber === 42 && year === 2026) {
    throw new Error("Week 42 of 2026 has not been published. Do not seed it.");
  }

  const byName = new Map(raw.metrics.map((metric) => [metric.name, metric]));
  const categories: ScorecardCategory[] = (
    [
      ["safety_compliance", "Safety and Compliance"],
      ["quality", "Quality"],
      ["service_reliability", "Service Reliability"],
    ] as const
  ).map(([id, name]) => {
    const row = byName.get(name);
    if (!row) throw new Error(`Week ${weekNumber} is missing ${name}.`);
    return { id, name, tier: toTier(row.tier, `Week ${weekNumber} ${name}`) };
  });

  const metrics = TEMPLATES.map((template) => {
    const row = byName.get(template.name);
    if (!row) throw new Error(`Week ${weekNumber} is missing ${template.name}.`);
    return buildMetric(template, row, weekNumber);
  });

  const known = new Set<string>([...Object.keys(CATEGORY_ROWS), ...TEMPLATE_BY_NAME.keys()]);
  for (const metric of raw.metrics) {
    if (!known.has(metric.name)) throw new Error(`Week ${weekNumber} has unmapped metric ${metric.name}.`);
  }

  const snapshot: ScorecardSnapshot = {
    weekNumber,
    weekLabel: `Week ${weekNumber}`,
    periodLabel: periodLabel(start, end),
    priorWeekLabel: null,
    asOf: raw.capturedAt,
    overallScore: raw.overallStanding.value,
    overallTier: toTier(raw.overallStanding.tier, `Week ${weekNumber} overall`),
    overallNote: raw.overallStanding.note ?? null,
    categories,
    metrics,
    disclaimer: disclaimerFor(weekNumber, start, end),
  };

  return {
    snapshot,
    option: {
      week: weekNumber as ScorecardWeek,
      label: scorecardWeekLabel(weekNumber, start, end),
      year,
      start,
      end,
    },
  };
}

const built = (rawWeeks as RawWeek[])
  .map(buildWeek)
  .sort((a, b) => b.option.end.localeCompare(a.option.end) || b.option.start.localeCompare(a.option.start));

if (built.length !== 52) {
  throw new Error(`Expected 52 scorecard weeks, found ${built.length}.`);
}

const weekNumbers = built.map((week) => week.snapshot.weekNumber);
if (new Set(weekNumbers).size !== weekNumbers.length) {
  throw new Error("Scorecard week numbers must stay unique. Week 42 of 2026 is not published.");
}

/** Newest Console week first. Week 41 (Oct 4–10, 2026) leads until Amazon publishes Week 42. */
export const SCORECARD_WEEKS: readonly number[] = weekNumbers;

export type ScorecardWeek = number;

export const DEFAULT_SCORECARD_WEEK = built[0].snapshot.weekNumber;

const BY_WEEK = new Map<number, ScorecardSnapshot>(
  built.map((week) => [week.snapshot.weekNumber, week.snapshot])
);

const OPTIONS: ScorecardWeekOption[] = built.map((week) => week.option);

export const SCORECARD_COVERAGE: Record<number, { start: string; end: string; label: string }> =
  Object.fromEntries(
    OPTIONS.map((option) => [
      option.week,
      {
        start: option.start,
        end: option.end,
        label: `Seeded data: Week ${option.week}, ${formatSpan(option.start, option.end)}`,
      },
    ])
  );

export function scorecardWeekOptions() {
  return OPTIONS;
}

export function scorecardWeekHref(week: number) {
  return `/scorecard?week=${week}`;
}

export function parseScorecardWeek(value: string | string[] | undefined | null): number {
  const raw = (Array.isArray(value) ? value[0] : value)?.trim();
  if (!raw || !/^\d{1,2}$/.test(raw)) return DEFAULT_SCORECARD_WEEK;
  const week = Number(raw);
  return BY_WEEK.has(week) ? week : DEFAULT_SCORECARD_WEEK;
}

export function getScorecardSnapshot(week: number = DEFAULT_SCORECARD_WEEK) {
  return BY_WEEK.get(week) ?? BY_WEEK.get(DEFAULT_SCORECARD_WEEK)!;
}

/** Capture time of the newest published week. Refresh compares against this, not the week on screen. */
export function newestScorecardCapturedAt() {
  return getScorecardSnapshot(DEFAULT_SCORECARD_WEEK).asOf;
}

export const scorecardWeek37 = getScorecardSnapshot(37);
export const scorecardWeek38 = getScorecardSnapshot(38);

/** @deprecated Week 37 snapshot. The default is the newest Console week. */
export const scorecard = scorecardWeek37;
