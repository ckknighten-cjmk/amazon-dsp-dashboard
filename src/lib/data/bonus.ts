import seed from "@/lib/data/seed/10hr-bonus-week38.json";
import type { DateRange } from "@/lib/types";
import { dateInRange } from "@/lib/period";

export interface BonusRoute {
  date: string;
  route: string;
  drivers: readonly string[];
  stopsCompleted: number;
}

export interface BonusDayCount {
  date: string;
  count: number;
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
  routes: BonusRoute[];
  dayCounts: BonusDayCount[];
  disclaimer: string;
}

interface BonusSeed {
  station: string;
  week: number;
  period: string;
  thresholdStopsCompleted: number;
  capturedAt: string;
  source: string;
  routes: Array<{
    date: string;
    route: string;
    drivers: string[];
    stopsCompleted: number;
  }>;
}

const WEEK_START = "2026-09-13";
const WEEK_END = "2026-09-19";

function readSeed(raw: BonusSeed): BonusList {
  if (raw.station !== "DNA4" || raw.week !== 38 || raw.thresholdStopsCompleted !== 180) {
    throw new Error("Week 38 10-hour bonus seed does not match the DNA4 capture.");
  }
  const routes = raw.routes.map((route) => {
    if (!route.date || !route.route || route.drivers.length === 0) {
      throw new Error("Week 38 bonus route is missing a date, route, or driver.");
    }
    if (route.date < WEEK_START || route.date > WEEK_END) {
      throw new Error(`Week 38 bonus route ${route.route} is outside Sep 13–19.`);
    }
    if (!Number.isInteger(route.stopsCompleted) || route.stopsCompleted < raw.thresholdStopsCompleted) {
      throw new Error(`Week 38 bonus route ${route.route} is below 180 completed stops.`);
    }
    return {
      date: route.date,
      route: route.route,
      drivers: route.drivers.slice(),
      stopsCompleted: route.stopsCompleted,
    };
  });
  const counts = new Map<string, number>();
  for (const route of routes) counts.set(route.date, (counts.get(route.date) ?? 0) + 1);
  return {
    station: raw.station,
    week: 38,
    period: raw.period,
    start: WEEK_START,
    end: WEEK_END,
    thresholdStopsCompleted: raw.thresholdStopsCompleted,
    capturedAt: raw.capturedAt,
    source: raw.source,
    routes,
    dayCounts: [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count })),
    disclaimer:
      "Week 38 Sep 13–19 DNA4. Routes with at least 180 completed stops from Delivery Execution historical route cards. The threshold is actual completed stops, not planned stops. Driver names stay as captured, including multi-transporter routes. This list does not assign who earns the bonus.",
  };
}

const list = readSeed(seed as BonusSeed);

export function getBonusList(): BonusList {
  return list;
}

export function bonusDriverLabel(drivers: readonly string[]) {
  return drivers.join("; ");
}

export function bonusRoutesInRange(bonus: BonusList, range: DateRange) {
  return bonus.routes.filter((route) => dateInRange(route.date, range));
}
