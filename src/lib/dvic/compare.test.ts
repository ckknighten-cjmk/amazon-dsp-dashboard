import assert from "node:assert/strict";
import test from "node:test";
import { dvicReportFromSeed, getDvicReport } from "../data/dvic";
import sep23 from "../data/seed/dvic-2026-09-23.json";
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

test("the Oct 18 capture totals come from the listed inspections in that file", () => {
  const report = getDvicReport();
  assert.equal(report.serviceDate, "2026-10-18");
  assert.deepEqual(report.totals, { preTrip: 36, postTrip: 35, aviPostTrip: 14 });
  assert.equal(report.inspections.length, 85);
  assert.equal(report.pairs.length, 36);
  assert.deepEqual(report.newDamage, []);
  assert.match(report.nav, /Today's vehicle inspections/);
  assert.match(report.disclaimer, /DVIC missing 2/);
  assert.match(report.disclaimer, /DVIC-Pre Trip 39/);
  assert.match(report.disclaimer, /AVI-Post Trip 15/);
  assert.match(report.source, /Today's vehicle inspections/);
});

test("the Sep 23 capture stays at zero when it has no dashboard counts", () => {
  const report = dvicReportFromSeed(sep23);
  assert.equal(report.serviceDate, "2026-09-23");
  assert.equal(sep23.preTrip.length, 0);
  assert.equal(sep23.postTrip.length, 0);
  assert.equal(sep23.aviPostTrip.length, 0);
  assert.equal("counts" in sep23, false);
  assert.deepEqual(report.totals, { preTrip: 0, postTrip: 0, aviPostTrip: 0 });
  assert.equal(report.inspections.length, 0);
  assert.deepEqual(report.pairs, []);
});

test("listed inspection rows win over dashboard counts", () => {
  const report = dvicReportFromSeed({
    source: "fixture",
    station: "DNA4 / Memphis (DNA4)- Amazon.com",
    date: "2026-10-14",
    preTrip: [{ id: "pre-1", vehicleUnit: "11", damage: [] }],
    postTrip: [],
    aviPostTrip: [],
    counts: { dvicPreTrip: 44, dvicPostTrip: 44, aviPostTrip: 10 },
  });
  assert.deepEqual(report.totals, { preTrip: 1, postTrip: 44, aviPostTrip: 10 });
  assert.equal(report.inspections.length, 1);
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
