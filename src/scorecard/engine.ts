import { METRIC_CATALOG, METRIC_KEYS, STANDING_POINTS, evaluateStanding, standingFromComposite } from "./metrics";
import type {
  DriverImpact,
  DriverScorecardRow,
  MetricForecast,
  MetricKey,
  Recommendation,
  RouteImpact,
  RouteScorecardRow,
  Scorecard,
  ScorecardHistoryPoint,
  Standing,
  WarningIndicator,
} from "./types";

export function compositeFromMetrics(metrics: Record<MetricKey, number>): number {
  const total = METRIC_KEYS.reduce((sum, key) => {
    return sum + STANDING_POINTS[evaluateStanding(key, metrics[key])];
  }, 0);
  return Number((total / METRIC_KEYS.length).toFixed(2));
}

export function buildScorecard(
  base: Omit<Scorecard, "compositeScore" | "standing" | "metrics"> & {
    metrics: Record<MetricKey, number>;
  },
): Scorecard {
  const compositeScore = compositeFromMetrics(base.metrics);
  return {
    ...base,
    compositeScore,
    standing: standingFromComposite(compositeScore),
  };
}

export function weightedFleetMetrics(rows: DriverScorecardRow[]): Record<MetricKey, number> {
  const totalPackages = rows.reduce((sum, row) => sum + row.packagesDelivered, 0);
  const metrics = {} as Record<MetricKey, number>;
  for (const key of METRIC_KEYS) {
    const raw =
      totalPackages === 0
        ? 0
        : rows.reduce((sum, row) => sum + row.metrics[key] * row.packagesDelivered, 0) / totalPackages;
    metrics[key] = roundMetric(key, raw);
  }
  return metrics;
}

