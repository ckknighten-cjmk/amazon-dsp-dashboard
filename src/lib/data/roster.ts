/**
 * Active associate roster.
 *
 * Primary list: union of Amazon schedule associates in Weeks 38 and 39,
 * keyed by transporter ID. Sep 25 Delivery Execution routes, packages, and
 * status merge in when the board name matches (first + last, so a schedule
 * middle name still joins). ADP Group Timecard names that do not match a
 * schedule associate are appended and labeled ADP only. They have no
 * transporter ID.
 */
import week38Schedule from "@/lib/data/seed/week38-amazon-schedule.json";
import week39Schedule from "@/lib/data/seed/week39-amazon-schedule.json";
import week38Adp from "@/lib/data/seed/adp-timecards-week38.json";
import week39Adp from "@/lib/data/seed/adp-timecards-week39.json";
import { collapseSpaces, matchAmazonName, nameTokens } from "@/lib/compliance/names";
import {
  employmentLabel,
  employmentStatus,
  matchCensusEmployee,
  publishedEmail,
  publishedPhone,
} from "@/lib/data/census";
import { associateId, consoleDrivers, initials, routes } from "@/lib/data/delivery-execution";
import type { Driver, DriverRole, DriverStatus, RosterSource } from "@/lib/types";

interface SchedulePerson {
  transporterId: string;
  name: string;
  weeks: number[];
}

interface AdpFile {
  groupTimecard: Record<string, Array<{ name: string }>>;
  individualTimecards?: Record<string, unknown>;
}

const SCHEDULES: Array<{ week: number; associates: Array<{ name: string; transporterId: string }> }> = [
  { week: 38, associates: week38Schedule.associates },
  { week: 39, associates: week39Schedule.associates },
];

const ADP_FILES: AdpFile[] = [week38Adp, week39Adp];

const SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv", "v"]);

function displayToken(token: string) {
  if (SUFFIXES.has(token)) return token.toUpperCase();
  return token.charAt(0).toUpperCase() + token.slice(1);
}

function displayTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/['.]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(displayToken);
}

/** ADP `LAST, FIRST` becomes `First Last`. Names without a comma stay as written. */
export function adpDisplayName(name: string) {
  const trimmed = collapseSpaces(name);
  if (!trimmed.includes(",")) return trimmed;
  const [lastRaw, firstRaw] = trimmed.split(",", 2);
  const last = displayTokens(lastRaw);
  const first = displayTokens(firstRaw);
  if (last.length === 0 || first.length === 0) return trimmed;
  return `${first.join(" ")} ${last.join(" ")}`;
}

export function rosterSourceLabel(driver: Pick<Driver, "rosterSource" | "scheduleWeeks">) {
  if (driver.rosterSource === "adp-only") return "ADP only";
  if (driver.rosterSource === "delivery-board") return "Sep 25 board only";
  const weeks = driver.scheduleWeeks ?? [];
  if (weeks.length === 0) return "Amazon schedule";
  return `Schedule · ${weeks.map((week) => `W${week}`).join(", ")}`;
}

function schedulePeople(): SchedulePerson[] {
  const byId = new Map<string, SchedulePerson>();
  for (const schedule of SCHEDULES) {
    for (const associate of schedule.associates) {
      const existing = byId.get(associate.transporterId);
      if (existing) {
        if (!existing.weeks.includes(schedule.week)) existing.weeks.push(schedule.week);
        continue;
      }
      byId.set(associate.transporterId, {
        transporterId: associate.transporterId,
        name: collapseSpaces(associate.name),
        weeks: [schedule.week],
      });
    }
  }
  for (const person of byId.values()) person.weeks.sort((a, b) => a - b);
  return [...byId.values()];
}

function collectAdpNames(): string[] {
  const names = new Set<string>();
  for (const file of ADP_FILES) {
    for (const rows of Object.values(file.groupTimecard)) {
      for (const row of rows) {
        const name = row.name.trim();
        if (name) names.add(name);
      }
    }
    for (const name of Object.keys(file.individualTimecards ?? {})) {
      const trimmed = name.trim();
      if (trimmed) names.add(trimmed);
    }
  }
  return [...names];
}

