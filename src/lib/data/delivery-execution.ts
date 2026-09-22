/**
 * Maps the DSP Console Delivery Execution scrape (2026-09-21) into domain models.
 * Vehicle and on-time % are left null — Console did not show them.
 */
import type {
  DeliveryExecutionBoard,
  Driver,
  PackageException,
  PackageExceptionStatus,
  Route,
  RouteStatus,
} from "@/lib/types";
import seed from "@/lib/data/seed/delivery-execution-2026-09-21.json";

type SeedRoute = (typeof seed)["routes"][number];
type SeedException = (typeof seed)["exceptionPackages"][number];

const STATUS_MAP: Record<string, RouteStatus> = {
  complete: "completed",
  in_progress: "in_progress",
  no_progress: "no_progress",
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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

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

export const deliveryBoard: DeliveryExecutionBoard = {
  source: seed.source,
  serviceDate: seed.serviceDate,
  capturedAt: seed.capturedAt,
  disclaimer: seed.disclaimer,
  totals: seed.totals,
};

export const routes: Route[] = (seed.routes as SeedRoute[]).map((row) => {
  const associateIds = row.associates.map(associateId);
  return {
    id: slugRoute(row.routeCode),
    code: row.routeCode,
    stationCode: seed.station.code,
    wave: null,
    driverId: associateIds[0] ?? null,
    associateIds,
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
    const onlyNoProgress =
      assigned.length > 0 && assigned.every((r) => r.status === "no_progress");
    return {
      id,
      name,
      role: "DA" as const,
      status: hasLive ? "on_route" : onlyNoProgress ? "available" : "off",
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
