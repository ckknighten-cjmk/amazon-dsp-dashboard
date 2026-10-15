import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFleetIssueDayReport,
  issuesAbsentFromPrevious,
  issuesCreatedOnDay,
  partitionIssues,
  selectCatalog,
  vehicleHasNewDamage,
} from "./detect";
import type { FleetIssue, FleetIssueSnapshot } from "./types";

function issue(overrides: Partial<FleetIssue> & Pick<FleetIssue, "rowId" | "issueType" | "createdAt">): FleetIssue {
  return {
    vehicleName: "EDV 20",
    plate: "Y142870",
    makeModel: "Rivian, EDV 700",
    vin: "7FCEHEB23SN031818",
    component: "Lights and light covers",
    side: "Back Side",
    description: "Any lights or light covers are cracked (leaving hole or void), missing, or not working properly",
    severity: "High",
    repairStatus: "Needs repair",
    repairNote: null,
    operationalStatus: "Grounded",
    ownershipStatus: "Active",
    ...overrides,
  };
}

const DAY = "2026-10-14";
const inspection = issue({ rowId: 1, issueType: "Inspection defects", createdAt: "2026-10-14T19:01:00-05:00" });
const sameNextDay = issue({
  rowId: 2,
  issueType: "Inspection defects",
  createdAt: "2026-10-14T18:44:00-05:00",
  vehicleName: "Van 24",
  plate: "15DLEA",
  vin: "1FTBR1C88PKB49079",
  makeModel: "Ford, Transit",
});
const maintenance = issue({
  rowId: 3,
  issueType: "Self reported maintenance",
  createdAt: "2026-10-14T08:11:00-05:00",
  vehicleName: "EDV 14",
  plate: "Y142855",
  vin: "7FCEHEB29SN031824",
  component: "Light repair",
  side: null,
  description: "Keys",
  severity: "Low",
  repairStatus: "Under repair",
});
const safety = issue({
  rowId: 8,
  issueType: "Vehicle safety signals",
  createdAt: "2026-10-12T09:00:00-05:00",
  component: "Safety signals",
  side: null,
  description: "Engine warning light",
  severity: "High",
});
const olderInspection = issue({
  rowId: 9,
  issueType: "Inspection defects",
  createdAt: "2026-10-12T15:00:00-05:00",
  description: "Older scratch",
});

test("new-by-date keeps defects created on the selected Chicago day", () => {
  const created = issuesCreatedOnDay([inspection, sameNextDay, maintenance, safety, olderInspection], DAY);
  assert.deepEqual(
    created.map((row) => row.rowId),
    [1, 2, 3]
  );
  const buckets = partitionIssues(created);
  assert.deepEqual(
    buckets.damage.map((row) => row.plate),
    ["Y142870", "15DLEA"]
  );
  assert.equal(buckets.other["Self reported maintenance"].length, 1);
  assert.equal(buckets.other["Preventative maintenance"].length, 0);
  assert.equal(buckets.other["Vehicle safety signals"].length, 0);
  assert.equal(buckets.other["Odometer defects"].length, 0);
});

test("damage-vs-maintenance separation never counts other issue types as damage", () => {
  const buckets = partitionIssues([
    inspection,
    maintenance,
    safety,
    issue({
      rowId: 4,
      issueType: "Preventative maintenance",
      createdAt: "2026-10-14T11:00:00-05:00",
      component: "Preventative maintenance",
      side: null,
      description: "Oil change",
    }),
    issue({
      rowId: 5,
      issueType: "Odometer defects",
      createdAt: "2026-10-14T12:00:00-05:00",
      component: "Odometer",
      side: null,
      description: "Reading mismatch",
      severity: "Overdue",
    }),
    issue({
      rowId: 6,
      issueType: "Something else",
      createdAt: "2026-10-14T13:00:00-05:00",
    }),
  ]);
  assert.equal(buckets.damage.length, 1);
  assert.equal(buckets.damage[0].issueType, "Inspection defects");
  assert.equal(buckets.other["Self reported maintenance"].length, 1);
  assert.equal(buckets.other["Preventative maintenance"].length, 1);
  assert.equal(buckets.other["Vehicle safety signals"].length, 1);
  assert.equal(buckets.other["Odometer defects"].length, 1);
  assert.equal(buckets.unclassified.length, 1);
  assert.equal(buckets.unclassified[0].issueType, "Something else");
});

test("new-by-diff matches vin, component, side, description, and createdAt", () => {
  const previous = [inspection, maintenance];
  const changed = { ...inspection, description: "A different defect" };
  const added = issuesAbsentFromPrevious([inspection, changed, sameNextDay, maintenance], previous);
  assert.equal(added.comparable, true);
  assert.deepEqual(
    added.issues.map((row) => row.rowId),
    [1, 2]
  );
  const damage = partitionIssues(added.issues).damage;
  assert.deepEqual(
    damage.map((row) => row.vin),
    [changed.vin, sameNextDay.vin]
  );
  assert.equal(partitionIssues(added.issues).other["Self reported maintenance"].length, 0);

  const alone = issuesAbsentFromPrevious([inspection], null);
  assert.equal(alone.comparable, false);
  assert.deepEqual(alone.issues, []);
});

test("a single snapshot reports the selected day and says comparison is unavailable", () => {
  const report = buildFleetIssueDayReport({
    current: [inspection, sameNextDay, maintenance, olderInspection],
    previous: null,
    day: DAY,
  });
  assert.equal(report.comparable, false);
  assert.equal(report.created.damage.length, 2);
  assert.equal(report.created.other["Self reported maintenance"].length, 1);
  assert.deepEqual(report.diffDamage, []);
  assert.equal(vehicleHasNewDamage({ vin: inspection.vin, plate: "OTHER" }, report.created.damage), true);
  assert.equal(vehicleHasNewDamage({ vin: maintenance.vin, plate: maintenance.plate }, report.created.damage), false);
  assert.equal(vehicleHasNewDamage({ vin: null, plate: sameNextDay.plate }, report.created.damage), true);
});

test("the newest dated snapshot is selected and the one before it is the comparison", () => {
  const older = snapshot("2026-10-13", [olderInspection]);
  const newer = snapshot("2026-10-14", [inspection]);
  const catalog = selectCatalog([newer, older]);
  assert.deepEqual(catalog.dates, ["2026-10-13", "2026-10-14"]);
  assert.equal(catalog.newest?.date, "2026-10-14");
  assert.equal(catalog.previous?.date, "2026-10-13");
  const report = buildFleetIssueDayReport({
    current: catalog.newest?.issues ?? [],
    previous: catalog.previous?.issues ?? null,
    previousDate: catalog.previous?.date,
    day: DAY,
  });
  assert.equal(report.comparable, true);
  assert.equal(report.diffDamage.length, 1);
  assert.equal(report.diffDamage[0].rowId, 1);
});

function snapshot(date: string, issues: FleetIssue[]): FleetIssueSnapshot {
  return {
    date,
    capturedAt: `${date}T23:00:00-05:00`,
    captureDay: date,
    station: "DNA4",
    source: "fixture",
    totalResultsShown: `Total results: ${issues.length}`,
    issues,
  };
}
