/**
 * Maps the DSP Console Delivery Execution evening wrap (2026-09-23, ~8:15 p.m. CT)
 * into domain models. Board chips come from seed totals. Exception rows are the
 * Packages CSV embedded as `exceptionPackages` (same file as
 * `packages-exceptions-2026-09-23.csv`). Vehicle and on-time % stay null.
 */
import type {
  DeliveryExecutionBoard,
  Driver,
  PackageException,
  PackageExceptionStatus,
  Route,
  RouteStatus,
} from "@/lib/types";
import seed from "@/lib/data/seed/delivery-execution-2026-09-23.json";

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

type SeedExtras = {
  totals: { rescueActions?: unknown };
  exceptions?: { rescueActions?: unknown };
};

const seedExtras = seed as typeof seed & SeedExtras;
const rescueActions = readCount(
  seedExtras.exceptions?.rescueActions ?? seedExtras.totals.rescueActions
);

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

const transporterByName = new Map<string, string>();
for (const row of seed.exceptionPackages as SeedException[]) {
  if (row.transporterName && row.transporterId) {
    transporterByName.set(row.transporterName, row.transporterId);
  }
}

export function associateId(name: string) {
  return slugName(name);
}

export const routes: Route[] = (seed.routes as SeedRoute[]).map((row) => {
  const associateIds = row.associates.map(associateId);
  const receivedRescue = associateIds.length > 1;
  const rescueDriverIds = receivedRescue ? associateIds.slice(1) : [];
  return {
    id: slugRoute(row.routeCode),
    code: row.routeCode,
    stationCode: seed.station.code,
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
    onTimePct: row.onTimePct,
    notes: row.notes || null,
    stops: [],
  };
});

const packagesDelivered = routes.reduce((sum, route) => sum + route.packagesDelivered, 0);
const packagesPlanned = routes.reduce((sum, route) => sum + route.packageCount, 0);
const pkg = seed.totals.packageStatusCounts;

export const deliveryBoard: DeliveryExecutionBoard = {
  source: seed.source,
  serviceDate: seed.serviceDate,
  capturedAt: seed.capturedAt,
  snapshot: seed.snapshot,
  disclaimer: seed.disclaimer,
  totals: {
    routes: seed.totals.routes,
    inProgress: seed.totals.inProgress,
    incomplete: seed.totals.incomplete,
    executionGaugesPct: seed.totals.executionGaugesPct,
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
    workHourRisk: seed.totals.workHourRisk,
    multiTransporter: seed.totals.multiTransporter,
    rescueActions,
    unknownStops: seed.totals.unknownStops,
    onBreak: seed.totals.onBreak,
    noBreaksTaken: seed.totals.noBreaksTaken,
    inactive: seed.totals.inactive,
    onRoadPickups: seed.totals.onRoadPickups,
  },
};

const routeIdByCode = new Map(routes.map((r) => [r.code, r.id]));

export const exceptions: PackageException[] = (
  seed.exceptionPackages as SeedException[]
).map((row) => ({
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
}));

const routesByAssociate = new Map<string, Route[]>();
for (const route of routes) {
  for (const id of route.associateIds) {
    const list = routesByAssociate.get(id) ?? [];
    list.push(route);
    routesByAssociate.set(id, list);
  }
}

const names = new Set<string>();
for (const row of seed.routes as SeedRoute[]) {
  for (const name of row.associates) names.add(name);
}

export const consoleDrivers: Driver[] = [...names]
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
 * Sep 23 publishes rescueActions as 0, so this column is still not
 * Amazon’s official rescue flag.
 */
export const RESCUE_RULE =
  "Rescue: Yes means the route listed more than one associate. The first associate is primary and the others are rescuers. This follows the multi-transporter crew on the board. It is not Amazon’s rescueActions flag unless that list is in the capture.";

export function rescueBoardNote() {
  const inferred = routes.filter((route) => route.receivedRescue).length;
  const actions =
    deliveryBoard.totals.rescueActions == null
      ? "This capture has no rescueActions list, so the column is not Amazon’s official rescue flag."
      : `Console rescueActions count is ${deliveryBoard.totals.rescueActions}.`;
  return `${RESCUE_RULE} Inferred rescues on this board: ${inferred}. Console multi-transporter total: ${deliveryBoard.totals.multiTransporter}. ${actions}`;
}

/** Console board chips vs the Packages CSV. Only the statuses that disagree are called out. */
export function exceptionExportNote() {
  const csv = new Map<PackageExceptionStatus, number>();
  for (const row of exceptions) csv.set(row.status, (csv.get(row.status) ?? 0) + 1);
  const chips = deliveryBoard.totals.packageStatusCounts;
  const gaps = EXPORT_CHIPS.filter((item) => (csv.get(item.status) ?? 0) !== chips[item.chip]);
  if (gaps.length === 0) {
    const summary = EXPORT_CHIPS.map((item) => `${chips[item.chip]} ${item.label}`).join(", ");
    return `Table is the ${exceptions.length}-row Packages CSV. Console board chips match the export (${summary}). Remaining is a board chip and is not an export status.`;
  }
  const csvPart = gaps.map((item) => `${csv.get(item.status) ?? 0} ${item.label}`).join(", ");
  const consolePart = gaps.map((item) => chips[item.chip]).join(" / ");
  return `Table is the ${exceptions.length}-row Packages CSV (${csvPart}). Board chips above use Console totals (${consolePart}) and can differ from export rows.`;
}
