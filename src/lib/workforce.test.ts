import { describe, expect, it } from "vitest";
import { seedDb } from "../data/seed";
import { filterDatabase } from "./aggregations";
import {
  buildAttendanceDashboard,
  buildDriverLifecycle,
  buildPtoCalendar,
  buildRecruitingPipeline,
  buildStaffingForecast,
} from "./workforce";

describe("workforce management center", () => {
  it("tracks attendance, call-outs, and no-shows", () => {
    const view = buildAttendanceDashboard(seedDb);
    expect(view.kpis.map((kpi) => kpi.label)).toEqual(["On the board", "Call-outs", "No-shows", "Reliability"]);
    expect(view.today.noShows).toBeGreaterThan(0);
    expect(seedDb.attendance.some((row) => row.status === "no_show")).toBe(true);
    expect(seedDb.attendance.some((row) => row.status === "call_out")).toBe(true);
    expect(view.driverRows.length).toBeGreaterThan(0);
  });

  it("builds a PTO calendar with pending and upcoming requests", () => {
    const view = buildPtoCalendar(seedDb);
    expect(view.cells.length).toBeGreaterThan(28);
    expect(view.requests.length).toBe(seedDb.pto.length);
    expect(view.pending.length).toBeGreaterThan(0);
    expect(view.upcoming.length).toBeGreaterThan(0);
  });

  it("flags open routes and staffing shortages", () => {
    const view = buildStaffingForecast(seedDb);
    expect(view.openRoutes.length).toBeGreaterThan(0);
    expect(view.openRoutes.every((route) => !route.driver_id || route.status === "planned")).toBe(true);
    expect(view.stationRows).toHaveLength(5);
    expect(view.series.length).toBeGreaterThan(5);
    expect(Number(view.kpis[0].value)).toBeGreaterThanOrEqual(0);
  });

  it("exposes recruiting pipeline and interview stages", () => {
    const view = buildRecruitingPipeline(seedDb);
    expect(view.columns.map((column) => column.stage)).toEqual([
      "applied",
      "phone_screen",
      "interview",
      "ride_along",
      "offer",
      "hired",
    ]);
    expect(view.openCount).toBeGreaterThan(0);
    expect(view.interviewRows.length).toBe(seedDb.interviews.length);
    expect(view.interviewRows.some((row) => row.stage === "ops_interview")).toBe(true);
  });

  it("tracks onboarding, offboarding, and training completion", () => {
    const view = buildDriverLifecycle(seedDb);
    expect(view.onboarding.length).toBe(2);
    expect(view.offboarding.length).toBe(1);
    expect(view.terminated.length).toBe(1);
    expect(view.overdue.length).toBeGreaterThan(0);
    expect(view.courses.some((row) => row.course === "DSP New Hire Orientation")).toBe(true);
    expect(view.onboarding.every((row) => row.records.length > 0)).toBe(true);
  });

  it("scopes recruiting and training to a station", () => {
    const scoped = filterDatabase(seedDb, "stn-dla7");
    expect(scoped.recruiting.every((row) => row.station_id === "stn-dla7")).toBe(true);
    expect(scoped.trainingRecords.every((row) => {
      if (row.driver_id) return scoped.drivers.some((driver) => driver.id === row.driver_id);
      return scoped.recruiting.some((candidate) => candidate.id === row.recruiting_id);
    })).toBe(true);
  });
});