/**
 * Join a Delivery Execution "First Last" name to one schedule associate.
 * Exact tokens win. Otherwise first + last must be unique, so a middle name
 * on the schedule still matches the shorter board name.
 */
export function matchSchedulePerson<T extends { name: string }>(
  boardName: string,
  people: readonly T[]
): T | null {
  const boardTokens = nameTokens(boardName);
  if (boardTokens.length === 0) return null;
  const boardKey = boardTokens.join(" ");
  const exact = people.filter((person) => nameTokens(person.name).join(" ") === boardKey);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return null;
  if (boardTokens.length < 2) return null;
  const first = boardTokens[0];
  const last = boardTokens[boardTokens.length - 1];
  const firstLast = people.filter((person) => {
    const tokens = nameTokens(person.name);
    return tokens.length >= 2 && tokens[0] === first && tokens[tokens.length - 1] === last;
  });
  return firstLast.length === 1 ? firstLast[0] : null;
}

function uniqueId(base: string, used: Set<string>) {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let n = 2;
  while (used.has(`${base}-${n}`)) n += 1;
  const id = `${base}-${n}`;
  used.add(id);
  return id;
}

function driverStatus(assigned: Array<{ status: string }>): DriverStatus {
  const hasLive = assigned.some((route) => route.status === "in_progress");
  const onlyOpen =
    assigned.length > 0 &&
    assigned.every((route) => route.status === "no_progress" || route.status === "incomplete");
  if (hasLive) return "on_route";
  if (onlyOpen) return "available";
  return "off";
}

const routesByAssociate = new Map<string, typeof routes>();
for (const route of routes) {
  for (const id of route.associateIds) {
    const list = routesByAssociate.get(id) ?? [];
    list.push(route);
    routesByAssociate.set(id, list);
  }
}

function uniqueRoutes(ids: readonly string[]) {
  const seen = new Set<string>();
  const assigned: typeof routes = [];
  for (const id of ids) {
    for (const route of routesByAssociate.get(id) ?? []) {
      if (seen.has(route.id)) continue;
      seen.add(route.id);
      assigned.push(route);
    }
  }
  return assigned;
}

function toDriver(input: {
  id: string;
  aliasIds: string[];
  name: string;
  rosterSource: RosterSource;
  scheduleWeeks: number[];
  transporterId?: string;
  adpName?: string;
  assigned: typeof routes;
}): Driver {
  const role: DriverRole = "DA";
  return {
    id: input.id,
    aliasIds: input.aliasIds.length > 0 ? input.aliasIds : undefined,
    name: input.name,
    role,
    status: input.assigned.length === 0 ? "off" : driverStatus(input.assigned),
    todayPackages: input.assigned.reduce((sum, route) => sum + route.packagesDelivered, 0),
    todayStops: input.assigned.reduce((sum, route) => sum + route.completedStops, 0),
    incidentCount30d: 0,
    routeId: input.assigned[0]?.id,
    routeIds: input.assigned.map((route) => route.id),
    transporterId: input.transporterId,
    initials: initials(input.name),
    rosterSource: input.rosterSource,
    scheduleWeeks: input.scheduleWeeks,
    adpName: input.adpName,
  };
}

