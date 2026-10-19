import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { loadStationDataset } from "@/lib/data/station-seeds";
import { buildFleetIssueDayReport } from "@/lib/fleet-issues/detect";
import { loadFleetIssueCatalog, loadFleetIssueSnapshots } from "./fleet-issues";
import type { FleetIssueSnapshot } from "@/lib/fleet-issues/types";

test("the DNA4 2026-10-18 snapshot is the newest capture and keeps every open issue", () => {
  const catalog = loadFleetIssueCatalog();
  assert.deepEqual(catalog.dates, ["2026-10-14", "2026-10-15", "2026-10-18"]);
  const newest = catalog.newest;
  assert.ok(newest);
  assert.equal(newest.date, "2026-10-18");
  assert.equal(newest.capturedAt, "2026-10-18T23:20:00-05:00");
  assert.equal(newest.captureDay, "2026-10-18");
  assert.equal(newest.totalResultsShown, "Total results: 1320");
  assert.equal(newest.issues.length, 1320);
  assert.equal(new Set(newest.issues.map((issue) => issue.rowId)).size, 1320);

  const today = buildFleetIssueDayReport({
    current: newest.issues,
    previous: null,
    day: "2026-10-18",
  });
  assert.equal(today.comparable, false);
  assert.equal(today.created.damage.length, 25);
  assert.equal(today.created.other["Self reported maintenance"].length, 0);
  assert.equal(today.created.other["Preventative maintenance"].length, 0);
  assert.equal(today.created.other["Vehicle safety signals"].length, 0);
  assert.equal(today.created.other["Odometer defects"].length, 0);

  const october14 = loadFleetIssueSnapshots().find((snapshot) => snapshot.date === "2026-10-14");
  assert.ok(october14);
  assert.equal(october14.date, "2026-10-14");
  assert.equal(october14.capturedAt, "2026-10-15T04:15:40Z");
  assert.equal(october14.issues.length, 1247);

  const report = buildFleetIssueDayReport({
    current: october14.issues,
    previous: null,
    day: "2026-10-14",
  });
  assert.equal(report.comparable, false);
  assert.equal(report.created.damage.length, 2);
  assert.equal(report.created.other["Self reported maintenance"].length, 3);
  assert.equal(report.created.other["Preventative maintenance"].length, 0);
  assert.equal(report.created.other["Vehicle safety signals"].length, 0);
  assert.equal(report.created.other["Odometer defects"].length, 0);

  const [edv, van] = report.created.damage;
  assert.equal(edv.vehicleName, "EDV 20");
  assert.equal(edv.plate, "Y142870");
  assert.equal(edv.vin, "7FCEHEB23SN031818");
  assert.equal(edv.makeModel, "Rivian, EDV 700");
  assert.equal(edv.createdAt, "2026-10-14T19:01:00-05:00");
  assert.equal(edv.severity, "High");
  assert.equal(edv.repairStatus, "Needs repair");
  assert.equal(edv.operationalStatus, "Grounded");
  assert.equal(edv.ownershipStatus, "Active");
  assert.equal(edv.component, "Lights and light covers");
  assert.equal(edv.side, "Back Side");
  assert.equal(edv.detail?.sourceInspection, "AVI");
  assert.equal(edv.detail?.inspector, "AVI SCANNER");
  assert.equal(edv.detail?.foundAt, "2026-10-14T18:58:00-05:00");
  assert.equal(edv.detail?.preTripPassed, true);
  assert.equal(edv.detail?.postTripPassed, true);
  assert.equal(edv.detail?.damageFoundAfterDriverChecksPassed, true);
  assert.match(edv.detail?.otherInspectionsToday ?? "", /darome josiah boyland Passed/);

  assert.equal(van.vehicleName, "Van 24");
  assert.equal(van.plate, "15DLEA");
  assert.equal(van.vin, "1FTBR1C88PKB49079");
  assert.equal(van.makeModel, "Ford, Transit");
  assert.equal(van.createdAt, "2026-10-14T18:44:00-05:00");
  assert.equal(van.severity, "High");
  assert.equal(van.repairStatus, "Needs repair");
  assert.equal(van.operationalStatus, "Grounded");
  assert.equal(van.detail?.sourceInspection, "AVI");
  assert.equal(van.detail?.inspector, "AVI SCANNER");
  assert.equal(van.detail?.foundAt, "2026-10-14T18:42:00-05:00");
  assert.equal(van.detail?.preTripPassed, true);
  assert.equal(van.detail?.postTripPassed, null);
  assert.equal(van.detail?.damageFoundAfterDriverChecksPassed, false);
  assert.match(van.detail?.otherInspectionsToday ?? "", /Dorian cLYDE Tyler Passed/);

  const unnamed = newest.issues.find((row) => row.vin === "3C6LRVDG5PE511591");
  assert.ok(unnamed);
  assert.equal(unnamed.vehicleName, "");
  assert.equal(unnamed.plate, "BMN4364");
  assert.equal(unnamed.makeModel, "Ram, ProMaster");

  const winter = newest.issues.find((row) => row.createdAt.endsWith("-06:00"));
  assert.ok(winter);
});

test("WTN2 has no fleet issues snapshot and DNA4 keeps the Oct 14, Oct 15, and Oct 18 catalogs", () => {
  assert.equal(loadStationDataset("WTN2", "fleet", () => loadFleetIssueCatalog()), null);
  const catalog = loadStationDataset("DNA4", "fleet", () => loadFleetIssueCatalog());
  assert.ok(catalog?.newest);
  assert.equal(catalog.newest.date, "2026-10-18");
  assert.equal(catalog.newest.issues.length, 1320);
  assert.equal(catalog.previous?.date, "2026-10-15");
  assert.deepEqual(catalog.dates, ["2026-10-14", "2026-10-15", "2026-10-18"]);
});

test("a newer dated file becomes the snapshot and the older file is the comparison", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "fleet-issues-"));
  writeFileSync(path.join(dir, "issues-2026-10-13.json"), JSON.stringify(mini("2026-10-13")));
  writeFileSync(path.join(dir, "issues-2026-10-14.json"), JSON.stringify(mini("2026-10-14")));
  const catalog = loadFleetIssueCatalog(dir);
  assert.deepEqual(catalog.dates, ["2026-10-13", "2026-10-14"]);
  assert.equal(catalog.newest?.date, "2026-10-14");
  assert.equal(catalog.previous?.date, "2026-10-13");
});

function mini(date: string): FleetIssueSnapshot {
  return {
    date,
    capturedAt: `${date}T22:00:00-05:00`,
    captureDay: date,
    station: "DNA4",
    source: "fixture",
    totalResultsShown: "Total results: 0",
    issues: [],
  };
}
