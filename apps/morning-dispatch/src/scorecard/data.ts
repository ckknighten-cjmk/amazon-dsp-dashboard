import { buildScorecard, weightedFleetMetrics } from "./engine";
import type {
  DriverScorecardRow,
  MetricKey,
  PeriodType,
  RouteScorecardRow,
  Scorecard,
  ScorecardHistoryPoint,
} from "./types";

export const STATION_ID = "DLA7";
export const STATION_NAME = "DLA7 – Los Angeles";

export const driverRows: DriverScorecardRow[] = [
  {
    driverId: "DRV-1103",
    driverName: "J. Nakamura",
    primaryRoute: "CX-07",
    packagesDelivered: 2100,
    stopsCompleted: 1680,
    metrics: { dcr: 99.82, pod: 99.1, cdf: 95.4, fico: 882, safety: 96, dnr: 0.06, dsc: 99.6, ce: 97.2 },
  },
  {
    driverId: "DRV-1042",
    driverName: "M. Alvarez",
    primaryRoute: "CX-14",
    packagesDelivered: 1980,
    stopsCompleted: 1590,
    metrics: { dcr: 99.71, pod: 98.4, cdf: 94.1, fico: 868, safety: 94, dnr: 0.08, dsc: 99.4, ce: 96.5 },
  },
  {
    driverId: "DRV-1244",
    driverName: "T. Morales",
    primaryRoute: "CX-12",
    packagesDelivered: 1850,
    stopsCompleted: 1480,
    metrics: { dcr: 99.64, pod: 97.8, cdf: 96.2, fico: 854, safety: 92, dnr: 0.09, dsc: 99.1, ce: 97.8 },
  },
  {
    driverId: "DRV-1177",
    driverName: "D. Okafor",
    primaryRoute: "CX-05",
    packagesDelivered: 1760,
    stopsCompleted: 1410,
    metrics: { dcr: 99.48, pod: 97.2, cdf: 91.6, fico: 841, safety: 89, dnr: 0.14, dsc: 98.7, ce: 94.8 },
  },
  {
    driverId: "DRV-1088",
    driverName: "K. Osei",
    primaryRoute: "CX-22",
    packagesDelivered: 1720,
    stopsCompleted: 1375,
    metrics: { dcr: 99.36, pod: 96.4, cdf: 90.2, fico: 829, safety: 86, dnr: 0.18, dsc: 98.2, ce: 93.6 },
  },
  {
    driverId: "DRV-1201",
    driverName: "L. Chen",
    primaryRoute: "CX-18",
    packagesDelivered: 1640,
    stopsCompleted: 1320,
    metrics: { dcr: 99.12, pod: 93.1, cdf: 86.4, fico: 818, safety: 84, dnr: 0.22, dsc: 97.1, ce: 91.2 },
  },
  {
    driverId: "DRV-1290",
    driverName: "H. Kim",
    primaryRoute: "CX-41",
    packagesDelivered: 1410,
    stopsCompleted: 1180,
    metrics: { dcr: 98.74, pod: 94.6, cdf: 84.8, fico: 792, safety: 80, dnr: 0.27, dsc: 96.4, ce: 89.8 },
  },
  {
    driverId: "DRV-1261",
    driverName: "R. Singh",
    primaryRoute: "CX-09",
    packagesDelivered: 1580,
    stopsCompleted: 1260,
    metrics: { dcr: 99.05, pod: 96.8, cdf: 88.6, fico: 728, safety: 71, dnr: 0.16, dsc: 97.6, ce: 92.1 },
  },
  {
    driverId: "DRV-1275",
    driverName: "A. Brooks",
    primaryRoute: "CX-27",
    packagesDelivered: 1520,
    stopsCompleted: 1225,
    metrics: { dcr: 98.91, pod: 95.2, cdf: 83.4, fico: 804, safety: 81, dnr: 0.48, dsc: 96.8, ce: 88.4 },
  },
  {
    driverId: "DRV-1156",
    driverName: "S. Petrova",
    primaryRoute: "CX-31",
    packagesDelivered: 1490,
    stopsCompleted: 1210,
    metrics: { dcr: 97.86, pod: 91.4, cdf: 79.8, fico: 746, safety: 73, dnr: 0.52, dsc: 94.9, ce: 86.2 },
  },
];

