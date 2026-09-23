/**
 * DNA4 yard roster from Administration → Fleet → My vehicles.
 * Rows live in `src/lib/data/seed/amazon-fleet-dna4.json`. An empty `vehicles`
 * array keeps the 22-van mock. Year and mileage stay null when Console left them blank.
 */
import type { Vehicle, VehicleStatus, VehicleType } from "@/lib/types";
import { routes } from "@/lib/data/delivery-execution";
import { vehicles as mockVehicles } from "@/lib/data/vehicles";
import seed from "@/lib/data/seed/amazon-fleet-dna4.json";

export const FLEET_NAV = "Administration → Fleet → My vehicles";

export interface ConsoleFleetVehicle {
  unit: string;
  plate: string;
  makeModel: string;
  vin: string;
  ownership: string;
  type: string;
  expiration?: string | null;
  status: string;
  statusReason: string | null;
  lastRouteCompleted: string | null;
  assignedRoute: string | null;
  year?: number | null;
  mileage?: number | null;
  notes?: string | null;
}

export interface ConsoleFleetSeed {
  source: string;
  capturedAt?: string;
  station?: string | { code: string; dsp: string };
  nav?: string;
  placeholder?: boolean;
  note?: string;
  vehicles: ConsoleFleetVehicle[];
}

export interface FleetYard {
  origin: "console" | "mock";
  nav: string;
  note: string;
  capturedAt: string | null;
  vehicles: Vehicle[];
}

const routeIdByCode = new Map(routes.map((route) => [route.code, route.id]));

function slugId(unit: string, vin: string) {
  const source = unit.trim() || vin || "vehicle";
  return `veh-${source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

export function mapConsoleType(type: string, makeModel: string): VehicleType {
  const blob = `${type} ${makeModel}`.toLowerCase();
  if (
    blob.includes("edv") ||
    blob.includes("rivian") ||
    blob.includes("electric") ||
    blob.includes("amazon van")
  ) {
    return "edv";
  }
  if (blob.includes("step")) return "step_van";
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

function publishedNumber(value: number | null | undefined) {
  return typeof value === "number" ? value : null;
}

export function mapConsoleFleet(rows: readonly ConsoleFleetVehicle[]): Vehicle[] {
  const used = new Set<string>();
  return rows.map((row) => {
    const base = slugId(row.unit, row.vin);
    let id = base;
    let n = 2;
    while (used.has(id)) {
      id = `${base}-${n}`;
      n += 1;
    }
    used.add(id);
    const assignedRoute = row.assignedRoute?.trim() || null;
    const reason = row.statusReason?.trim() || null;
    const notes = row.notes?.trim() || reason;
    return {
      id,
      unitId: row.unit.trim(),
      type: mapConsoleType(row.type, row.makeModel),
      status: mapConsoleStatus(row.status, assignedRoute),
      mileage: publishedNumber(row.mileage),
      lastInspection: null,
      year: publishedNumber(row.year),
      plate: row.plate,
      vin: row.vin || undefined,
      makeModel: row.makeModel || undefined,
      ownership: row.ownership || undefined,
      consoleType: row.type || undefined,
      expiration: row.expiration?.trim() || null,
      consoleStatus: row.status || undefined,
      statusReason: reason,
      lastRouteCompleted: row.lastRouteCompleted,
      assignedRouteCode: assignedRoute,
      assignedRouteId: assignedRoute ? routeIdByCode.get(assignedRoute) : undefined,
      notes: notes ?? undefined,
      origin: "console" as const,
    };
  });
}

export function yardFromSeed(input: ConsoleFleetSeed): FleetYard {
  const nav = input.nav?.trim() || FLEET_NAV;
  const note =
    input.note?.trim() ||
    "DNA4 My vehicles. Year and mileage stay empty when Console left them blank.";
  if (input.vehicles.length === 0) {
    return {
      origin: "mock",
      nav,
      note,
      capturedAt: input.capturedAt ?? null,
      vehicles: mockVehicles.map((van) => ({
        ...van,
        assignedRouteId: undefined,
        status: van.status === "on_route" ? "ready" : van.status,
        origin: "mock" as const,
      })),
    };
  }
  return {
    origin: "console",
    nav,
    note,
    capturedAt: input.capturedAt ?? null,
    vehicles: mapConsoleFleet(input.vehicles),
  };
}

export function loadYard(): FleetYard {
  return yardFromSeed(seed as ConsoleFleetSeed);
}
