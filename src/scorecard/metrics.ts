import type { MetricDefinition, MetricKey, Standing } from "./types";

export const METRIC_KEYS: MetricKey[] = [
  "dcr",
  "pod",
  "cdf",
  "fico",
  "safety",
  "dnr",
  "dsc",
  "ce",
];

export const METRIC_CATALOG: Record<MetricKey, MetricDefinition> = {
  dcr: {
    key: "dcr",
    label: "DCR",
    fullName: "Delivery Completion Rate",
    unit: "%",
    polarity: "higher_better",
    description: "Share of assigned packages successfully delivered on the first attempt window.",
    fantastic: 99.5,
    great: 99.0,
    fair: 98.2,
  },
  pod: {
    key: "pod",
    label: "POD",
    fullName: "Photo on Delivery",
    unit: "%",
    polarity: "higher_better",
    description: "Share of eligible stops with a valid, in-policy delivery photo.",
    fantastic: 98.0,
    great: 96.0,
    fair: 93.0,
  },
  cdf: {
    key: "cdf",
    label: "CDF",
    fullName: "Customer Delivery Feedback",
    unit: "%",
    polarity: "higher_better",
    description: "Positive customer feedback rate on delivery placement and courtesy.",
    fantastic: 92.0,
    great: 88.0,
    fair: 82.0,
  },
  fico: {
    key: "fico",
    label: "FICO",
    fullName: "FICO Safe Driving Score",
    unit: "",
    polarity: "higher_better",
    description: "Mentor FICO safe-driving score from speeding, braking, and distraction events.",
    fantastic: 850,
    great: 800,
    fair: 740,
  },
  safety: {
    key: "safety",
    label: "Safety",
    fullName: "Safety Score",
    unit: "",
    polarity: "higher_better",
    description: "Composite station safety standing from events, following distance, and seatbelt compliance.",
    fantastic: 90,
    great: 82,
    fair: 74,
  },
  dnr: {
    key: "dnr",
    label: "DNR",
    fullName: "Delivered-Not-Received",
    unit: "%",
    polarity: "lower_better",
    description: "Packages marked delivered that customers later reported as not received.",
    fantastic: 0.12,
    great: 0.25,
    fair: 0.4,
  },
  dsc: {
    key: "dsc",
    label: "DSC",
    fullName: "Delivery Success Compliance",
    unit: "%",
    polarity: "higher_better",
    description: "Compliance with Amazon delivery-success workflows (contact, access, and exception handling).",
    fantastic: 99.0,
    great: 97.5,
    fair: 95.5,
  },
  ce: {
    key: "ce",
    label: "CE",
    fullName: "Customer Experience",
    unit: "%",
    polarity: "higher_better",
    description: "Composite customer-experience score combining contact quality, placement, and defect rate.",
    fantastic: 95.0,
    great: 92.0,
    fair: 88.0,
  },
};

export const STANDING_POINTS: Record<Standing, number> = {
  fantastic: 100,
  great: 80,
  fair: 55,
  poor: 25,
};

export function evaluateStanding(key: MetricKey, value: number): Standing {
  const def = METRIC_CATALOG[key];
  if (def.polarity === "higher_better") {
    if (value >= def.fantastic) return "fantastic";
    if (value >= def.great) return "great";
    if (value >= def.fair) return "fair";
    return "poor";
  }
  if (value <= def.fantastic) return "fantastic";
  if (value <= def.great) return "great";
  if (value <= def.fair) return "fair";
  return "poor";
}

export function standingFromComposite(score: number): Standing {
  if (score >= 90) return "fantastic";
  if (score >= 75) return "great";
  if (score >= 50) return "fair";
  return "poor";
}

export function formatMetricValue(key: MetricKey, value: number): string {
  const def = METRIC_CATALOG[key];
  if (key === "dnr") return `${value.toFixed(2)}${def.unit}`;
  if (key === "fico" || key === "safety") return value.toFixed(0);
  return `${value.toFixed(1)}${def.unit}`;
}

export function formatDelta(key: MetricKey, delta: number): string {
  const sign = delta > 0 ? "+" : "";
  if (key === "dnr") return `${sign}${delta.toFixed(2)}pp`;
  if (key === "fico" || key === "safety") return `${sign}${delta.toFixed(1)}`;
  return `${sign}${delta.toFixed(2)}pp`;
}

export function isImproving(key: MetricKey, delta: number): boolean {
  const polarity = METRIC_CATALOG[key].polarity;
  if (Math.abs(delta) < 0.0001) return false;
  return polarity === "higher_better" ? delta > 0 : delta < 0;
}

/** Maps a raw metric onto a 0-100 quality index so mixed units can share a chart. */
export function qualityIndex(key: MetricKey, value: number): number {
  const def = METRIC_CATALOG[key];
  if (def.polarity === "higher_better") {
    const floor = def.fair - (def.great - def.fair);
    const span = def.fantastic - floor;
    return Number((Math.min(100, Math.max(0, ((value - floor) / span) * 100))).toFixed(2));
  }
  const ceiling = def.fair + (def.fair - def.great);
  const span = ceiling - def.fantastic;
  return Number((Math.min(100, Math.max(0, ((ceiling - value) / span) * 100))).toFixed(2));
}
