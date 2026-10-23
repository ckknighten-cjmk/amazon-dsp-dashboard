import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { getOverview } from "./overview";
import { deliveryBoard, routes } from "./delivery-execution";
import { DELIVERY_SEED_DATES, deliveryDaysInRange, detailDeliveryDay } from "./delivery-catalog";
import { STATION_TODAY } from "../period";

const ADDED = [
  { date: "2026-09-29", routes: 34, inProgress: 1, delivered: 9519, planned: 9519, exceptions: 81 },
  { date: "2026-09-30", routes: 36, inProgress: 4, delivered: 11154, planned: 11158, exceptions: 167 },
  { date: "2026-10-01", routes: 33, inProgress: 1, delivered: 10171, planned: 10175, exceptions: 139 },
  { date: "2026-10-02", routes: 33, inProgress: 10, delivered: 10225, planned: 10308, exceptions: 215 },
  { date: "2026-10-05", routes: 36, inProgress: 3, delivered: 11292, planned: 11298, exceptions: 80 },
  { date: "2026-10-06", routes: 39, inProgress: 13, delivered: 12483, planned: 12660, exceptions: 181 },
  { date: "2026-10-07", routes: 35, inProgress: 1, delivered: 11268, planned: 11274, exceptions: 101 },
  { date: "2026-10-08", routes: 35, inProgress: 1, delivered: 11599, planned: 11600, exceptions: 145 },
  { date: "2026-10-09", routes: 34, inProgress: 7, delivered: 10926, planned: 11062, exceptions: 157 },
  { date: "2026-10-12", routes: 33, inProgress: 1, delivered: 10119, planned: 10120, exceptions: 168 },
] as const;

describe("delivery seed catalog", () => {
  it("keeps Oct 22 as today and lists every seeded day", () => {
    assert.equal(STATION_TODAY, "2026-10-22");
    assert.equal(deliveryBoard.serviceDate, "2026-10-22");
    assert.equal(deliveryBoard.totals.routes, 37);
    assert.equal(routes.length, 37);
    assert.equal(DELIVERY_SEED_DATES.length, 23);
    assert.deepEqual(DELIVERY_SEED_DATES, [
      "2026-09-21",
      "2026-09-23",
      "2026-09-24",
      "2026-09-25",
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
      "2026-10-22",
    ]);
  });

  it("shows the live board for today and every seeded day in this week", () => {
    const today = getOverview({ kind: "today" });
    assert.equal(today.kpis[0]?.value, 11701);
    assert.deepEqual(
      today.packagesByDay.map((day) => day.label),
      ["Thu 22"]
    );
    assert.equal(detailDeliveryDay({ kind: "today" })?.serviceDate, "2026-10-22");

    const week = getOverview({ kind: "week" });
    assert.equal(week.kpis[0]?.value, 11701);
    assert.deepEqual(
      week.packagesByDay.map((day) => day.label),
      ["Oct 16", "Oct 19", "Oct 20", "Oct 21", "Oct 22"]
    );
    assert.equal(detailDeliveryDay({ kind: "week" })?.serviceDate, "2026-10-22");
    assert.equal(deliveryDaysInRange({ kind: "custom", start: "2026-10-17", end: "2026-10-18" }).length, 0);
  });

  it("opens each backfilled day from a custom period", () => {
    for (const expected of ADDED) {
      const day = detailDeliveryDay({ kind: "custom", start: expected.date, end: expected.date });
      assert.ok(day, expected.date);
      assert.equal(day.serviceDate, expected.date);
      assert.equal(day.board.totals.routes, expected.routes);
      assert.equal(day.board.totals.inProgress, expected.inProgress);
      assert.equal(day.board.totals.packagesDelivered, expected.delivered);
      assert.equal(day.board.totals.packagesPlanned, expected.planned);
      assert.equal(day.exceptions.length, expected.exceptions);
      const csv = readFileSync(`src/lib/data/seed/packages-exceptions-${expected.date}.csv`, "utf8").trim();
      assert.equal(csv.split(/\n/).length - 1, expected.exceptions);
      const overview = getOverview({ kind: "custom", start: expected.date, end: expected.date });
      assert.equal(overview.kpis[0]?.value, expected.delivered);
      assert.deepEqual(
        overview.packagesByDay.map((row) => row.delivered),
        [expected.delivered]
      );
    }

    const span = deliveryDaysInRange({ kind: "custom", start: "2026-09-29", end: "2026-10-12" });
    assert.deepEqual(
      span.map((day) => day.serviceDate),
      ADDED.map((day) => day.date)
    );
    assert.equal(detailDeliveryDay({ kind: "custom", start: "2026-09-29", end: "2026-10-12" })?.serviceDate, "2026-10-12");
  });
});
