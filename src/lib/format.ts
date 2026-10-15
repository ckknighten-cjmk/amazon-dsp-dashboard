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
export const MOCK_NOW = parseISO("2026-10-14T20:10:00");

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

/** ISO instant with an explicit offset or `Z`. Naive datetimes are left unlabeled. */
const EXPLICIT_ZONE = /(?:Z|[+-]\d{2}:\d{2})$/i;

/**
 * Label for a seed capture instant that already includes a timezone.
 * Returns undefined when the page has no timestamp, so the UI does not invent one.
 */
export function seedCapturedLabel(iso: string | null | undefined): string | undefined {
  const value = iso?.trim();
  if (!value || !EXPLICIT_ZONE.test(value)) return undefined;
  return `Seed captured ${formatZonedDateTime(value)}`;
}

/** Milliseconds for an ISO instant that already carries an offset or `Z`. */
export function zonedInstant(iso: string | null | undefined): number | null {
  const value = iso?.trim();
  if (!value || !EXPLICIT_ZONE.test(value)) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

/** Newest zoned instant in the list. Naive timestamps are skipped. */
export function latestZonedIso(values: Array<string | null | undefined>): string | undefined {
  let best: { iso: string; time: number } | undefined;
  for (const value of values) {
    const iso = value?.trim();
    const time = zonedInstant(iso);
    if (!iso || time == null) continue;
    if (!best || time > best.time) best = { iso, time };
  }
  return best?.iso;
}

const EXPORT_STAMP =
  /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4}),\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i;

function wallClockToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
) {
  const guess = Date.UTC(year, month - 1, day, hour, minute, second);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(guess));
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(
    pick("year"),
    pick("month") - 1,
    pick("day"),
    pick("hour") % 24,
    pick("minute"),
    pick("second")
  );
  return new Date(guess - (asUtc - guess)).toISOString();
}

/**
 * Amazon schedule exports store a station wall time like `10/13/26, 7:51:45 PM`
 * with no offset. Interpret that clock as America/Chicago. Returns undefined
 * when the string is not that shape.
 */
export function parseStationExportStamp(value: string | null | undefined): string | undefined {
  const match = value?.trim().match(EXPORT_STAMP);
  if (!match) return undefined;
  const [, monthRaw, dayRaw, yearRaw, hourRaw, minuteRaw, secondRaw, meridiem] = match;
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const year = yearRaw.length === 2 ? 2000 + Number(yearRaw) : Number(yearRaw);
  let hour = Number(hourRaw) % 12;
  if (meridiem.toUpperCase() === "PM") hour += 12;
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  return wallClockToUtc(year, month, day, hour, Number(minuteRaw), Number(secondRaw), OPS_TIMEZONE);
}

/**
 * Visible as-of line. Zoned instants keep the clock. A date-only or naive
 * timestamp keeps the calendar date and does not invent a timezone.
 */
export function seedAsOfLabel(iso: string | null | undefined): string | undefined {
  const captured = seedCapturedLabel(iso);
  if (captured) return captured;
  const value = iso?.trim();
  if (!value) return undefined;
  const day = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined;
  const [year, month, date] = day.split("-").map(Number);
  const label = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, date));
  return `Seed as of ${label}`;
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
