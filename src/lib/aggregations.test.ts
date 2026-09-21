import { describe, expect, it } from "vitest";
import { seedDb } from "../data/seed";
import {
  buildExecutive,
  buildFinancial,
  buildFleet,
  buildForecasting,
  buildLiveOperations,
  buildSafety,
  compositeScore,
  filterDatabase,
} from "./aggregations";

describe("command center aggregations", () => {
  it("computes executive KPIs from seeded financials and scorecards", () => {
    const view = buildExecutive(seedDb);
    expect(view.kpis).toHaveLength(6);
    expect(view.kpis.map((k) => k.label)).toEqual([
      "Revenue (MTD)",
      "Profit (MTD)",
      "DCR",
      "Attendance",
      "Safety Score",
      "Scorecard",
    ]);
    expect(view.scorecardMetrics.map((m) => m.label)).toEqual([
      "DCR",
      "CDF",
      "POD",
      "Contact Compliance",
      "Photo on Delivery",
      "Safety Score",
      "Attendance",
      "Seatbelt",
      "DNR",
      "DSC",
      "CE",
    ]);
    expect(view.stationMix.length).toBe(5);
  });

  it("tracks live routes, rescues, and failed deliveries", () => {
    const view = buildLiveOperations(seedDb);
    expect(view.routeRows.length).toBe(seedDb.routes.length);
    expect(view.rescueRows.length).toBe(3);
    expect(view.failedCount).toBe(10);
    expect(view.active).toBeGreaterThan(0);
  });

  it("ranks drivers with a composite score", () => {
    const top = [...seedDb.drivers].sort((a, b) => compositeScore(b) - compositeScore(a))[0];
    expect(top.full_name).toContain("Nakamura");
  });

  it("keeps MTD profit positive and includes labor/ot/fuel/vehicle", () => {
    const view = buildFinancial(seedDb);
    expect(view.totals.profit).toBeGreaterThan(0);
    expect(view.totals.labor).toBeGreaterThan(view.totals.overtime);
    expect(view.costBreakdown.map((row) => row.name)).toEqual(["Labor", "Overtime", "Fuel", "Vehicle", "Other"]);
    expect(view.routeProfit.length).toBe(seedDb.routes.length);
    expect(view.routeProfit.every((row) => Number.isFinite(row.profit))).toBe(true);
    expect(Math.max(...view.routeProfit.map((row) => row.margin))).toBeLessThan(0.45);
    expect(view.routeProfit.some((row) => row.profit > 0)).toBe(true);
  });

  it("builds a fleet board with utilization and service due flags", () => {
    const view = buildFleet(seedDb);
    expect(view.rows.length).toBe(seedDb.vehicles.length);
    expect(view.rows.some((row) => row.status === "oos")).toBe(true);
    expect(view.kpis[0].label).toBe("Active vans");
  });

  it("reports inspections, speeding, and incidents", () => {
    const view = buildSafety(seedDb);
    expect(view.speeding.length).toBeGreaterThan(0);
    expect(view.inspections.length).toBe(seedDb.vehicles.length);
    expect(view.incidents.length).toBe(5);
  });

  it("forecasts volume, routes, staffing, and overtime", () => {
    const view = buildForecasting(seedDb);
    expect(view.kpis.map((k) => k.label)).toEqual([
      "Volume forecast",
      "Route forecast",
      "Staffing forecast",
      "Overtime forecast",
    ]);
    expect(view.table.length).toBeGreaterThan(7);
  });

  it("scopes a station filter to that station's drivers and P&L", () => {
    const scoped = filterDatabase(seedDb, "stn-dla7");
    expect(scoped.stations).toHaveLength(1);
    expect(scoped.drivers.every((d) => d.station_id === "stn-dla7")).toBe(true);
    expect(scoped.financialDaily.every((f) => f.station_id === "stn-dla7")).toBe(true);
  });
});