export const routeRows: RouteScorecardRow[] = [
  {
    routeCode: "CX-07",
    stationId: STATION_ID,
    packagesDelivered: 2100,
    stopsCompleted: 1680,
    riskFactors: ["suburban", "high visibility"],
    metrics: { dcr: 99.82, pod: 99.1, cdf: 95.4, fico: 882, safety: 96, dnr: 0.06, dsc: 99.6, ce: 97.2 },
  },
  {
    routeCode: "CX-14",
    stationId: STATION_ID,
    packagesDelivered: 1980,
    stopsCompleted: 1590,
    riskFactors: ["residential", "well-marked addresses"],
    metrics: { dcr: 99.71, pod: 98.4, cdf: 94.1, fico: 868, safety: 94, dnr: 0.08, dsc: 99.4, ce: 96.5 },
  },
  {
    routeCode: "CX-12",
    stationId: STATION_ID,
    packagesDelivered: 1850,
    stopsCompleted: 1480,
    riskFactors: ["single-family", "customer notes heavy"],
    metrics: { dcr: 99.64, pod: 97.8, cdf: 96.2, fico: 854, safety: 92, dnr: 0.09, dsc: 99.1, ce: 97.8 },
  },
  {
    routeCode: "CX-05",
    stationId: STATION_ID,
    packagesDelivered: 1760,
    stopsCompleted: 1410,
    riskFactors: ["mixed residential"],
    metrics: { dcr: 99.48, pod: 97.2, cdf: 91.6, fico: 841, safety: 89, dnr: 0.14, dsc: 98.7, ce: 94.8 },
  },
  {
    routeCode: "CX-22",
    stationId: STATION_ID,
    packagesDelivered: 1720,
    stopsCompleted: 1375,
    riskFactors: ["townhomes", "shared lockers"],
    metrics: { dcr: 99.36, pod: 96.4, cdf: 90.2, fico: 829, safety: 86, dnr: 0.18, dsc: 98.2, ce: 93.6 },
  },
  {
    routeCode: "CX-18",
    stationId: STATION_ID,
    packagesDelivered: 1640,
    stopsCompleted: 1320,
    riskFactors: ["low-light porches", "narrow streets"],
    metrics: { dcr: 99.12, pod: 93.1, cdf: 86.4, fico: 818, safety: 84, dnr: 0.22, dsc: 97.1, ce: 91.2 },
  },
  {
    routeCode: "CX-41",
    stationId: STATION_ID,
    packagesDelivered: 1410,
    stopsCompleted: 1180,
    riskFactors: ["commercial close windows", "new driver mix"],
    metrics: { dcr: 98.74, pod: 94.6, cdf: 84.8, fico: 792, safety: 80, dnr: 0.27, dsc: 96.4, ce: 89.8 },
  },
  {
    routeCode: "CX-09",
    stationId: STATION_ID,
    packagesDelivered: 1580,
    stopsCompleted: 1260,
    riskFactors: ["highway connectors", "speeding corridors"],
    metrics: { dcr: 99.05, pod: 96.8, cdf: 88.6, fico: 728, safety: 71, dnr: 0.16, dsc: 97.6, ce: 92.1 },
  },
  {
    routeCode: "CX-27",
    stationId: STATION_ID,
    packagesDelivered: 1520,
    stopsCompleted: 1225,
    riskFactors: ["porch theft", "multi-unit entries"],
    metrics: { dcr: 98.91, pod: 95.2, cdf: 83.4, fico: 804, safety: 81, dnr: 0.48, dsc: 96.8, ce: 88.4 },
  },
  {
    routeCode: "CX-31",
    stationId: STATION_ID,
    packagesDelivered: 1490,
    stopsCompleted: 1210,
    riskFactors: ["gated apartments", "failed access codes", "porch theft"],
    metrics: { dcr: 97.86, pod: 91.4, cdf: 79.8, fico: 746, safety: 73, dnr: 0.52, dsc: 94.9, ce: 86.2 },
  },
];

const weeklyCurrentMetrics = weightedFleetMetrics(driverRows);
const weeklyPackages = driverRows.reduce((sum, row) => sum + row.packagesDelivered, 0);

