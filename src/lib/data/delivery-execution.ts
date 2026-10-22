/**
 * Maps the DSP Console Delivery Execution evening wrap (2026-10-21, ~8:08 p.m. CT)
 * into domain models. Board chips come from seed totals. Exception rows are the
 * Packages CSV embedded as `exceptionPackages` (same file as
 * `packages-exceptions-2026-10-21.csv`, 107 rows). This capture stores those rows
 * with the CSV column names; earlier seeds used camelCase. Vehicle and on-time %
 * stay null. Execution gauges in this capture are 99/99/99/99 (locations, stops,
 * packages, attempt success). Status is in progress per the board: 2 in progress
 * (CX287, CX267) and 36 complete. CX255 stays complete at 192/193 stops because the
 * board in-progress chip was 2. Ahead, at risk, and behind are the board chips
 * (1 / 1 / 0), not a recount of the route-row badges.
 */
import type {
  DeliveryExecutionBoard,
  Driver,
  PackageException,
  PackageExceptionStatus,
  Route,
  RouteStatus,
} from "@/lib/types";
import seed from "@/lib/data/seed/delivery-execution-2026-10-21.json";

type SeedRoute = (typeof seed)["routes"][number];
type SeedException = (typeof seed)["exceptionPackages"][number];

const STATUS_MAP: Record<string, RouteStatus> = {
  complete: "completed",
  in_progress: "in_progress",
  no_progress: "no_progress",
  incomplete: "incomplete",
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

function readException(row: SeedException) {
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
    incomplete: number;
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
    workHourRisk: number;
    multiTransporter: number;
    rescueActions?: unknown;
    unknownStops: number;
    onBreak: number;
    noBreaksTaken: number;
    inactive: number;
    onRoadPickups: DeliveryExecutionBoard["totals"]["onRoadPickups"];
  };
  exceptions?: { rescueActions?: unknown };
  routes: SeedRoute[];
  exceptionPackages: SeedException[];
};

/** Map one dated seed. The live Oct 21 board is this function applied to that file. */
export function mapDeliverySeed(file: DeliverySeed): DeliveryDay {
  const transporterByName = new Map<string, string>();
  for (const row of file.exceptionPackages.map(readException)) {
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

  const packagesDelivered = dayRoutes.reduce((sum, route) => sum + route.packagesDelivered, 0);
  const packagesPlanned = dayRoutes.reduce((sum, route) => sum + route.packageCount, 0);
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
  const dayExceptions: PackageException[] = file.exceptionPackages.map((raw) => {
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
 * Oct 21 publishes rescueActions as 0, so this column is still not
 * Amazon’s official rescue flag.
 */
export const RESCUE_RULE =
  "Rescue: Yes means the route listed more than one associate. The first associate is primary and the others are rescuers. This follows the multi-transporter crew on the board. It is not Amazon’s rescueActions flag unless that list is in the capture.";

export function rescueBoardNoteFor(day: DeliveryDay) {
  const inferred = day.routes.filter((route) => route.receivedRescue).length;
  const actions =
    day.board.totals.rescueActions == null
      ? "This capture has no rescueActions list, so the column is not Amazon’s official rescue flag."
      : `Console rescueActions count is ${day.board.totals.rescueActions}.`;
  return `${RESCUE_RULE} Inferred rescues on this board: ${inferred}. Console multi-transporter total: ${day.board.totals.multiTransporter}. ${actions}`;
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