export function analyzeDrivers(
  rows: DriverScorecardRow[],
  fleet: Record<MetricKey, number>,
): DriverImpact[] {
  const totalPackages = rows.reduce((sum, row) => sum + row.packagesDelivered, 0);

  return rows
    .map((row) => {
      const standings = {} as Record<MetricKey, Standing>;
      const contributions = {} as Record<MetricKey, number>;
      for (const key of METRIC_KEYS) {
        standings[key] = evaluateStanding(key, row.metrics[key]);
        contributions[key] = metricContribution(
          key,
          row.metrics[key],
          fleet[key],
          row.packagesDelivered,
          totalPackages,
        );
      }
      const compositeScore = compositeFromMetrics(row.metrics);
      const standing = standingFromComposite(compositeScore);
      const riskReasons = riskReasonsFor(standings, compositeScore, "driver");
      return {
        driverId: row.driverId,
        driverName: row.driverName,
        primaryRoute: row.primaryRoute,
        packagesDelivered: row.packagesDelivered,
        stopsCompleted: row.stopsCompleted,
        metrics: row.metrics,
        standings,
        contributions,
        compositeScore,
        standing,
        atRisk: riskReasons.length > 0,
        riskReasons,
      };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore);
}

export function analyzeRoutes(
  rows: RouteScorecardRow[],
  fleet: Record<MetricKey, number>,
): RouteImpact[] {
  const totalPackages = rows.reduce((sum, row) => sum + row.packagesDelivered, 0);

  return rows
    .map((row) => {
      const standings = {} as Record<MetricKey, Standing>;
      const contributions = {} as Record<MetricKey, number>;
      for (const key of METRIC_KEYS) {
        standings[key] = evaluateStanding(key, row.metrics[key]);
        contributions[key] = metricContribution(
          key,
          row.metrics[key],
          fleet[key],
          row.packagesDelivered,
          totalPackages,
        );
      }
      const compositeScore = compositeFromMetrics(row.metrics);
      const standing = standingFromComposite(compositeScore);
      const riskReasons = riskReasonsFor(standings, compositeScore, "route");
      return {
        routeCode: row.routeCode,
        stationId: row.stationId,
        packagesDelivered: row.packagesDelivered,
        stopsCompleted: row.stopsCompleted,
        metrics: row.metrics,
        standings,
        contributions,
        compositeScore,
        standing,
        highRisk: riskReasons.length > 0,
        riskFactors: row.riskFactors,
        riskReasons,
      };
    })
    .sort((a, b) => a.compositeScore - b.compositeScore);
}

export function topPerformers(drivers: DriverImpact[], limit = 3): DriverImpact[] {
  return drivers.filter((driver) => !driver.atRisk).slice(0, limit);
}

export function atRiskDrivers(drivers: DriverImpact[]): DriverImpact[] {
  return drivers
    .filter((driver) => driver.atRisk)
    .sort((a, b) => a.compositeScore - b.compositeScore);
}

export function highRiskRoutes(routes: RouteImpact[]): RouteImpact[] {
  return routes.filter((route) => route.highRisk);
}

export function generateRecommendations(
  fleet: Record<MetricKey, number>,
  drivers: DriverImpact[],
  routes: RouteImpact[],
): Recommendation[] {
  const recs: Recommendation[] = [];
  recs.push(...dcrRecommendations(fleet, drivers, routes));
  recs.push(...podRecommendations(fleet, drivers, routes));
  recs.push(...cdfRecommendations(fleet, drivers, routes));
  recs.push(...safetyRecommendations(fleet, drivers, routes));
  return recs.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
}

export function forecastMetrics(history: ScorecardHistoryPoint[], horizon = 4): MetricForecast[] {
  return METRIC_KEYS.map((key) => {
    const series = history.map((point) => point.metrics[key]);
    const { slope, intercept } = linearRegression(series);
    const residuals = series.map((value, index) => value - (intercept + slope * index));
    const std = standardDeviation(residuals);
    const current = series[series.length - 1] ?? 0;
    const forecast = Array.from({ length: horizon }, (_, offset) => {
      const x = series.length + offset;
      const value = roundMetric(key, intercept + slope * x);
      const band = Math.max(std * 1.64, key === "dnr" ? 0.02 : 0.15);
      return {
        label: `W+${offset + 1}`,
        value,
        lower: roundMetric(key, value - band),
        upper: roundMetric(key, value + band),
      };
    });

    return {
      key,
      history: history.map((point) => ({ label: point.label, actual: point.metrics[key] })),
      forecast,
      slope,
      projectedStanding: evaluateStanding(key, forecast[forecast.length - 1]?.value ?? current),
      currentStanding: evaluateStanding(key, current),
    };
  });
}

export function warningIndicators(forecasts: MetricForecast[]): WarningIndicator[] {
  const warnings: WarningIndicator[] = [];

  for (const forecast of forecasts) {
    const def = METRIC_CATALOG[forecast.key];
    const latest = forecast.history[forecast.history.length - 1]?.actual ?? 0;
    const projected = forecast.forecast[forecast.forecast.length - 1]?.value ?? latest;
    const worsening =
      def.polarity === "higher_better" ? forecast.slope < 0 : forecast.slope > 0;
    const standingDrop = standingRank(forecast.projectedStanding) > standingRank(forecast.currentStanding);

    if (forecast.currentStanding === "poor") {
      warnings.push({
        id: `${forecast.key}-poor`,
        severity: "critical",
        metric: forecast.key,
        title: `${def.label} is Poor`,
        detail: `${def.fullName} is currently ${formatEngineValue(forecast.key, latest)}, below the Fair threshold.`,
      });
    } else if (standingDrop) {
      warnings.push({
        id: `${forecast.key}-drop`,
        severity: "critical",
        metric: forecast.key,
        title: `${def.label} projected to drop to ${capitalize(forecast.projectedStanding)}`,
        detail: `Trend slope ${formatSlope(forecast.key, forecast.slope)} takes ${def.label} from ${capitalize(forecast.currentStanding)} to ${capitalize(forecast.projectedStanding)} within four weeks.`,
      });
    } else if (worsening && approachingThreshold(forecast.key, latest, projected)) {
      warnings.push({
        id: `${forecast.key}-watch`,
        severity: "watch",
        metric: forecast.key,
        title: `${def.label} trending toward the next tier`,
        detail: `${def.fullName} is moving ${formatSlope(forecast.key, forecast.slope)} per week and is approaching a standing change.`,
      });
    } else if (forecast.currentStanding === "fair") {
      warnings.push({
        id: `${forecast.key}-fair`,
        severity: "info",
        metric: forecast.key,
        title: `${def.label} remains Fair`,
        detail: `Hold coaching cadence so ${def.label} does not slip from Fair (${formatEngineValue(forecast.key, latest)}).`,
      });
    }
  }

  return warnings.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
}

export function metricContribution(
  key: MetricKey,
  value: number,
  fleetValue: number,
  volume: number,
  totalVolume: number,
): number {
  if (totalVolume === 0) return 0;
  const polarity = METRIC_CATALOG[key].polarity;
  const gap = polarity === "higher_better" ? value - fleetValue : fleetValue - value;
  return Number((gap * (volume / totalVolume)).toFixed(4));
}

function riskReasonsFor(
  standings: Record<MetricKey, Standing>,
  compositeScore: number,
  kind: "driver" | "route",
): string[] {
  const reasons: string[] = [];
  const poor = METRIC_KEYS.filter((key) => standings[key] === "poor");
  const fair = METRIC_KEYS.filter((key) => standings[key] === "fair");
  const safetyKeys: MetricKey[] = ["fico", "safety"];

  if (poor.length > 0) {
    reasons.push(`Poor ${poor.map((key) => METRIC_CATALOG[key].label).join(", ")}`);
  }
  if (fair.length >= 2) {
    reasons.push(`Multiple Fair metrics (${fair.map((key) => METRIC_CATALOG[key].label).join(", ")})`);
  }
  if (safetyKeys.some((key) => standings[key] === "poor" || standings[key] === "fair")) {
    reasons.push(kind === "driver" ? "Safety standing below Great" : "Route safety profile below Great");
  }
  if (compositeScore < 75) {
    reasons.push(`Composite ${compositeScore.toFixed(0)} is below Great`);
  }
  return reasons;
}

function dcrRecommendations(
  fleet: Record<MetricKey, number>,
  drivers: DriverImpact[],
  routes: RouteImpact[],
): Recommendation[] {
  const standing = evaluateStanding("dcr", fleet.dcr);
  if (standing === "fantastic") {
    return [
      {
        id: "dcr-hold",
        focus: "dcr",
        title: "Protect Fantastic DCR with exception drills",
        priority: "low",
        rationale: `Fleet DCR is ${fleet.dcr.toFixed(2)}%. Keep first-attempt completion by rehearsing locker, gate-code, and business-close exceptions.`,
        expectedImpact: "Hold Fantastic DCR through peak week.",
        actions: [
          "Run a 10-minute pre-shift RTS / access-code huddle on apartment-heavy routes.",
          "Audit same-day reschedule tags so closable stops are not returned.",
        ],
        affectedDrivers: [],
        affectedRoutes: highRiskRoutes(routes)
          .slice(0, 2)
          .map((route) => route.routeCode),
      },
    ];
  }

  const drag = lowestContributors(drivers, "dcr", 3);
  const weakRoutes = lowestContributorsRoutes(routes, "dcr", 2);
  return [
    {
      id: "dcr-close-gap",
      focus: "dcr",
      title: "Close first-attempt gaps on access-constrained routes",
      priority: standing === "poor" || standing === "fair" ? "high" : "medium",
      rationale: `DCR is ${fleet.dcr.toFixed(2)}% (${capitalize(standing)}). ${drag.map((row) => row.driverName).join(", ")} account for the largest negative DCR contribution.`,
      expectedImpact: `Recovering the bottom ${drag.length} drivers to Great (99.0%) lifts fleet DCR toward Fantastic.`,
      actions: [
        "Stage locker and call-box kits for CX apartment clusters before load-out.",
        "Pair at-risk drivers with a DCR mentor for two consecutive routes.",
        "Flag business-close windows on the route sheet and sequence them earlier.",
      ],
      affectedDrivers: drag.map((row) => row.driverName),
      affectedRoutes: weakRoutes.map((row) => row.routeCode),
    },
  ];
}

function podRecommendations(
  fleet: Record<MetricKey, number>,
  drivers: DriverImpact[],
  routes: RouteImpact[],
): Recommendation[] {
  const standing = evaluateStanding("pod", fleet.pod);
  const drag = lowestContributors(drivers, "pod", 3);
  const weakRoutes = lowestContributorsRoutes(routes, "pod", 2);
  const priority = standing === "fantastic" ? "low" : standing === "great" ? "medium" : "high";

  return [
    {
      id: "pod-photo-quality",
      focus: "pod",
      title: standing === "fantastic" ? "Keep POD photos in-policy" : "Raise POD capture quality on low-light routes",
      priority,
      rationale: `POD is ${fleet.pod.toFixed(1)}% (${capitalize(standing)}). ${
        drag.length
          ? `${drag.map((row) => row.driverName).join(", ")} are the primary drag.`
          : "Maintain current photo discipline."
      }`,
      expectedImpact:
        standing === "fantastic"
          ? "Prevent POD regressions during dusk and peak weeks."
          : "A 1.5–2.0pp POD lift on the lowest routes moves the fleet to Fantastic.",
      actions: [
        "Coach wide-angle, package-plus-address frames; reject mailbox and blur shots in ride-alongs.",
        "Issue clip-on lights for dusk routes and require a second photo when the first is dark.",
        "Review yesterday's rejected POD images in the next standup.",
      ],
      affectedDrivers: drag.map((row) => row.driverName),
      affectedRoutes: weakRoutes.map((row) => row.routeCode),
    },
  ];
}

function cdfRecommendations(
  fleet: Record<MetricKey, number>,
  drivers: DriverImpact[],
  routes: RouteImpact[],
): Recommendation[] {
  const standing = evaluateStanding("cdf", fleet.cdf);
  const drag = lowestContributors(drivers, "cdf", 3);
  const weakRoutes = lowestContributorsRoutes(routes, "cdf", 2);

  return [
    {
      id: "cdf-placement",
      focus: "cdf",
      title: standing === "fantastic" ? "Standardize hide-and-place notes" : "Improve door placement and contact quality",
      priority: standing === "poor" || standing === "fair" ? "high" : "medium",
      rationale: `CDF is ${fleet.cdf.toFixed(1)}% (${capitalize(standing)}). Negative customer comments concentrate on placement and contact on ${weakRoutes.map((row) => row.routeCode).join(", ") || "a few residential routes"}.`,
      expectedImpact: "Each recovered CDF point reduces follow-up contacts and supports the CE score.",
      actions: [
        "Require reading customer notes aloud at the stop before leaving the van.",
        "Use a two-photo check (placement + house number) on hidden-location requests.",
        "Call or text on gated and business stops before marking unable-to-deliver.",
      ],
      affectedDrivers: drag.map((row) => row.driverName),
      affectedRoutes: weakRoutes.map((row) => row.routeCode),
    },
  ];
}

function safetyRecommendations(
  fleet: Record<MetricKey, number>,
  drivers: DriverImpact[],
  routes: RouteImpact[],
): Recommendation[] {
  const safetyStanding = evaluateStanding("safety", fleet.safety);
  const ficoStanding = evaluateStanding("fico", fleet.fico);
  const drag = [...drivers]
    .sort((a, b) => a.metrics.safety + a.metrics.fico - (b.metrics.safety + b.metrics.fico))
    .slice(0, 3);
  const weakRoutes = [...routes]
    .sort((a, b) => a.metrics.safety + a.metrics.fico - (b.metrics.safety + b.metrics.fico))
    .slice(0, 2);
  const worstStanding =
    standingRank(safetyStanding) > standingRank(ficoStanding) ? safetyStanding : ficoStanding;

  return [
    {
      id: "safety-events",
      focus: "safety",
      title: worstStanding === "fantastic" ? "Sustain Mentor coaching loops" : "Reduce speeding and following-distance events",
      priority: worstStanding === "poor" || worstStanding === "fair" ? "high" : "medium",
      rationale: `Safety Score is ${fleet.safety.toFixed(0)} (${capitalize(safetyStanding)}); FICO is ${fleet.fico.toFixed(0)} (${capitalize(ficoStanding)}). ${drag.map((row) => row.driverName).join(", ")} generate the most Mentor events.`,
      expectedImpact:
        worstStanding === "fantastic"
          ? "Keep Fantastic safety standing through the next scorecard close."
          : "Cutting repeat speeding events on the bottom drivers typically recovers 8–15 FICO points in two weeks.",
      actions: [
        "Assign Mentor event reviews within 24 hours of a harsh event.",
        "Re-sequence highway-heavy routes to reduce late-day speeding risk.",
        "Seatbelt and distraction ride-along for any driver below Great FICO.",
      ],
      affectedDrivers: drag.map((row) => row.driverName),
      affectedRoutes: weakRoutes.map((row) => row.routeCode),
    },
  ];
}

function lowestContributors(drivers: DriverImpact[], key: MetricKey, limit: number): DriverImpact[] {
  return [...drivers].sort((a, b) => a.contributions[key] - b.contributions[key]).slice(0, limit);
}

function lowestContributorsRoutes(routes: RouteImpact[], key: MetricKey, limit: number): RouteImpact[] {
  return [...routes].sort((a, b) => a.contributions[key] - b.contributions[key]).slice(0, limit);
}

function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  if (n === 1) return { slope: 0, intercept: values[0] };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i += 1) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function approachingThreshold(key: MetricKey, current: number, projected: number): boolean {
  const def = METRIC_CATALOG[key];
  const thresholds = [def.fantastic, def.great, def.fair];
  return thresholds.some((threshold) => {
    const nowGap = current - threshold;
    const nextGap = projected - threshold;
    return Math.sign(nowGap) !== Math.sign(nextGap) || Math.abs(nextGap) < Math.abs(nowGap) * 0.5;
  });
}

function roundMetric(key: MetricKey, value: number): number {
  const digits = key === "dnr" ? 3 : key === "fico" || key === "safety" ? 1 : 3;
  return Number(value.toFixed(digits));
}

function formatEngineValue(key: MetricKey, value: number): string {
  if (key === "dnr") return `${value.toFixed(2)}%`;
  if (key === "fico" || key === "safety") return value.toFixed(0);
  return `${value.toFixed(1)}%`;
}

function formatSlope(key: MetricKey, slope: number): string {
  const sign = slope > 0 ? "+" : "";
  if (key === "fico" || key === "safety") return `${sign}${slope.toFixed(2)}`;
  return `${sign}${slope.toFixed(3)}pp`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function priorityRank(priority: Recommendation["priority"]): number {
  return { high: 0, medium: 1, low: 2 }[priority];
}

function standingRank(standing: Standing): number {
  return { fantastic: 0, great: 1, fair: 2, poor: 3 }[standing];
}

function severityRank(severity: WarningIndicator["severity"]): number {
  return { critical: 0, watch: 1, info: 2 }[severity];
}