function buildRoster(): Driver[] {
  const people = schedulePeople();
  const used = new Set<string>();
  const linksByPerson = new Map<string, Array<{ name: string; id: string }>>();
  const consumedLinkIds = new Set<string>();

  for (const link of consoleDrivers) {
    const person = matchSchedulePerson(link.name, people);
    if (!person) continue;
    const list = linksByPerson.get(person.transporterId) ?? [];
    list.push({ name: link.name, id: link.id });
    linksByPerson.set(person.transporterId, list);
    consumedLinkIds.add(link.id);
  }

  const adpList = collectAdpNames();
  const claims = new Map<string, string[]>();
  for (const person of people) {
    const match = matchAmazonName(person.name, adpList);
    if (match.status !== "matched") continue;
    const ids = claims.get(match.adpName) ?? [];
    ids.push(person.transporterId);
    claims.set(match.adpName, ids);
  }
  const adpByTransporter = new Map<string, string>();
  const consumedAdp = new Set<string>();
  for (const [adpName, transporterIds] of claims) {
    if (transporterIds.length !== 1) continue;
    adpByTransporter.set(transporterIds[0], adpName);
    consumedAdp.add(adpName);
  }

  const drivers: Driver[] = [];

  for (const person of people) {
    const links = linksByPerson.get(person.transporterId) ?? [];
    const aliasIds = links.map((link) => link.id);
    const primaryBoardId = aliasIds[0];
    const id = primaryBoardId ?? uniqueId(associateId(person.name), used);
    if (primaryBoardId) used.add(primaryBoardId);
    for (const alias of aliasIds.slice(1)) used.add(alias);

    drivers.push(
      toDriver({
        id,
        aliasIds: aliasIds.slice(1),
        name: person.name,
        rosterSource: "amazon-schedule",
        scheduleWeeks: person.weeks,
        transporterId: person.transporterId,
        adpName: adpByTransporter.get(person.transporterId),
        assigned: uniqueRoutes(aliasIds),
      })
    );
  }

  for (const link of consoleDrivers) {
    if (consumedLinkIds.has(link.id) || used.has(link.id)) continue;
    used.add(link.id);
    drivers.push(
      toDriver({
        id: link.id,
        aliasIds: [],
        name: link.name,
        rosterSource: "delivery-board",
        scheduleWeeks: [],
        assigned: uniqueRoutes([link.id]),
      })
    );
  }

  for (const adpName of adpList) {
    if (consumedAdp.has(adpName)) continue;
    const name = adpDisplayName(adpName);
    drivers.push(
      toDriver({
        id: uniqueId(associateId(name), used),
        aliasIds: [],
        name,
        rosterSource: "adp-only",
        scheduleWeeks: [],
        adpName,
        assigned: [],
      })
    );
  }

  drivers.sort((a, b) => a.name.localeCompare(b.name, "en"));
  return drivers.map((driver) => {
    const employee = matchCensusEmployee(driver.name);
    if (!employee) return driver;
    const status = employmentStatus(employee.status);
    return {
      ...driver,
      phone: publishedPhone(employee),
      email: publishedEmail(employee),
      employmentStatus: status ?? undefined,
      censusName: employee.name,
    };
  });
}

export const rosterDrivers: Driver[] = buildRoster();

export function isPrimaryRoster(driver: Pick<Driver, "employmentStatus">) {
  return !driver.employmentStatus || driver.employmentStatus === "active";
}

export function filterRoster(
  drivers: readonly Driver[],
  filters: {
    query?: string;
    status?: DriverStatus | "all";
    role?: DriverRole | "all";
    source?: RosterSource | "all";
    employment?: Driver["employmentStatus"] | "unlisted" | "all";
  },
  routeCodes: (driver: Driver) => string[] = () => []
) {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const status = filters.status ?? "all";
  const role = filters.role ?? "all";
  const source = filters.source ?? "all";
  const employment = filters.employment ?? "all";
  return drivers.filter((driver) => {
    if (status !== "all" && driver.status !== status) return false;
    if (role !== "all" && driver.role !== role) return false;
    if (source !== "all" && driver.rosterSource !== source) return false;
    if (employment === "unlisted" && driver.employmentStatus) return false;
    if (employment === "active" && !isPrimaryRoster(driver)) return false;
    if (
      employment !== "all" &&
      employment !== "active" &&
      employment !== "unlisted" &&
      driver.employmentStatus !== employment
    ) {
      return false;
    }
    if (!query) return true;
    const haystack = [
      driver.name,
      driver.role,
      driver.phone,
      driver.email,
      driver.censusName,
      employmentLabel(driver.employmentStatus),
      driver.transporterId,
      driver.adpName,
      rosterSourceLabel(driver),
      ...routeCodes(driver),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}
