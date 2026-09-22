/**
 * Data access layer for the DSP ops dashboard.
 *
 * Routes / associates / exceptions for 2026-09-21 come from the DSP Console
 * end-of-day Delivery Execution scrape in `src/lib/data/seed`. Scorecard is Week 37
 * Console Performance Summary. Fleet and incidents remain mock fixtures.
 */

import type {
  DateRange,
  Driver,
  Incident,
  OverviewSnapshot,
  PackageException,
  Route,
  ScorecardSnapshot,
  StationSettings,
  Vehicle,
  DeliveryExecutionBoard,
} from "@/lib/types";
import { station as seedStation } from "@/lib/data/drivers";
import { vehicles as mockVehicles } from "@/lib/data/vehicles";
import {
  consoleDrivers,
  deliveryBoard,
  exceptions,
  exceptionsForRoute,
  routes,
} from "@/lib/data/delivery-execution";
import { incidents } from "@/lib/data/incidents";
import { scorecard } from "@/lib/data/scorecard";
import { getOverview as buildOverview } from "@/lib/data/overview";

/** Fleet stays mock; drop assigned-route links to retired mock route IDs. */
const vehicles: Vehicle[] = mockVehicles.map((van) => ({
  ...van,
  assignedRouteId: undefined,
  status: van.status === "on_route" ? "ready" : van.status,
}));

export interface DataSource {
  getStation(): StationSettings;
  getOverview(range: DateRange): OverviewSnapshot;
  getScorecard(): ScorecardSnapshot;
  getRoutes(): Route[];
  getRoute(id: string): Route | undefined;
  getDrivers(): Driver[];
  getDriver(id: string | null | undefined): Driver | undefined;
  getVehicles(): Vehicle[];
  getVehicle(id: string | null | undefined): Vehicle | undefined;
  getIncidents(): Incident[];
  getExceptions(): PackageException[];
  getExceptionsForRoute(routeId: string): PackageException[];
  getDeliveryBoard(): DeliveryExecutionBoard;
}

const driverById = new Map(consoleDrivers.map((d) => [d.id, d]));
const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
const routeById = new Map(routes.map((r) => [r.id, r]));

export const mockDataSource: DataSource = {
  getStation: () => seedStation,
  getOverview: (range) => buildOverview(range),
  getScorecard: () => scorecard,
  getRoutes: () => routes,
  getRoute: (id) => routeById.get(id),
  getDrivers: () => consoleDrivers,
  getDriver: (id) => (id ? driverById.get(id) : undefined),
  getVehicles: () => vehicles,
  getVehicle: (id) => (id ? vehicleById.get(id) : undefined),
  getIncidents: () => incidents,
  getExceptions: () => exceptions,
  getExceptionsForRoute: (routeId) => exceptionsForRoute(routeId),
  getDeliveryBoard: () => deliveryBoard,
};

/** Active source. Replace with an API-backed implementation later. */
export const source: DataSource = mockDataSource;

export const getStation = () => source.getStation();
export const getOverview = (range: DateRange) => source.getOverview(range);
export const getScorecard = () => source.getScorecard();
export const getRoutes = () => source.getRoutes();
export const getRoute = (id: string) => source.getRoute(id);
export const getDrivers = () => source.getDrivers();
export const getDriver = (id: string | null | undefined) => source.getDriver(id);
export const getVehicles = () => source.getVehicles();
export const getVehicle = (id: string | null | undefined) => source.getVehicle(id);
export const getIncidents = () => source.getIncidents();
export const getExceptions = () => source.getExceptions();
export const getExceptionsForRoute = (routeId: string) =>
  source.getExceptionsForRoute(routeId);
export const getDeliveryBoard = () => source.getDeliveryBoard();
