/** Domain models for DSP last-mile operations. Swap mock data, keep these types. */

export type DateRange = "today" | "week";

export type ScorecardTier = "fantastic" | "great" | "fair" | "poor";

export type MetricUnit = "percent" | "count";

export type ScorecardCategoryId =
  | "safety_compliance"
  | "quality"
  | "service_reliability";

export type ScorecardValueKind =
  | "percent"
  | "count"
  | "rate"
  | "dpmo"
  | "score"
  | "compliance"
  | "unavailable";

export type ScorecardCompliance = "compliant" | "noncompliant";

export type RouteStatus =
  | "not_started"
  | "no_progress"
  | "incomplete"
  | "in_progress"
  | "completed"
  | "rescued";

export type StopStatus =
  | "pending"
  | "delivered"
  | "attempted"
  | "rescued"
  | "business_closed";

export type DriverRole = "DA" | "Dispatcher" | "Station Manager";

export type DriverStatus = "available" | "on_route" | "off" | "pto";

/** Where a roster row came from. Delivery-board rows are associates who were on a route but did not match a schedule transporter. */
export type RosterSource = "amazon-schedule" | "adp-only" | "delivery-board";

export type VehicleType = "edv" | "rental_cargo" | "step_van";

export type VehicleStatus = "ready" | "on_route" | "maintenance" | "oos";

export type IncidentType =
  | "dvr"
  | "customer_complaint"
  | "vehicle_issue"
  | "safety_event";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentStatus = "open" | "closed";

export type AlertSeverity = "info" | "warning" | "critical";

export interface StationSettings {
  companyName: string;
  legalName: string;
  ownership: string;
  stationCode: string;
  stationName: string;
  city: string;
  timezone: string;
  generalManager: string;
}

export interface Driver {
  id: string;
  name: string;
  role: DriverRole;
  status: DriverStatus;
  hiredAt?: string;
  phone?: string;
  todayPackages: number;
  todayStops: number;
  scorecardContribution?: number;
  incidentCount30d: number;
  routeId?: string;
  routeIds: string[];
  transporterId?: string;
  initials: string;
  /** Present on the full roster. Omitted on the Sep 21 board-only associate list. */
  rosterSource?: RosterSource;
  /** Amazon schedule weeks that included this transporter ID. */
  scheduleWeeks?: number[];
  /** ADP Group Timecard name when it matched, or the raw name for ADP-only rows. */
  adpName?: string;
  /** Extra associate ids that should resolve to this person (short Delivery Execution names). */
  aliasIds?: string[];
}

export interface Vehicle {
  id: string;
  unitId: string;
  type: VehicleType;
  status: VehicleStatus;
  /** Null when the source did not publish mileage. */
  mileage: number | null;
  /** Null when the source did not publish an inspection date. */
  lastInspection: string | null;
  assignedRouteId?: string;
  /** Null when the source did not publish a model year. */
  year: number | null;
  plate: string;
  notes?: string;
  vin?: string;
  makeModel?: string;
  ownership?: string;
  /** Console status text when the row came from My vehicles. */
  consoleStatus?: string;
  statusReason?: string | null;
  lastRouteCompleted?: string | null;
  /** Route code from the fleet export, when Console published one. */
  assignedRouteCode?: string | null;
  origin?: "console" | "mock";
}

export interface Stop {
  id: string;
  sequence: number;
  address: string;
  city: string;
  packages: number;
  status: StopStatus;
  completedAt?: string;
  pod: boolean;
}

export interface Route {
  id: string;
  code: string;
  stationCode: string;
  wave?: 1 | 2 | null;
  driverId: string | null;
  associateIds: string[];
  /**
   * True when the route listed more than one associate.
   * That is the multi-transporter proxy for a rescue. It is not Amazon’s
   * rescueActions flag unless the capture actually included that list.
   */
  receivedRescue: boolean;
  /** Associates after the first on a multi-transporter route. */
  rescueDriverIds: string[];
  /** First rescuer, when `receivedRescue` is true. */
  rescueDriverId?: string;
  vehicleId: string | null;
  packageCount: number;
  packagesDelivered: number;
  packagesRemaining: number;
  stopCount: number;
  completedStops: number;
  status: RouteStatus;
  progressPct: number;
  eta: string | null;
  finishTime: string | null;
  startedAt: string | null;
  onTimePct: number | null;
  serviceArea?: string;
  notes: string | null;
  stops: Stop[];
}

export type PackageExceptionStatus =
  | "Reattemptable"
  | "Undeliverable"
  | "Missing"
  | "Returned to station"
  | "Pickup failed";

