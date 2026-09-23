import seed from "@/lib/data/seed/10hr-bonus-week38-by-da.json";
import type { DateRange } from "@/lib/types";
import { dateInRange } from "@/lib/period";

export interface BonusEntry {
  date: string;
  deliveryAssociate: string;
  stopsCompleted: number;
  route: string;
  /** True when more than one DA was on the route. The stop count is the route total. */
  multiTransporter: boolean;
  coDrivers: readonly string[];
}

export interface BonusDayCount {
  date: string;
  count: number;
  solo: number;
  multiTransporter: number;
}

export interface BonusList {
  station: string;
  week: 38;
  period: string;
  start: string;
  end: string;
  thresholdStopsCompleted: number;
  capturedAt: string;
  source: string;
  entries: BonusEntry[];
  dayCounts: BonusDayCount[];
  soloCount: number;
  multiTransporterCount: number;
  disclaimer: string;
}

interface BonusSeedEntry {
  date: string;
  deliveryAssociate: string;
  stopsCompleted: number;
  route: string;
  multiTransporter: boolean | string;
  coDrivers?: string[] | string;
}

interface BonusSeed {
  station: string;
  week: number;
  period: string;
  thresholdStopsCompleted: number;
  capturedAt: string;
  source: string;
  entries: BonusSeedEntry[];
}

const WEEK_START = "2026-09-13";
const WEEK_END = "2026-09-19";

function asMulti(value: boolean | string) {
  if (typeof value === "boolean") return value;
  const text = value.trim().toLowerCase();
  return text === "yes" || text === "true";
}

function asDrivers(value: string[] | string | undefined) {
  if (Array.isArray(value)) return value.map((name) => name.trim()).filter(Boolean);
  if (!value?.trim()) return [];
  return value
    .split(";")
    .map((name) => name.trim())
    .filter(Boolean);
}

function readSeed(raw: BonusSeed): BonusList {
  if (raw.station !== "DNA4" || raw.week !== 38 || raw.thresholdStopsCompleted !== 180) {
    throw new Error("Week 38 10-hour bonus seed does not match the DNA4 capture.");
  }
  const entries = raw.entries.map((entry) => {
    const multiTransporter = asMulti(entry.multiTransporter);
    const coDrivers = asDrivers(entry.coDrivers);
    if (!entry.date || !entry.route || !entry.deliveryAssociate.trim()) {
      throw new Error("Week 38 bonus row is missing a date, route, or delivery associate.");
    }
    if (entry.date < WEEK_START || entry.date > WEEK_END) {
      throw new Error(`Week 38 bonus row for ${entry.deliveryAssociate} is outside Sep 13–19.`);
    }
    if (!Number.isInteger(entry.stopsCompleted) || entry.stopsCompleted < raw.thresholdStopsCompleted) {
      throw new Error(`Week 38 bonus row for ${entry.deliveryAssociate} is below 180 completed stops.`);
    }
    if (multiTransporter && coDrivers.length === 0) {
      throw new Error(`Week 38 multi-transporter row for ${entry.deliveryAssociate} has no co-drivers.`);
    }
    if (!multiTransporter && coDrivers.length > 0) {
      throw new Error(`Week 38 solo row for ${entry.deliveryAssociate} lists co-drivers.`);
    }
    return {
      date: entry.date,
      deliveryAssociate: entry.deliveryAssociate,
      stopsCompleted: entry.stopsCompleted,
      route: entry.route,
      multiTransporter,
      coDrivers,
    };
  });
  const counts = new Map<string, BonusDayCount>();
  for (const entry of entries) {
    const day = counts.get(entry.date) ?? {
      date: entry.date,
      count: 0,
      solo: 0,
      multiTransporter: 0,
    };
    day.count += 1;
    if (entry.multiTransporter) day.multiTransporter += 1;
    else day.solo += 1;
    counts.set(entry.date, day);
  }
  const soloCount = entries.filter((entry) => !entry.multiTransporter).length;
  return {
    station: raw.station,
    week: 38,
    period: raw.period,
    start: WEEK_START,
    end: WEEK_END,
    thresholdStopsCompleted: raw.thresholdStopsCompleted,
    capturedAt: raw.capturedAt,
    source: raw.source,
    entries,
    dayCounts: [...counts.values()].sort((a, b) => a.date.localeCompare(b.date)),
    soloCount,
    multiTransporterCount: entries.length - soloCount,
    disclaimer:
      "Week 38 Sep 13–19 DNA4. Each row is a delivery associate on a route with at least 180 completed stops. stopsCompleted is the Delivery Execution route total, not a planned stop count. Solo rows are the only DA on that route. Multi-transporter rows list each DA who was on the route. Amazon did not say which of those DAs completed the stops, so the count is not split and is not assigned to one person.",
  };
}

const list = readSeed(seed as BonusSeed);

export function getBonusList(): BonusList {
  return list;
}

export function bonusCoDriverLabel(drivers: readonly string[]) {
  return drivers.join("; ");
}

export function bonusEntriesInRange(bonus: BonusList, range: DateRange) {
  return bonus.entries.filter((entry) => dateInRange(entry.date, range));
}
