import { OPS_TIMEZONE } from "@/lib/format";

const STATION_STAMP = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)\b/i;

export function stationCalendarDay(iso: string, timeZone = OPS_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

export function shiftIsoDate(isoDate: string, days: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) throw new Error(`Expected YYYY-MM-DD, received ${isoDate}`);
  const utc = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days));
  const year = utc.getUTCFullYear();
  const month = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const day = String(utc.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Station wall time with no offset, stored as an ISO timestamp in America/Chicago.
 * October dates use CDT (-05:00). December dates use CST (-06:00).
 */
export function chicagoWallClockIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone = OPS_TIMEZONE
) {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
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
  const instant = new Date(guess - (asUtc - guess));
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00${zoneOffset(instant, timeZone)}`;
}

/** Parse a Console cell like `10/14/2026` plus `7:01 PM`, including a blank line between them. */
export function parseStationDateTime(value: string, timeZone = OPS_TIMEZONE) {
  const normalized = value.trim().replace(/\n+/g, " ").replace(/\s+/g, " ");
  const match = STATION_STAMP.exec(normalized);
  if (!match) throw new Error(`Unrecognized station timestamp ${JSON.stringify(value)}`);
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  let hour = Number(match[4]) % 12;
  if (match[6].toUpperCase() === "PM") hour += 12;
  return chicagoWallClockIso(year, month, day, hour, Number(match[5]), timeZone);
}

function zoneOffset(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
    hour: "2-digit",
  }).formatToParts(instant);
  const name = parts.find((part) => part.type === "timeZoneName")?.value ?? "";
  if (name === "GMT" || name === "UTC") return "Z";
  const match = /^(?:GMT|UTC)([+-]\d{2}:\d{2})$/.exec(name);
  if (!match) throw new Error(`Unrecognized timezone offset ${name}`);
  return match[1];
}