export interface PackageException {
  id: string;
  scannableId: string;
  routeCode: string;
  routeId: string;
  transporterName: string;
  transporterId?: string;
  address: string;
  status: PackageExceptionStatus;
  reasonCode: string;
  lastScan: string | null;
}

export interface DeliveryExecutionBoard {
  source: string;
  serviceDate: string;
  capturedAt: string;
  snapshot: string;
  disclaimer: string;
  totals: {
    routes: number;
    inProgress: number;
    incomplete: number;
    executionGaugesPct: {
      locations: number;
      stops: number;
      packages: number;
      attemptSuccess: number;
    };
    /** Sum of Console route rows. The board did not publish a separate delivered total. */
    packagesDelivered: number;
    packagesPlanned: number;
    packageStatusCounts: {
      remaining: number;
      reattemptable: number;
      undeliverable: number;
      missing: number;
      returnedToStation: number;
      pickupFailed: number;
      pendingContainersPickup: number;
      pendingPackagesPickup: number;
    };
    workHourRisk: number;
    multiTransporter: number;
    /** Console rescueActions count when the capture included it. Null when absent. */
    rescueActions: number | null;
    unknownStops: number;
    onBreak: number;
    noBreaksTaken: number;
    inactive: number;
    onRoadPickups: {
      total: number;
      remaining: number;
      complete: number;
    };
  };
}

export interface Incident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  notes: string;
  occurredAt: string;
  driverId?: string;
  routeId?: string;
  vehicleId?: string;
}

export interface ScorecardThresholds {
  /** Inclusive bound for Fantastic. Direction depends on `higherIsBetter`. */
  fantastic: number;
  great: number;
  fair: number;
}

export interface ScorecardMetric {
  id: string;
  key: string;
  name: string;
  shortName: string;
  description: string;
  category: ScorecardCategoryId;
  unit: ScorecardValueKind;
  unitSuffix?: string;
  digits?: number;
  current: number | null;
  /** Null when DSP Console did not publish a prior-week comparison. */
  prior: number | null;
  higherIsBetter: boolean;
  thresholds: ScorecardThresholds | null;
  /** Amazon-shown standing from DSP Console. Badge source of truth. */
  reportedTier: ScorecardTier | null;
  compliance?: ScorecardCompliance | null;
}

export interface ScorecardCategory {
  id: ScorecardCategoryId;
  name: string;
  tier: ScorecardTier;
}

export interface ScorecardSnapshot {
  weekNumber: number;
  weekLabel: string;
  periodLabel: string;
  priorWeekLabel: string | null;
  asOf: string;
  overallScore: number;
  overallTier: ScorecardTier;
  categories: ScorecardCategory[];
  metrics: ScorecardMetric[];
  disclaimer: string;
}

export interface Kpi {
  id: string;
  label: string;
  value: number;
  unit: "number" | "percent";
  delta: number | null;
  sparkline: number[];
  hint: string;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  href?: string;
}

export interface OverviewSnapshot {
  range: DateRange;
  asOfLabel: string;
  kpis: Kpi[];
  packagesByDay: { label: string; delivered: number; assigned: number }[];
  routeStatusCounts: { status: RouteStatus; count: number }[];
  alerts: Alert[];
}

export interface RosterFilters {
  query?: string;
  status?: DriverStatus | "all";
  role?: DriverRole | "all";
}

export type InvoiceStatus = "New" | "Paid";

export type InvoiceKind = "incentive" | "variable" | "other";

export interface SettlementInvoice {
  id: string;
  periodLabel: string;
  week: number | null;
  kind: InvoiceKind;
  status: InvoiceStatus;
  amount: number;
}

export interface SettlementLine {
  label: string;
  qty: number | null;
  amount: number;
}

export interface WeekSettlement {
  invoiceId: string;
  status: InvoiceStatus;
  disputeWindowCloses: string;
  total: number;
}

export interface YtdInsights {
  station: string;
  yearAsShownInConsole: number;
  totalRevenue: number;
  variablePayment: number;
  fixedMonthly: number;
  perPiecePlusDxi: number;
  other: number;
  disclaimer: string;
}

/** Amazon DSP Console Flex Payments scrape. Amounts are copied from Console, not derived. */
export interface PaymentsSnapshot {
  source: string;
  company: string;
  station: { code: string; name: string };
  capturedAt: string;
  timezone: string;
  pendingAction: { count: number; totalExact: number; currency: string };
  visiblePaidTotal: number;
  invoices: SettlementInvoice[];
  week37Variable: WeekSettlement & { lines: SettlementLine[] };
  week37Incentive: WeekSettlement & { notes: string };
  ytdInsights: YtdInsights;
  disclaimer: string;
}

export type {
  ComplianceReport,
  ExceptionRow,
  MealRow,
  UnmatchedRow,
} from "@/lib/compliance/types";
