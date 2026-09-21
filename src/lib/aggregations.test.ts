import { describe, expect, it } from "vitest";
import { seedDb } from "../data/seed";
import {
  buildExecutive,
  buildFinancial,
  buildFleet,
  buildForecasting,
  buildInsights,
  buildImports,
  buildLiveOperations,
  buildRouteManagement,
  buildSafety,
  buildScorecard,
  compositeScore,
  filterDatabase,
} from "./aggregations";
import { buildMorningDispatch, launchGateFor } from "./readiness";

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
    expect(scoped.maintenance.every((m) => m.station_id === "stn-dla7")).toBe(true);
    expect(scoped.payroll.every((p) => p.station_id === "stn-dla7")).toBe(true);
  });

  it("builds the Amazon scorecard with FICO weekly trends", () => {
    const view = buildScorecard(seedDb);
    expect(view.kpis.map((k) => k.label)).toEqual(["DCR", "POD", "CDF", "Safety Score", "FICO", "Standing"]);
    expect(view.weeklyTrend.length).toBe(8);
    expect(view.stationRows).toHaveLength(5);
    expect(view.tiles.some((tile) => tile.label === "FICO")).toBe(true);
  });

  it("analyzes route profitability, completion, and variance", () => {
    const view = buildRouteManagement(seedDb);
    expect(view.variance.length).toBe(seedDb.routes.length);
    expect(view.routeProfit.length).toBe(seedDb.routes.length);
    expect(view.rescueRows.length).toBe(3);
    expect(view.underperforming.length).toBeGreaterThan(0);
  });

  it("tracks fleet maintenance, DVIC, and downtime", () => {
    const view = buildFleet(seedDb);
    expect(view.kpis[2].label).toBe("DVIC compliance");
    expect(view.maintenance.length).toBeGreaterThan(0);
    expect(view.downtime.some((row) => !row.ended_at)).toBe(true);
  });

  it("includes driver PTO, discipline, and revenue per driver", () => {
    const drivers = filterDatabase(seedDb, "all");
    expect(drivers.pto.length).toBeGreaterThan(0);
    expect(drivers.discipline.some((row) => row.type === "final")).toBe(true);
    const finance = buildFinancial(seedDb);
    expect(finance.driverRevenue.length).toBe(seedDb.drivers.length);
    expect(finance.fuelExpenses).toBeGreaterThan(0);
    expect(finance.maintenanceExpenses).toBeGreaterThan(0);
  });

  it("generates operational AI insights and import connectors", () => {
    const insights = buildInsights(seedDb);
    expect(insights.insights.length).toBeGreaterThan(3);
    expect(insights.insights.some((row) => row.category === "staffing")).toBe(true);
    expect(insights.insights.some((row) => row.category === "safety")).toBe(true);
    expect(insights.insights.some((row) => row.category === "profitability")).toBe(true);
    const imports = buildImports(seedDb);
    expect(imports.jobs.map((job) => job.source)).toEqual([
      "amazon_scorecard",
      "payroll",
      "fuel_card",
      "fleet_maintenance",
    ]);
  });

  it("builds morning dispatch readiness with staffing, fleet, routes, and weather", () => {
    const view = buildMorningDispatch(seedDb);
    expect(view.kpis.map((kpi) => kpi.label)).toEqual([
      "Staffing Readiness",
      "Fleet Readiness",
      "Route Coverage",
      "Launch Readiness Score",
    ]);
    expect(view.staffing.ptoToday).toBe(1);
    expect(view.staffing.callOuts).toBe(1);
    expect(view.staffing.noShows).toBe(1);
    expect(view.staffing.openRoutes).toBe(2);
    expect(view.staffing.staffingDelta).toBeLessThan(0);
    expect(view.fleet.vansGrounded).toBeGreaterThan(0);
    expect(view.fleet.newDvicDefects).toBeGreaterThan(0);
    expect(view.fleet.newDamageAlerts).toBeGreaterThan(0);
    expect(view.routes.unassigned).toBe(2);
    expect(view.routes.highVolume).toBeGreaterThan(0);
    expect(view.weather.heatWarnings).toBeGreaterThan(0);
    expect(view.weather.stormWarnings).toBeGreaterThan(0);
    expect(view.weather.highRisk).toBeGreaterThan(0);
    expect(view.commandBoard.length).toBe(seedDb.routes.length);
    expect(view.commandBoard.some((row) => row.dispatchStatus === "unassigned")).toBe(true);
    expect(view.recommendations.length).toBeGreaterThan(3);
    expect(view.recommendations.some((row) => row.category === "staffing")).toBe(true);
    expect(view.recommendations.some((row) => row.category === "weather")).toBe(true);
    expect(view.recommendations.some((row) => row.category === "maintenance")).toBe(true);
    expect(launchGateFor(view.launchReadinessScore)).toBe(view.gate);
    expect(view.launchReadinessScore).toBeGreaterThan(50);
    expect(view.launchReadinessScore).toBeLessThan(90);
    expect(seedDb.dispatchEvents.length).toBeGreaterThan(0);
    expect(seedDb.routeAssignments.length).toBe(seedDb.routes.length);
    expect(seedDb.weatherAlerts).toHaveLength(5);
    expect(seedDb.dailyReadinessSnapshots.length).toBeGreaterThan(1);
  });

  it("scopes dispatch, weather, and readiness tables to a station", () => {
    const scoped = filterDatabase(seedDb, "stn-dax5");
    expect(scoped.weatherAlerts.every((row) => row.station_id === "stn-dax5")).toBe(true);
    expect(scoped.dispatchEvents.every((row) => row.station_id === "stn-dax5")).toBe(true);
    expect(scoped.routeAssignments.every((row) => row.station_id === "stn-dax5")).toBe(true);
    const view = buildMorningDispatch(scoped);
    expect(view.weather.alerts.every((row) => row.stationCode === "DAX5")).toBe(true);
    expect(view.commandBoard.every((row) => row.stationCode === "DAX5")).toBe(true);
  });
});
