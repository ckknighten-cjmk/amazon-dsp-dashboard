/**
 * Maps the DSP Console Delivery Execution evening wrap (2026-11-18, 8:30 p.m. CT)
 * into domain models. Board chips come from seed totals. Exception rows are the
 * Packages CSV embedded as `exceptionPackages` (same file as
 * `packages-exceptions-2026-11-18.csv`, 183 rows). This capture stores those rows
 * with the CSV column names; earlier seeds used camelCase. The Nov 4 evening-wrap
 * scrape also carried `exceptionRowCount` and an `exceptionPackages` summary
 * (`csv`, `rows`, `byStatus`) instead of the row list. A summary is not iterated
 * as rows. The committed Nov 18 seed embeds the 183 CSV rows and keeps
 * `exceptionRowCount`. Vehicle and on-time % stay null. Gauges are execution 99,
 * locations 99, stops 99, packages 99, and attempt success 99. Routes are 49,
 * in progress 7, complete 42, incomplete 0. All 49 route cards are stored,
 * including pseudo-route RDM__h9ZQ0bCCOFo= (Shanteria Smith, 1/1 stops, 9/9
 * deliveries), the same way earlier RDM__ cards were stored. The In progress
 * filter returned TX75, CX295, TX74, TX76, AV17, CX286, and TX69. The other 42
 * stay complete. CX279, CX291, CX301, and TX70 were short of planned stops and
 * stay complete because the capture counted them in the 42. Route-row packages
 * are 11,354 of 11,455, matching the published delivery total. Route-row stops
 * are 7,860 of 7,877. Per-route packages remaining sums to 101. The board
 * remaining chip is 28. Pickup failed is 73 on the board and 72 in the CSV.
 * workHourRisk is 0. multiTransporter is 15, and 15 cards list more than one
 * associate. rescueActions is 0. unknownStops is 33. Ahead, at risk, and behind
 * are 1 / 3 / 0. On-road pickups are 6 (0 remaining, 6 complete). capturedAt is
 * 2026-11-18T20:30-06:00.
 */
import type {
  DeliveryExecutionBoard,
  Driver,
  PackageException,
  PackageExceptionStatus,
  Route,
  RouteStatus,
} from "@/lib/types";
import seed from "@/lib/data/seed/delivery-execution-2026-11-18.json";

type SeedRouteJson = (typeof seed)["routes"][number];
/**
 * Nov 4, Nov 6, Nov 9, Nov 10, Nov 11, Nov 12, Nov 13, Nov 16, Nov 17, and Nov 18 notes are lists. Earlier seeds store pace text in the same field.
 * Nov 6, Nov 9, Nov 10, Nov 11, Nov 12, Nov 13, Nov 16, Nov 17, and Nov 18 routes include riskLevel. Earlier seeds omit it.
 * Nov 17 stored routes name no associates and no badges. Nov 18 stores every listed card, including associates and badges.
 * The shared route type stays wide enough for earlier seeds.
 */
type SeedRoute = Omit<SeedRouteJson, "notes" | "riskLevel" | "associates" | "exceptionBadges" | "status"> & {
  notes: string[] | string | null;
  riskLevel?: string | null;
  associates: string[];
  exceptionBadges: string[];
  status: string;
};

const STATUS_MAP: Record<string, RouteStatus> = {
  complete: "completed",
  in_progress: "in_progress",
  // Nov 3, Nov 4, Nov 6, Nov 9, Nov 10, and Nov 11 capture text before it is stored as in_progress.
  "in progress": "in_progress",
  no_progress: "no_progress",
  incomplete: "incomplete",
  // Nov 3 CX327 and CX288, and Nov 4 CX341 and CX302, had packages left and no
  // badge. The incomplete chip was null. The route status set has no separate
  // value, so those rows stay Incomplete. Nov 4 already stores status as incomplete.
  // Nov 6 CX310 and CX330 also had no badge and are stored as incomplete. The
  // Nov 6 incomplete chip is 2. Nov 9 CX305, CX316, CX309, and CX330 had no
  // badge and are stored as incomplete. The Nov 9 incomplete chip is 4. Nov 10
  // CX356 had no badge and is stored as incomplete. The Nov 10 incomplete chip is 1.
  // Nov 11 has 16 routes with no badge, stored as incomplete. The Nov 11 incomplete chip is 16.
  // Nov 12 CX367 had no badge and is stored as incomplete. The Nov 12 incomplete chip is 1.
  // Nov 13 CX358 is the only named route and is stored as incomplete. The Nov 13 incomplete chip is 1.
  // Nov 16 stores CX308 as in_progress. CX296, CX310, and TX81 are incomplete. The Nov 16 incomplete chip is 3.
  // Nov 17 stores CX323 as in_progress. CX309 and CX319 stay complete. The capture
  // listed 1 in progress and 50 complete, so the Nov 17 incomplete count is 0.
  // Nov 18 stores TX75, CX295, TX74, TX76, AV17, CX286, and TX69 as in_progress.
  // The other 42 cards stay complete, including CX279, CX291, CX301, and TX70,
  // which were short of planned stops. The Nov 18 incomplete count is 0.
  "incomplete (no badge)": "incomplete",
  // Oct 29 lists AX93, AX96, and AX97 as not_departed. The route status set has
  // no separate value, so those rows stay Not started. The seed keeps not_departed.
  not_departed: "not_started",
};

