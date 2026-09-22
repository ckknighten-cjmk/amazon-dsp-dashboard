import { describe, expect, it } from "vitest";
import { driverRows, routeRows, weeklyHistory, weeklyScorecard } from "./data";
import {
  analyzeDrivers,
  analyzeRoutes,
  atRiskDrivers,
  forecastMetrics,
  generateRecommendations,
  highRiskRoutes,
  topPerformers,
  warningIndicators,
} from "./engine";
import { evaluateStanding, standingFromComposite } from "./metrics";

describe("scorecard intelligence engine", () => {
  it("keeps an all-Fair composite in Fair standing", () => {
    expect(standingFromComposite(55)).toBe("fair");
    expect(standingFromComposite(49)).toBe("poor");
    expect(standingFromComposite(75)).toBe("great");
    expect(standingFromComposite(90)).toBe("fantastic");
  });

  it("classifies DNR as lower-is-better", () => {
    expect(evaluateStanding("dnr", 0.1)).toBe("fantastic");
    expect(evaluateStanding("dnr", 0.5)).toBe("poor");
    expect(evaluateStanding("dcr", 99.6)).toBe("fantastic");
  });

  it("ranks top performers and at-risk drivers from volume-weighted metrics", () => {
    const drivers = analyzeDrivers(driverRows, weeklyScorecard.metrics);
    const leaders = topPerformers(drivers);
    const risks = atRiskDrivers(drivers);

    expect(leaders[0]?.driverName).toBe("J. Nakamura");
    expect(leaders.every((driver) => !driver.atRisk)).toBe(true);
    expect(risks.map((driver) => driver.driverName)).toContain("S. Petrova");
    expect(risks.some((driver) => driver.riskReasons.length > 0)).toBe(true);
  });

  it("flags high-risk routes including CX-31", () => {
    const routes = analyzeRoutes(routeRows, weeklyScorecard.metrics);
    const risks = highRiskRoutes(routes);
    expect(risks.map((route) => route.routeCode)).toContain("CX-31");
  });

  it("emits DCR, POD, CDF, and Safety recommendations", () => {
    const drivers = analyzeDrivers(driverRows, weeklyScorecard.metrics);
    const routes = analyzeRoutes(routeRows, weeklyScorecard.metrics);
    const recs = generateRecommendations(weeklyScorecard.metrics, drivers, routes);
    expect(recs.map((rec) => rec.focus).sort()).toEqual(["cdf", "dcr", "pod", "safety"]);
    expect(recs.every((rec) => rec.actions.length >= 2)).toBe(true);
  });

  it("forecasts four weeks and raises POD/DNR warnings", () => {
    const forecasts = forecastMetrics(weeklyHistory, 4);
    expect(forecasts).toHaveLength(8);
    expect(forecasts[0]?.forecast).toHaveLength(4);
    const warnings = warningIndicators(forecasts);
    expect(warnings.some((warning) => warning.metric === "pod")).toBe(true);
    expect(warnings.some((warning) => warning.metric === "dnr")).toBe(true);
  });
});
