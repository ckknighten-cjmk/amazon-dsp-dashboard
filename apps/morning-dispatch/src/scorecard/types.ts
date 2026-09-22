export type PeriodType = "weekly" | "monthly";

export type Standing = "fantastic" | "great" | "fair" | "poor";

export type MetricKey = "dcr" | "pod" | "cdf" | "fico" | "safety" | "dnr" | "dsc" | "ce";

export type Polarity = "higher_better" | "lower_better";

export type RecommendationFocus = "dcr" | "pod" | "cdf" | "safety";

export type WarningSeverity = "critical" | "watch" | "info";

export interface MetricDefinition {
  key: MetricKey;
  label: string;
  fullName: string;
  unit: string;
  polarity: Polarity;
  description: string;
  fantastic: number;
  great: number;
  fair: number;
}

export interface MetricSnapshot {
  key: MetricKey;
  value: number;
  standing: Standing;
  delta: number;
}

export interface Scorecard {
  id: string;
  stationId: string;
  stationName: string;
  periodType: PeriodType;
  periodStart: string;
  periodEnd: string;
  label: string;
  metrics: Record<MetricKey, number>;
  compositeScore: number;
  standing: Standing;
  packagesDelivered: number;
}

export interface ScorecardHistoryPoint {
  periodStart: string;
  periodEnd: string;
  label: string;
  periodType: PeriodType;
  metrics: Record<MetricKey, number>;
}

export interface DriverScorecardRow {
  driverId: string;
  driverName: string;
  primaryRoute: string;
  packagesDelivered: number;
  stopsCompleted: number;
  metrics: Record<MetricKey, number>;
}

export interface RouteScorecardRow {
  routeCode: string;
  stationId: string;
  packagesDelivered: number;
  stopsCompleted: number;
  metrics: Record<MetricKey, number>;
  riskFactors: string[];
}

export interface DriverImpact {
  driverId: string;
  driverName: string;
  primaryRoute: string;
  packagesDelivered: number;
  stopsCompleted: number;
  metrics: Record<MetricKey, number>;
  standings: Record<MetricKey, Standing>;
  contributions: Record<MetricKey, number>;
  compositeScore: number;
  standing: Standing;
  atRisk: boolean;
  riskReasons: string[];
}

export interface RouteImpact {
  routeCode: string;
  stationId: string;
  packagesDelivered: number;
  stopsCompleted: number;
  metrics: Record<MetricKey, number>;
  standings: Record<MetricKey, Standing>;
  contributions: Record<MetricKey, number>;
  compositeScore: number;
  standing: Standing;
  highRisk: boolean;
  riskFactors: string[];
  riskReasons: string[];
}

export interface Recommendation {
  id: string;
  focus: RecommendationFocus;
  title: string;
  priority: "high" | "medium" | "low";
  rationale: string;
  expectedImpact: string;
  actions: string[];
  affectedDrivers: string[];
  affectedRoutes: string[];
}

export interface MetricForecast {
  key: MetricKey;
  history: { label: string; actual: number }[];
  forecast: { label: string; value: number; lower: number; upper: number }[];
  slope: number;
  projectedStanding: Standing;
  currentStanding: Standing;
}

export interface WarningIndicator {
  id: string;
  severity: WarningSeverity;
  metric: MetricKey;
  title: string;
  detail: string;
}