export const weeklyScorecard: Scorecard = buildScorecard({
  id: "sc-weekly-current",
  stationId: STATION_ID,
  stationName: STATION_NAME,
  periodType: "weekly",
  periodStart: "2026-09-14",
  periodEnd: "2026-09-20",
  label: "Week of Sep 14",
  metrics: weeklyCurrentMetrics,
  packagesDelivered: weeklyPackages,
});

const monthlyAdjust: Record<MetricKey, number> = {
  dcr: 0.08,
  pod: 0.7,
  cdf: 0.9,
  fico: 6,
  safety: 1.4,
  dnr: -0.04,
  dsc: 0.35,
  ce: 0.6,
};

export const monthlyScorecard: Scorecard = buildScorecard({
  id: "sc-monthly-current",
  stationId: STATION_ID,
  stationName: STATION_NAME,
  periodType: "monthly",
  periodStart: "2026-09-01",
  periodEnd: "2026-09-20",
  label: "September MTD",
  metrics: applyDelta(weeklyCurrentMetrics, monthlyAdjust),
  packagesDelivered: weeklyPackages * 3,
});

const weeklyDrift: Record<MetricKey, number> = {
  dcr: -0.035,
  pod: -0.28,
  cdf: 0.12,
  fico: -1.6,
  safety: -0.35,
  dnr: 0.018,
  dsc: -0.08,
  ce: -0.11,
};

const monthlyDrift: Record<MetricKey, number> = {
  dcr: -0.05,
  pod: -0.45,
  cdf: 0.35,
  fico: -3.2,
  safety: -0.6,
  dnr: 0.03,
  dsc: -0.12,
  ce: -0.18,
};

export const weeklyHistory: ScorecardHistoryPoint[] = buildHistory(
  "weekly",
  12,
  "2026-09-14",
  weeklyCurrentMetrics,
  weeklyDrift,
);

export const monthlyHistory: ScorecardHistoryPoint[] = buildHistory(
  "monthly",
  6,
  "2026-09-01",
  monthlyScorecard.metrics,
  monthlyDrift,
);

export function scorecardFor(period: PeriodType): Scorecard {
  return period === "weekly" ? weeklyScorecard : monthlyScorecard;
}

export function historyFor(period: PeriodType): ScorecardHistoryPoint[] {
  return period === "weekly" ? weeklyHistory : monthlyHistory;
}

function applyDelta(
  metrics: Record<MetricKey, number>,
  delta: Record<MetricKey, number>,
): Record<MetricKey, number> {
  const next = { ...metrics };
  (Object.keys(delta) as MetricKey[]).forEach((key) => {
    next[key] = Number((metrics[key] + delta[key]).toFixed(key === "dnr" ? 3 : 3));
  });
  return next;
}

function buildHistory(
  periodType: PeriodType,
  count: number,
  latestStart: string,
  latest: Record<MetricKey, number>,
  drift: Record<MetricKey, number>,
): ScorecardHistoryPoint[] {
  const points: ScorecardHistoryPoint[] = [];
  const latestDate = parseIsoDate(latestStart);

  for (let i = count - 1; i >= 0; i -= 1) {
    const start = new Date(latestDate);
    if (periodType === "weekly") start.setDate(latestDate.getDate() - i * 7);
    else start.setMonth(latestDate.getMonth() - i);

    const end = new Date(start);
    if (periodType === "weekly") end.setDate(start.getDate() + 6);
    else {
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
    }

    const metrics = {} as Record<MetricKey, number>;
    (Object.keys(latest) as MetricKey[]).forEach((key) => {
      const wobble = Math.sin(i * 1.35 + key.charCodeAt(0)) * (key === "dnr" ? 0.008 : key === "fico" ? 2.2 : 0.12);
      metrics[key] = Number((latest[key] - drift[key] * i + wobble).toFixed(key === "dnr" ? 3 : 3));
    });

    points.push({
      periodStart: toIsoDate(start),
      periodEnd: toIsoDate(end),
      label: periodType === "weekly" ? weekLabel(start) : monthLabel(start),
      periodType,
      metrics,
    });
  }

  return points;
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function weekLabel(start: Date): string {
  return start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function monthLabel(start: Date): string {
  return start.toLocaleDateString("en-US", { month: "short" });
}
