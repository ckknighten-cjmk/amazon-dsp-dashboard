import { describe, expect, it } from "vitest";
import { seedDb } from "../data/seed";
import { filterDatabase } from "./aggregations";
import {
  availableTomorrow,
  buildFleetReadiness,
  buildVehicleDetail,
  hasOpenDvic,
  isGrounded,
} from "./fleetReadiness";

describe("fleet readiness", () => {
  it("classifies grounded, DVIC, and tomorrow availability from seed tables", () => {
    const oos = seedDb.vehicles.find((row) => row.id === "van-15");
    const shop = seedDb.vehicles.find((row) => row.id === "van-14");
    const dvic = seedDb.vehicles.find((row) => row.id === "van-09");
    const ready = seedDb.vehicles.find((row) => row.id === "van-01");
    expect(oos && isGrounded(seedDb, oos)).toBe(true);
    expect(shop && isGrounded(seedDb, shop)).toBe(true);
    expect(dvic && hasOpenDvic(seedDb, dvic.id)).toBe(true);
    expect(dvic && availableTomorrow(seedDb, dvic)).toBe(false);
    expect(ready && availableTomorrow(seedDb, ready)).toBe(true);
  });

  it("computes readiness KPIs, dispatch boards, and cost metrics", () => {
    const view = buildFleetReadiness(seedDb);
    expect(view.grounded.length).toBeGreaterThanOrEqual(2);
    expect(view.dvic.length).toBeGreaterThanOrEqual(2);
    expect(view.available.length).toBeGreaterThan(8);
    expect(view.readinessPct).toBe(Number(((view.available.length / seedDb.vehicles.length) * 100).toFixed(10)));
    expect(view.openWorkOrders.length).toBeGreaterThan(0);
    expect(view.newDamage.length).toBeGreaterThan(0);
    expect(view.kpiCards.map((kpi) => kpi.label)).toEqual([
      "Fleet availability",
      "Cost per mile",
      "Cost per vehicle",
      "Downtime hours",
      "Repair costs",
    ]);
    expect(view.repairTotal).toBeGreaterThan(0);
    expect(view.costPerMile).toBeGreaterThan(0);
  });

  it("builds a vehicle detail profile with VIN, history, and costs", () => {
    const detail = buildVehicleDetail(seedDb, "van-15");
    expect(detail?.vehicle.vin).toMatch(/^1FTBW3U60PKA/);
    expect(detail?.damageHistory.length).toBeGreaterThan(0);
    expect(detail?.orders.some((row) => row.wo_number === "WO-4418")).toBe(true);
    expect(detail?.history.some((row) => row.to_status === "oos")).toBe(true);
    expect(detail?.costTotal).toBeGreaterThan(0);
  });

  it("scopes work orders and repair costs with the station filter", () => {
    const scoped = filterDatabase(seedDb, "stn-dla7");
    expect(scoped.workOrders.every((row) => row.station_id === "stn-dla7")).toBe(true);
    expect(scoped.repairCosts.every((row) => scoped.vehicles.some((vehicle) => vehicle.id === row.vehicle_id))).toBe(true);
    expect(scoped.maintenanceEvents.length).toBeGreaterThan(0);
  });
});
