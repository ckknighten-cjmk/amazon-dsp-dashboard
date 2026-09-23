import assert from "node:assert/strict";
import test from "node:test";
import { getDvicReport } from "../data/dvic";
import { damageSummary, findNewDamage, pairInspections } from "./compare";
import type { DvicInspection } from "./types";

const day = "2026-09-23";

function inspection(
  partial: Pick<DvicInspection, "id" | "phase" | "damage"> & { vehicleUnit?: string }
): DvicInspection {
  return {
    vehicleUnit: partial.vehicleUnit ?? "UNIT-1",
    serviceDate: day,
    ...partial,
  };
}

test("the Sep 23 capture has no inspections and no invented damage", () => {
  const report = getDvicReport();
  assert.deepEqual(report.totals, { preTrip: 0, postTrip: 0, aviPostTrip: 0 });
  assert.equal(report.inspections.length, 0);
  assert.deepEqual(report.pairs, []);
  assert.deepEqual(report.newDamage, []);
  assert.match(report.nav, /Today's vehicle inspections/);
  assert.match(report.disclaimer, /0 DVIC-Pre Trip/);
  assert.match(report.source, /Today's vehicle inspections/);
});

test("new damage is post-trip detail missing from the pre-trip", () => {
  const alerts = findNewDamage([
    inspection({
      id: "pre",
      phase: "pre_trip",
      damage: [{ area: " Rear door ", detail: "Scratch" }],
    }),
    inspection({
      id: "post",
      phase: "post_trip",
      damage: [
        { area: "rear door", detail: "scratch" },
        { area: "Front bumper", detail: "New dent" },
      ],
    }),
  ]);
  assert.deepEqual(
    alerts.map((alert) => `${alert.area}: ${alert.detail}`),
    ["Front bumper: New dent"]
  );
  assert.match(alerts[0].reason, /Not on the pre-trip/);
});

test("a vehicle day pairs pre-trip damage with post-trip damage", () => {
  const pairs = pairInspections([
    inspection({
      id: "pre",
      phase: "pre_trip",
      damage: [{ area: "Rear door", detail: "Scratch" }],
    }),
    inspection({
      id: "post",
      phase: "post_trip",
      damage: [
        { area: "Rear door", detail: "Scratch" },
        { area: "Front bumper", detail: "New dent" },
      ],
    }),
    inspection({
      id: "other",
      vehicleUnit: "UNIT-2",
      phase: "pre_trip",
      damage: [],
    }),
  ]);
  assert.deepEqual(
    pairs.map((pair) => pair.vehicleUnit),
    ["UNIT-1", "UNIT-2"]
  );
  const first = pairs[0];
  assert.equal(damageSummary(first.preTrip), "Rear door: Scratch");
  assert.equal(damageSummary(first.postTrip), "Rear door: Scratch; Front bumper: New dent");
  assert.deepEqual(
    first.newDamage.map((alert) => alert.detail),
    ["New dent"]
  );
  assert.equal(pairs[1].hadPostTrip, false);
  assert.equal(pairs[1].newDamage.length, 0);
});

test("post-trip damage with no pre-trip is flagged and empty damage is not", () => {
  const alerts = findNewDamage([
    inspection({
      id: "post-only",
      phase: "post_trip",
      damage: [{ area: "Tire", detail: "Flat" }],
    }),
    inspection({
      id: "clean",
      vehicleUnit: "UNIT-2",
      phase: "post_trip",
      damage: [],
    }),
  ]);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].vehicleUnit, "UNIT-1");
  assert.match(alerts[0].reason, /No pre-trip/);
});