function slugName(name: string) {
  return `da-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

function slugRoute(code: string) {
  return `rt-${code.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function readCount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.length;
  return null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** This capture stores route notes as a list. Older seeds used a string. */
function routeNotes(notes: SeedRoute["notes"] | string | null | undefined): string | null {
  if (notes == null) return null;
  const parts = (Array.isArray(notes) ? notes : [notes])
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join("; ") : null;
}

function readOnTimePct(row: SeedRoute): number | null {
  const value = (row as { onTimePct?: unknown }).onTimePct;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

type SeedExtras = {
  totals: { rescueActions?: unknown };
  exceptions?: { rescueActions?: unknown };
};

function titleStatus(raw: string): PackageExceptionStatus {
  const allowed: PackageExceptionStatus[] = [
    "Reattemptable",
    "Undeliverable",
    "Missing",
    "Returned to station",
    "Pickup failed",
  ];
  if (allowed.includes(raw as PackageExceptionStatus)) {
    return raw as PackageExceptionStatus;
  }
  return "Undeliverable";
}

/** Earlier seeds use camelCase. This scrape uses the Packages CSV column names. */
function exceptionText(row: object, camel: string, header: string) {
  const record = row as Record<string, unknown>;
  const value = record[camel] ?? record[header];
  return typeof value === "string" ? value : "";
}

function readException(row: object) {
  return {
    scannableId: exceptionText(row, "scannableId", "Scannable Id"),
    routeCode: exceptionText(row, "routeCode", "Route Code"),
    transporterName: exceptionText(row, "transporterName", "Transporter Name"),
    transporterId: exceptionText(row, "transporterId", "Transporter Id"),
    address: exceptionText(row, "address", "Address"),
    packageStatus: exceptionText(row, "packageStatus", "Package Status"),
    reasonCode: exceptionText(row, "reasonCode", "Reason Code"),
    lastScan: exceptionText(row, "lastScan", "Time of last scan"),
  };
}

/**
 * Prior seeds embed exception rows as an array. The Nov 4 scrape stored a
 * summary object (`csv`, `rows`, `byStatus`) plus `exceptionRowCount` instead
 * of that list. A summary is not a row list, so it contributes no packages.
 * The committed Nov 4, Nov 6, Nov 9, Nov 10, Nov 11, Nov 12, Nov 13, Nov 16, Nov 17, and Nov 18 seeds embed the CSV rows and keep `exceptionRowCount`.
 */
export function exceptionPackageRows(value: unknown): object[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is object => row != null && typeof row === "object" && !Array.isArray(row));
}

export function associateId(name: string) {
  return slugName(name);
}

export type DeliveryDay = {
  serviceDate: string;
  board: DeliveryExecutionBoard;
  routes: Route[];
  exceptions: PackageException[];
  drivers: Driver[];
};

/** Loose shape shared by every dated Delivery Execution seed. */
export type DeliverySeed = {
  source: string;
  serviceDate: string;
  capturedAt: string;
  snapshot: string;
  disclaimer: string;
  station: { code: string };
  totals: {
    routes: number;
    inProgress: number;
    incomplete: number | null;
    complete?: number | null;
    /** Published route-card sum when the capture did not include every card. */
    packagesDelivered?: number;
    packagesPlanned?: number;
    executionGaugesPct: DeliveryExecutionBoard["totals"]["executionGaugesPct"];
    packageStatusCounts: {
      remaining: number;
      reattemptable: number;
      undeliverable: number;
      missing: number;
      returned_to_station: number;
      pickup_failed: number;
      pending_containers_pickup: number;
      pending_packages_pickup: number;
    };
    workHourRisk: number | null;
    multiTransporter: number | null;
    rescueActions?: unknown;
    unknownStops: number | null;
    onBreak: number | null;
    noBreaksTaken: number | null;
    inactive: number | null;
    onRoadPickups: DeliveryExecutionBoard["totals"]["onRoadPickups"];
  };
  exceptions?: { rescueActions?: unknown };
  routes: SeedRoute[];
  /** Row list, or a Nov 4-style summary that is not itself rows. */
  exceptionPackages: readonly object[] | { csv?: string; rows?: number; byStatus?: Record<string, number> };
  /** Present on the Nov 4, Nov 6, Nov 9, Nov 10, Nov 11, Nov 12, Nov 13, Nov 16, Nov 17, and Nov 18 scrapes. The row count also lives on `exceptionPackagesRowCount`. */
  exceptionRowCount?: number;
};

/** Map one dated seed. The live Nov 18 board is this function applied to that file. */
export function mapDeliverySeed(file: DeliverySeed): DeliveryDay {
  const packageRows = exceptionPackageRows(file.exceptionPackages);
  const transporterByName = new Map<string, string>();
  for (const row of packageRows.map(readException)) {
    if (row.transporterName && row.transporterId) {
      transporterByName.set(row.transporterName, row.transporterId);
    }
  }

  const fileExtras = file as DeliverySeed & SeedExtras;
  const fileRescueActions = readCount(
    fileExtras.exceptions?.rescueActions ?? fileExtras.totals.rescueActions
  );

  const dayRoutes: Route[] = file.routes.map((row) => {
    const associateIds = row.associates.map(associateId);
    const receivedRescue = associateIds.length > 1;
    const rescueDriverIds = receivedRescue ? associateIds.slice(1) : [];
    return {
      id: slugRoute(row.routeCode),
      code: row.routeCode,
      stationCode: file.station.code,
      wave: null,
      driverId: associateIds[0] ?? null,
      associateIds,
      receivedRescue,
      rescueDriverIds,
      rescueDriverId: rescueDriverIds[0],
      vehicleId: null,
      packageCount: row.packagesPlanned,
      packagesDelivered: row.packagesDelivered,
      packagesRemaining: row.packagesRemaining,
      stopCount: row.stopsPlanned,
      completedStops: row.stopsDone,
      status: STATUS_MAP[row.status] ?? "not_started",
      progressPct: row.completionPct,
      eta: null,
      finishTime: null,
      startedAt: null,
      onTimePct: readOnTimePct(row),
      notes: routeNotes(row.notes),
      stops: [],
    };
  });

  const summedDelivered = dayRoutes.reduce((sum, route) => sum + route.packagesDelivered, 0);
  const summedPlanned = dayRoutes.reduce((sum, route) => sum + route.packageCount, 0);
  const publishedDelivered = finiteNumber(file.totals.packagesDelivered);
  const publishedPlanned = finiteNumber(file.totals.packagesPlanned);
  const packagesDelivered = publishedDelivered ?? summedDelivered;
  const packagesPlanned = publishedPlanned ?? summedPlanned;
  const pkg = file.totals.packageStatusCounts;
  const board: DeliveryExecutionBoard = {
    source: file.source,
    serviceDate: file.serviceDate,
    capturedAt: file.capturedAt,
    snapshot: file.snapshot,
    disclaimer: file.disclaimer,
    totals: {
      routes: file.totals.routes,
      inProgress: file.totals.inProgress,
      incomplete: file.totals.incomplete,
      complete: finiteNumber(file.totals.complete),
      executionGaugesPct: file.totals.executionGaugesPct,
      packagesDelivered,
      packagesPlanned,
      packageStatusCounts: {
        remaining: pkg.remaining,
        reattemptable: pkg.reattemptable,
        undeliverable: pkg.undeliverable,
        missing: pkg.missing,
        returnedToStation: pkg.returned_to_station,
        pickupFailed: pkg.pickup_failed,
        pendingContainersPickup: pkg.pending_containers_pickup,
        pendingPackagesPickup: pkg.pending_packages_pickup,
      },
      workHourRisk: file.totals.workHourRisk,
      multiTransporter: file.totals.multiTransporter,
      rescueActions: fileRescueActions,
      unknownStops: file.totals.unknownStops,
      onBreak: file.totals.onBreak,
      noBreaksTaken: file.totals.noBreaksTaken,
      inactive: file.totals.inactive,
      onRoadPickups: file.totals.onRoadPickups,
    },
  };

  const routeIdByCode = new Map(dayRoutes.map((r) => [r.code, r.id]));
  const dayExceptions: PackageException[] = packageRows.map((raw) => {
    const row = readException(raw);
    return {
      id: row.scannableId,
      scannableId: row.scannableId,
      routeCode: row.routeCode,
      routeId: routeIdByCode.get(row.routeCode) ?? slugRoute(row.routeCode),
      transporterName: row.transporterName,
      transporterId: row.transporterId,
      address: row.address,
      status: titleStatus(row.packageStatus),
      reasonCode: row.reasonCode,
      lastScan: row.lastScan ? row.lastScan.replace(" ", "T") : null,
    };
  });

  const routesByAssociate = new Map<string, Route[]>();
  for (const route of dayRoutes) {
    for (const id of route.associateIds) {
      const list = routesByAssociate.get(id) ?? [];
      list.push(route);
      routesByAssociate.set(id, list);
    }
  }

  const names = new Set<string>();
  for (const row of file.routes) {
    for (const name of row.associates) names.add(name);
  }

  const drivers: Driver[] = [...names]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => {
      const id = associateId(name);
      const assigned = routesByAssociate.get(id) ?? [];
      const hasLive = assigned.some((r) => r.status === "in_progress");
      const onlyOpen =
        assigned.length > 0 &&
        assigned.every((r) => r.status === "no_progress" || r.status === "incomplete");
      return {
        id,
        name,
        role: "DA" as const,
        status: hasLive ? "on_route" : onlyOpen ? "available" : "off",
        todayPackages: assigned.reduce((sum, r) => sum + r.packagesDelivered, 0),
        todayStops: assigned.reduce((sum, r) => sum + r.completedStops, 0),
        incidentCount30d: 0,
        routeId: assigned[0]?.id,
        routeIds: assigned.map((r) => r.id),
        transporterId: transporterByName.get(name),
        initials: initials(name),
      };
    });

  return {
    serviceDate: file.serviceDate,
    board,
    routes: dayRoutes,
    exceptions: dayExceptions,
    drivers,
  };
}

export const liveDeliveryDay = mapDeliverySeed(seed as DeliverySeed);
export const routes: Route[] = liveDeliveryDay.routes;
export const deliveryBoard: DeliveryExecutionBoard = liveDeliveryDay.board;
export const exceptions: PackageException[] = liveDeliveryDay.exceptions;
export const consoleDrivers: Driver[] = liveDeliveryDay.drivers;

export function exceptionsForRoute(routeId: string) {
  return exceptions.filter((row) => row.routeId === routeId);
}

const EXPORT_CHIPS: Array<{
  status: PackageExceptionStatus;
  chip: keyof DeliveryExecutionBoard["totals"]["packageStatusCounts"];
  label: string;
}> = [
  { status: "Reattemptable", chip: "reattemptable", label: "reattemptable" },
  { status: "Undeliverable", chip: "undeliverable", label: "undeliverable" },
  { status: "Missing", chip: "missing", label: "missing" },
  { status: "Returned to station", chip: "returnedToStation", label: "RTS" },
  { status: "Pickup failed", chip: "pickupFailed", label: "pickup failed" },
];

/**
 * Multi-associate Delivery Execution routes are treated as rescued.
 * The first listed associate is primary. The rest are rescuers.
 * Nov 18 lists rescueActions as 0. Fifteen route cards name more than one
 * associate, matching the multi-transporter chip, so those crews are inferred
 * rescues. That column is still not Amazon’s official rescue flag.
 */
export const RESCUE_RULE =
  "Rescue: Yes means the route listed more than one associate. The first associate is primary and the others are rescuers. This follows the multi-transporter crew on the board. It is not Amazon’s rescueActions flag unless that list is in the capture.";

export function rescueBoardNoteFor(day: DeliveryDay) {
  const inferred = day.routes.filter((route) => route.receivedRescue).length;
  const actions =
    day.board.totals.rescueActions == null
      ? "This capture has no rescueActions list, so the column is not Amazon’s official rescue flag."
      : `Console rescueActions count is ${day.board.totals.rescueActions}.`;
  const multi =
    day.board.totals.multiTransporter == null
      ? "not published"
      : String(day.board.totals.multiTransporter);
  return `${RESCUE_RULE} Inferred rescues on this board: ${inferred}. Console multi-transporter total: ${multi}. ${actions}`;
}

export function rescueBoardNote() {
  return rescueBoardNoteFor(liveDeliveryDay);
}

/** Console board chips vs the Packages CSV. Only the statuses that disagree are called out. */
export function exceptionExportNoteFor(day: DeliveryDay) {
  const csv = new Map<PackageExceptionStatus, number>();
  for (const row of day.exceptions) csv.set(row.status, (csv.get(row.status) ?? 0) + 1);
  const chips = day.board.totals.packageStatusCounts;
  const gaps = EXPORT_CHIPS.filter((item) => (csv.get(item.status) ?? 0) !== chips[item.chip]);
  if (gaps.length === 0) {
    const summary = EXPORT_CHIPS.map((item) => `${chips[item.chip]} ${item.label}`).join(", ");
    return `Table is the ${day.exceptions.length}-row Packages CSV. Console board chips match the export (${summary}). Remaining is a board chip and is not an export status.`;
  }
  const csvPart = gaps.map((item) => `${csv.get(item.status) ?? 0} ${item.label}`).join(", ");
  const consolePart = gaps.map((item) => chips[item.chip]).join(" / ");
  return `Table is the ${day.exceptions.length}-row Packages CSV (${csvPart}). Board chips above use Console totals (${consolePart}) and can differ from export rows.`;
}

export function exceptionExportNote() {
  return exceptionExportNoteFor(liveDeliveryDay);
}
