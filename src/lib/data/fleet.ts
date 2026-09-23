/**
 * DNA4 yard roster.
 *
 * Real rows belong in `src/lib/data/seed/amazon-fleet-dna4.json`
 * (Administration → Fleet → My vehicles). An empty `vehicles` array keeps the
 * 22-van mock. Delivery Execution and the Week 38/39 schedules do not name vans.
 */
import type { Vehicle, VehicleStatus, VehicleType } from "@/lib/types";
import { routes } from "@/lib/data/delivery-execution";
import { vehicles as mockVehicles } from "@/lib/data/vehicles";
import seed from "@/lib/data/seed/amazon-fleet-dna4.json";

export interface ConsoleFleetVehicle {
  unit: string;
  plate: string;
  makeModel: string;
  vin: string;
  ownership: string;
  type: string;
  status: string;
  statusReason: string | null;
  lastRouteCompleted: string | null;
  assignedRoute: string | null;
}

export interface ConsoleFleetSeed {
  source: string;
  nav: string;
  station: { code: string; dsp: string };
  placeholder?: boolean;
  note?: string;
  vehicles: ConsoleFleetVehicle[];
}

export interface FleetYard {
  origin: "console" | "mock";
  nav: string;
  note: string;
  vehicles: Vehicle[];
}

const routeIdByCode = new Map(routes.map((route) => [route.code, route.id]));

function slugUnit(unit: string) {
  return `veh-${unit
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

export function mapConsoleType(type: string, makeModel: string): VehicleType {
  const blob = `${type} ${makeModel}`.toLowerCase();
  if (blob.includes("step")) return "step_van";
  if (
    blob.includes("edv") ||
    blob.includes("rivian") ||
    blob.includes("electric") ||
    blob.includes("amazon van")
  ) {
    return "edv";
  }
  return "rental_cargo";
}

export function mapConsoleStatus(status: string, assignedRoute: string | null): VehicleStatus {
  const value = status.trim().toLowerCase();
  if (
    value.includes("out of service") ||
    value === "oos" ||
    value.includes("grounded") ||
    value.includes("inactive")
  ) {
    return "oos";
  }
  if (value.includes("maintenance") || value.includes("repair") || value.includes("shop")) {
    return "maintenance";
  }
  if (value.includes("on route") || value.includes("en route") || Boolean(assignedRoute)) {
    return "on_route";
  }
  return "ready";
}

export function mapConsoleFleet(rows: readonly ConsoleFleetVehicle[]): Vehicle[] {
  const used = new Set<string>();
  return rows.map((row) => {
    const base = slugUnit(row.unit || row.vin || "vehicle");
    let id = base;
    let n = 2;
    while (used.has(id)) {
      id = `${base}-${n}`;
      n += 1;
    }
    used.add(id);
    const assignedRoute = row.assignedRoute?.trim() || null;
    const reason = row.statusReason?.trim() || null;
    return {
      id,
      unitId: row.unit,
      type: mapConsoleType(row.type, row.makeModel),
      status: mapConsoleStatus(row.status, assignedRoute),
      mileage: null,
      lastInspection: null,
      year: null,
      plate: row.plate,
      vin: row.vin || undefined,
      makeModel: row.makeModel || undefined,
      ownership: row.ownership || undefined,
      consoleStatus: row.status || undefined,
      statusReason: reason,
      lastRouteCompleted: row.lastRouteCompleted,
      assignedRouteCode: assignedRoute,
      assignedRouteId: assignedRoute ? routeIdByCode.get(assignedRoute) : undefined,
      notes: reason ?? undefined,
      origin: "console" as const,
    };
  });
}

function seedRows(): ConsoleFleetVehicle[] {
  return seed.vehicles as ConsoleFleetVehicle[];
}

export function loadYard(): FleetYard {
  const rows = seedRows();
  if (rows.length > 0) {
    return {
      origin: "console",
      nav: seed.nav,
      note: seed.note,
      vehicles: mapConsoleFleet(rows),
    };
  }
  return {
    origin: "mock",
    nav: seed.nav,
    note: seed.note,
    vehicles: mockVehicles.map((van) => ({
      ...van,
      assignedRouteId: undefined,
      status: van.status === "on_route" ? "ready" : van.status,
      origin: "mock" as const,
    })),
  };
}
