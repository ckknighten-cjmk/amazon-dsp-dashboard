/**
 * Data access layer for the DSP ops dashboard.
 *
 * Routes and package exceptions for 2026-09-21 come from the DSP Console
 * end-of-day Delivery Execution scrape in `src/lib/data/seed`. The associate
 * roster unions Amazon schedule Weeks 38 and 39, then merges that board and
 * ADP-only names. Scorecard is Week 37 Console Performance Summary. Payments
 * are the 2026-09-21 Flex Payments scrape. Compliance compares ADP Group
 * Timecards to the Amazon schedule workbooks for Week 38 and Week 39. Fleet
 * and incidents remain mock fixtures.
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
  PaymentsSnapshot,
} from "@/lib/types";
import type { ComplianceReport } from "@/lib/compliance/types";
import { station as seedStation } from "@/lib/data/drivers";
import { vehicles as mockVehicles } from "@/lib/data/vehicles";
import {
  deliveryBoard,
  exceptions,
  exceptionsForRoute,
  routes,
} from "@/lib/data/delivery-execution";
import { rosterDrivers } from "@/lib/data/roster";
import { incidents } from "@/lib/data/incidents";
import { scorecard } from "@/lib/data/scorecard";
import { getOverview as buildOverview } from "@/lib/data/overview";
import { getPaymentsSnapshot } from "@/lib/data/payments";
import { getComplianceReport, type ComplianceWeek } from "@/lib/data/compliance";
import { getDvicReport } from "@/lib/data/dvic";

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
  getPayments(): PaymentsSnapshot;
  getCompliance(week?: ComplianceWeek): ComplianceReport;
}

const driverById = new Map<string, Driver>();
for (const driver of rosterDrivers) {
  driverById.set(driver.id, driver);
  for (const alias of driver.aliasIds ?? []) driverById.set(alias, driver);
}
const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
const routeById = new Map(routes.map((r) => [r.id, r]));

export const mockDataSource: DataSource = {
  getStation: () => seedStation,
  getOverview: (range) => buildOverview(range),
  getScorecard: () => scorecard,
  getRoutes: () => routes,
  getRoute: (id) => routeById.get(id),
  getDrivers: () => rosterDrivers,
  getDriver: (id) => (id ? driverById.get(id) : undefined),
  getVehicles: () => vehicles,
  getVehicle: (id) => (id ? vehicleById.get(id) : undefined),
  getIncidents: () => incidents,
  getExceptions: () => exceptions,
  getExceptionsForRoute: (routeId) => exceptionsForRoute(routeId),
  getDeliveryBoard: () => deliveryBoard,
  getPayments: () => getPaymentsSnapshot(),
  getCompliance: (week) => getComplianceReport(week),
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
export const getPayments = () => source.getPayments();
export const getCompliance = (week?: ComplianceWeek) => source.getCompliance(week);
export { getDvicReport };
export { parseComplianceWeek, COMPLIANCE_WEEKS } from "@/lib/data/compliance";
export type { ComplianceWeek } from "@/lib/data/compliance";
