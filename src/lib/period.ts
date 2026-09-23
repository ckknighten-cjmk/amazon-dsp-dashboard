import { format, parseISO } from "date-fns";
import type { DateRange } from "@/lib/types";

export const PERIOD_STORAGE_KEY = "cjmk-ops-period";

/** Station clock date. Matches MOCK_NOW (2026-09-21). */
export const STATION_TODAY = "2026-09-21";

/** Seven days ending on the station clock, inclusive. */
export const STATION_WEEK_START = "2026-09-15";
export const STATION_WEEK_END = "2026-09-21";

export const TODAY_RANGE: DateRange = { kind: "today" };
export const WEEK_RANGE: DateRange = { kind: "week" };

export const DELIVERY_COVERAGE = {
  start: "2026-09-21",
  end: "2026-09-21",
  label: "Seeded data: Sep 21 only",
} as const;

export const SCORECARD_COVERAGE = {
  start: "2026-09-06",
  end: "2026-09-12",
  label: "Seeded data: Week 37, Sep 6–12",
} as const;

export const DVIC_COVERAGE = {
  start: "2026-09-23",
  end: "2026-09-23",
  label: "Seeded data: Sep 23 only",
} as const;

export const COMPLIANCE_COVERAGE = {
  38: {
    start: "2026-09-13",
    end: "2026-09-19",
    label: "Week 38, Sep 13–Sep 19, 2026",
  },
  39: {
    start: "2026-09-20",
    end: "2026-09-26",
    label: "Week 39, Sep 20–Sep 26, 2026",
  },
} as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

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

export function isIsoDate(value: string) {
  if (!ISO_DATE.test(value)) return false;
  const parsed = parseISO(value);
  return !Number.isNaN(parsed.getTime()) && format(parsed, "yyyy-MM-dd") === value;
}

export function boundsOf(range: DateRange): { start: string; end: string } {
  if (range.kind === "today") return { start: STATION_TODAY, end: STATION_TODAY };
  if (range.kind === "week") return { start: STATION_WEEK_START, end: STATION_WEEK_END };
  const start = range.start <= range.end ? range.start : range.end;
  const end = range.start <= range.end ? range.end : range.start;
  return { start, end };
}

export function sameRange(a: DateRange, b: DateRange) {
  if (a.kind !== b.kind) return false;
  if (a.kind === "custom" && b.kind === "custom") {
    return a.start === b.start && a.end === b.end;
  }
  return true;
}

export function dateInRange(iso: string, range: DateRange) {
  const day = iso.slice(0, 10);
  const { start, end } = boundsOf(range);
  return day >= start && day <= end;
}

export function rangesOverlap(start: string, end: string, range: DateRange) {
  const bounds = boundsOf(range);
  return start <= bounds.end && end >= bounds.start;
}

export function datesInRange(dates: readonly string[], range: DateRange) {
  return dates.filter((date) => dateInRange(date, range));
}

export function formatSpanLabel(start: string, end: string) {
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

export function formatRangeLabel(range: DateRange) {
  const { start, end } = boundsOf(range);
  if (range.kind === "today") return `Today · ${format(parseISO(start), "EEE MMM d")}`;
  if (range.kind === "week") return `This week · ${formatSpanLabel(start, end)}`;
  return `Custom · ${formatSpanLabel(start, end)}`;
}

export function routeUsesPeriod(pathname: string) {
  if (pathname === "/") return true;
  return ["/scorecard", "/routes", "/drivers", "/fleet", "/incidents", "/compliance", "/payments"].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function parsePeriodParam(
  period: string | null,
  start: string | null,
  end: string | null
): DateRange | null {
  if (period === "today") return { kind: "today" };
  if (period === "week") return { kind: "week" };
  if (period === "custom" && start && end && isIsoDate(start) && isIsoDate(end)) {
    const orderedStart = start <= end ? start : end;
    const orderedEnd = start <= end ? end : start;
    return { kind: "custom", start: orderedStart, end: orderedEnd };
  }
  return null;
}

export function writePeriodParams(params: URLSearchParams, range: DateRange) {
  params.set("period", range.kind);
  if (range.kind === "custom") {
    const { start, end } = boundsOf(range);
    params.set("start", start);
    params.set("end", end);
  } else {
    params.delete("start");
    params.delete("end");
  }
}

export function hrefWithPeriod(href: string, range: DateRange) {
  const queryIndex = href.indexOf("?");
  const path = queryIndex === -1 ? href : href.slice(0, queryIndex);
  const params = new URLSearchParams(queryIndex === -1 ? "" : href.slice(queryIndex + 1));
  writePeriodParams(params, range);
  const serialized = params.toString();
  return serialized ? `${path}?${serialized}` : path;
}

export function serializePeriod(range: DateRange) {
  if (range.kind === "custom") {
    const { start, end } = boundsOf(range);
    return `custom:${start}:${end}`;
  }
  return range.kind;
}

export function deserializePeriod(value: string | null): DateRange | null {
  if (!value) return null;
  if (value === "today" || value === "week") return { kind: value };
  const match = /^custom:(\d{4}-\d{2}-\d{2}):(\d{4}-\d{2}-\d{2})$/.exec(value);
  if (!match || !isIsoDate(match[1]) || !isIsoDate(match[2])) return null;
  return parsePeriodParam("custom", match[1], match[2]);
}

function iso(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthNumber(name: string) {
  return MONTHS[name.slice(0, 3).toLowerCase()] ?? 0;
}

/**
 * Service window from a Console invoice period label.
 * The date after the last slash is the invoice date, not the service window,
 * except when the service span itself names both months.
 */
export function invoiceServiceWindow(periodLabel: string): { start: string; end: string } | null {
  const yearMatch = periodLabel.match(/\b(20\d{2})\b/);
  if (!yearMatch) return null;
  const year = Number(yearMatch[1]);
  const withoutWeek = periodLabel.replace(/^Week\s+\d+\s*\/\s*/i, "");
  const service = withoutWeek.split("/")[0]?.trim() ?? "";

  const cross = service.match(/^([A-Za-z]+)\s+(\d{1,2})\s*[-–]\s*([A-Za-z]+)\s+(\d{1,2})/);
  if (cross) {
    const startMonth = monthNumber(cross[1]);
    const endMonth = monthNumber(cross[3]);
    if (!startMonth || !endMonth) return null;
    const startYear = startMonth > endMonth ? year - 1 : year;
    return {
      start: iso(startYear, startMonth, Number(cross[2])),
      end: iso(year, endMonth, Number(cross[4])),
    };
  }

  const same = service.match(/^([A-Za-z]+)\s+(\d{1,2})\s*[-–]\s*(\d{1,2})/);
  if (!same) return null;
  const month = monthNumber(same[1]);
  if (!month) return null;
  const startDay = Number(same[2]);
  const endDay = Number(same[3]);
  if (endDay >= startDay) {
    return { start: iso(year, month, startDay), end: iso(year, month, endDay) };
  }
  const nextMonth = month === 12 ? 1 : month + 1;
  const startYear = month === 12 ? year - 1 : year;
  return {
    start: iso(startYear, month, startDay),
    end: iso(year, nextMonth, endDay),
  };
}

export function spanOfDates(dates: readonly string[]) {
  const sorted = [...new Set(dates.map((date) => date.slice(0, 10)))]
    .filter(isIsoDate)
    .sort();
  if (sorted.length === 0) return null;
  return { start: sorted[0]!, end: sorted[sorted.length - 1]! };
}
