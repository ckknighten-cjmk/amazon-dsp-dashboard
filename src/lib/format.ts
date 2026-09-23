import { differenceInMonths, format as formatDateFns, parseISO } from "date-fns";
import type {
  DriverStatus,
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
  PackageExceptionStatus,
  RouteStatus,
  ScorecardTier,
  StopStatus,
  VehicleStatus,
  VehicleType,
} from "@/lib/types";

export const OPS_TIMEZONE = "America/Chicago";

/** Frozen station clock so the demo stays consistent (CDT wall time). */
export const MOCK_NOW = parseISO("2026-09-21T22:12:00");

/** Clock label for a Console capture instant, rendered in the station timezone. */
export function formatConsoleCapture(iso: string) {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: OPS_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
  return `${time.replace(" AM", " a.m.").replace(" PM", " p.m.")} CT`;
}

export function formatConsoleDay(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: OPS_TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
  })
    .format(new Date(iso))
    .replace(",", "");
}

export function formatTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return formatDateFns(parseISO(iso), "h:mm a");
}

export function formatDate(iso: string) {
  return formatDateFns(parseISO(iso), "MMM d, yyyy");
}

export function formatDateTime(iso: string) {
  return formatDateFns(parseISO(iso), "MMM d, h:mm a");
}

export function formatClock() {
  return formatDateFns(MOCK_NOW, "EEE, MMM d · h:mm a");
}

export { formatRangeLabel } from "@/lib/period";

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatUsd(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Console timestamps include an offset; always render them in the station zone. */
export function formatZonedDateTime(iso: string, timeZone = OPS_TIMEZONE) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(new Date(iso));
}

export function formatPercent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

/** Whole Console standings stay whole. 84 displays as 84; 85.8 stays 85.8. */
export function formatOverallScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

export function formatScorecardValue(metric: {
  unit: string;
  current: number | null;
  digits?: number;
  unitSuffix?: string;
  compliance?: string | null;
}) {
  if (metric.unit === "unavailable") return "No data";
  if (metric.unit === "compliance") {
    return metric.compliance === "compliant" ? "Compliant" : "Noncompliant";
  }
  if (metric.current == null) return "—";
  const digits = metric.digits ?? (metric.unit === "percent" ? 1 : 1);
  if (metric.unit === "percent") return formatPercent(metric.current, digits);
  const n = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(metric.current);
  if (metric.unitSuffix) return `${n} ${metric.unitSuffix}`;
  return n;
}

export function formatDelta(delta: number, unit: "number" | "percent") {
  const sign = delta > 0 ? "+" : "";
  if (unit === "percent") return `${sign}${delta.toFixed(1)} pts`;
  return `${sign}${formatNumber(delta)}`;
}

export function formatTenure(hiredAt: string | undefined) {
  if (!hiredAt) return "—";
  const months = differenceInMonths(MOCK_NOW, parseISO(hiredAt));
  if (months < 1) return "< 1 mo";
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0 ? `${years} yr` : `${years} yr ${rem} mo`;
}

export function formatMileage(miles: number) {
  return `${formatNumber(miles)} mi`;
}

export const routeStatusLabel: Record<RouteStatus, string> = {
  not_started: "Not started",
  no_progress: "No progress",
  incomplete: "Incomplete",
  in_progress: "In progress",
  completed: "Completed",
  rescued: "Rescued",
};

export const driverStatusLabel: Record<DriverStatus, string> = {
  available: "Available",
  on_route: "On route",
  off: "Off",
  pto: "PTO",
};

export const vehicleStatusLabel: Record<VehicleStatus, string> = {
  ready: "Ready",
  on_route: "On route",
  maintenance: "Maintenance",
  oos: "OOS",
};

export const vehicleTypeLabel: Record<VehicleType, string> = {
  edv: "Amazon EDV",
  rental_cargo: "Rental cargo",
  step_van: "Step van",
};

export const incidentTypeLabel: Record<IncidentType, string> = {
  dvr: "DVR",
  customer_complaint: "Customer complaint",
  vehicle_issue: "Vehicle issue",
  safety_event: "Safety event",
};

export const incidentSeverityLabel: Record<IncidentSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const incidentStatusLabel: Record<IncidentStatus, string> = {
  open: "Open",
  closed: "Closed",
};

export const stopStatusLabel: Record<StopStatus, string> = {
  pending: "Pending",
  delivered: "Delivered",
  attempted: "Attempted",
  rescued: "Rescued",
  business_closed: "Business closed",
};

export const exceptionStatusLabel: Record<PackageExceptionStatus, string> = {
  Reattemptable: "Reattemptable",
  Undeliverable: "Undeliverable",
  Missing: "Missing",
  "Returned to station": "RTS",
  "Pickup failed": "Pickup failed",
};

export const scorecardTierLabel: Record<ScorecardTier, string> = {
  fantastic: "Fantastic",
  great: "Great",
  fair: "Fair",
  poor: "Poor",
};

/** Console did not publish this field on the Delivery Execution board. */
export const CONSOLE_UNAVAILABLE = "Not on Console";

export function formatCompletionPct(value: number) {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}
