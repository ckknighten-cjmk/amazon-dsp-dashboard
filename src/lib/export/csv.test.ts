import assert from "node:assert/strict";
import test from "node:test";
import { getComplianceReport } from "../data/compliance";
import { deliveryBoard, exceptions, routes } from "../data/delivery-execution";
import { associateId } from "../data/delivery-execution";
import seed from "../data/seed/delivery-execution-2026-10-15.json";
import { getDrivers } from "../data";
import { complianceCombinedCsv, complianceViewCsv } from "./compliance-csv";
import { csvCell, csvLines, toCsv } from "./csv";
import { associatesCsv, dvicCsv, exceptionsCsv, paymentsCsv, routesCsv, scorecardCsv, vehiclesCsv } from "./datasets";

test("csv cells quote commas, quotes, and newlines", () => {
  assert.equal(csvCell("plain"), "plain");
  assert.equal(csvCell(null), "");
  assert.equal(csvCell('say "hi", now'), '"say ""hi"", now"');
  assert.equal(toCsv(["Name", "Note"], [["A, B", "line\n2"]]), 'Name,Note\r\n"A, B","line\n2"\r\n');
});

test("associates export is the full roster", () => {
  const file = associatesCsv();
  const lines = csvLines(file.csv);
  assert.equal(file.filename, "associates-roster-dna4-weeks-38-39.csv");
  assert.match(lines[0], /^Station,/);
  assert.match(lines[0], /Transporter ID/);
  assert.match(lines[1], /^DNA4,/);
  assert.equal(lines.length - 1, getDrivers().length);
  assert.ok(lines.length - 1 > 40);
  assert.match(file.csv, /Aaron Calvin Davis/);
  assert.match(file.csv, /ADP only/);
  assert.match(file.csv, /aaronmacalot@gmail.com/);
  assert.match(file.csv, /AARON C DAVIS/);
  assert.doesNotMatch(file.csv, /1-901-2385020/);
});

test("routes export marks multi-associate routes as rescued without replacing Console status", () => {
  const rescued = routes.filter((route) => route.receivedRescue);
  assert.equal(deliveryBoard.serviceDate, "2026-10-15");
  assert.equal(routes.length, 34);
  assert.equal(deliveryBoard.totals.inProgress, 4);
  assert.equal(deliveryBoard.totals.incomplete, 0);
  assert.equal(routes.filter((route) => route.status === "in_progress").length, 4);
  assert.equal(routes.filter((route) => route.status === "completed").length, 30);
  assert.equal(deliveryBoard.totals.executionGaugesPct.locations, 99);
  assert.equal(deliveryBoard.totals.executionGaugesPct.stops, 99);
  assert.equal(deliveryBoard.totals.executionGaugesPct.packages, 99);
  assert.equal(deliveryBoard.totals.executionGaugesPct.attemptSuccess, 99);
  assert.equal(deliveryBoard.totals.packagesDelivered, 9834);
  assert.equal(deliveryBoard.totals.packagesPlanned, 9851);
  assert.equal(deliveryBoard.totals.packageStatusCounts.remaining, 18);
  assert.equal(deliveryBoard.totals.packageStatusCounts.reattemptable, 4);
  assert.equal(deliveryBoard.totals.packageStatusCounts.undeliverable, 3);
  assert.equal(deliveryBoard.totals.packageStatusCounts.missing, 6);
  assert.equal(deliveryBoard.totals.packageStatusCounts.returnedToStation, 78);
  assert.equal(deliveryBoard.totals.packageStatusCounts.pickupFailed, 75);
  assert.equal(deliveryBoard.totals.workHourRisk, 0);
  assert.equal(deliveryBoard.totals.noBreaksTaken, 0);
  assert.equal(deliveryBoard.totals.inactive, 0);
  assert.equal(deliveryBoard.totals.unknownStops, 21);
  assert.equal(deliveryBoard.totals.onRoadPickups.total, 7);
  assert.equal(deliveryBoard.totals.onRoadPickups.remaining, 0);
  assert.equal(deliveryBoard.totals.onRoadPickups.complete, 7);
  assert.equal(seed.totals.ahead, 3);
  assert.equal(seed.totals.atRisk, 1);
  assert.equal(seed.totals.behind, 0);
  assert.equal(seed.totals.multiTransporter, 13);
  assert.match(deliveryBoard.disclaimer, /in_progress per board/);
  assert.match(deliveryBoard.disclaimer, /4 routes listed first/);
  assert.deepEqual(
    routes.filter((route) => route.status === "in_progress").map((route) => route.code),
    ["AX88", "CX266", "CX261", "CX262"]
  );
  assert.equal(rescued.length, 13);
  assert.equal(rescued.length, deliveryBoard.totals.multiTransporter);
  assert.equal(deliveryBoard.totals.rescueActions, 0);
  assert.ok(rescued.every((route) => route.rescueDriverIds.length >= 1));
  assert.ok(rescued.every((route) => route.rescueDriverId === route.rescueDriverIds[0]));
  assert.ok(rescued.every((route) => route.status !== "rescued"));

  const behind = routes.find((route) => route.code === "AX88");
  assert.ok(behind);
  assert.equal(behind.receivedRescue, false);
  assert.equal(behind.status, "in_progress");
  assert.equal(behind.driverId, associateId("Demarcus Faulkner"));
  assert.equal(behind.completedStops, 39);
  assert.equal(behind.stopCount, 47);
  assert.equal(behind.notes, null);

  const live = routes.find((route) => route.code === "CX266");
  assert.ok(live);
  assert.equal(live.receivedRescue, true);
  assert.equal(live.status, "in_progress");
  assert.equal(live.driverId, associateId("Fredrick Rayford"));
  assert.deepEqual(live.rescueDriverIds, [associateId("Caleb Spann")]);
  assert.equal(live.completedStops, 123);
  assert.equal(live.stopCount, 125);
  assert.equal(live.notes, null);

  const file = routesCsv();
  assert.equal(file.filename, "routes-dna4-2026-10-15.csv");
  const lines = csvLines(file.csv);
  assert.match(lines[0], /^Station,/);
  const header = lines[0].split(",");
  const rescueCol = header.indexOf("Rescue");
  assert.ok(rescueCol >= 0);
  const yes = lines.slice(1).filter((line) => line.split(",")[rescueCol] === "Yes");
  assert.equal(yes.length, 13);
  assert.match(file.csv, /Multi-associate route; not an Amazon rescueActions flag/);
  assert.match(file.csv, /Completed/);
});

test("other dataset exports stay on seeded values", () => {
  const dvic = dvicCsv();
  assert.equal(dvic.filename, "dvic-dna4-2026-10-15.csv");
  assert.match(dvic.csv, /^Station,/);
  assert.equal(csvLines(dvic.csv).length, 1);
  assert.match(dvic.csv, /Pre-trip damage/);
  assert.doesNotMatch(dvic.csv, /dent|scratch|VIN/i);

  const fleet = vehiclesCsv();
  assert.equal(fleet.filename, "fleet-vehicles-dna4-console.csv");
  assert.match(fleet.csv, /^Station,Unit/);
  assert.equal(csvLines(fleet.csv).length - 1, 53);
  assert.match(fleet.csv, /Amazon DSP Console My vehicles/);
  assert.match(fleet.csv, /3C6MRVJG5ME549360/);
  assert.match(fleet.csv, /CP81075/);
  assert.doesNotMatch(fleet.csv, /EDV-4401|TN 441-CJM|Mock yard roster/);

  const exceptionFile = exceptionsCsv();
  assert.equal(exceptionFile.filename, "package-exceptions-dna4-2026-10-15.csv");
  assert.equal(csvLines(exceptionFile.csv).length - 1, 144);
  assert.equal(exceptions.length, 144);
  assert.equal(exceptions.filter((row) => row.status === "Reattemptable").length, 4);
  assert.equal(exceptions.filter((row) => row.status === "Undeliverable").length, 3);
  assert.equal(exceptions.filter((row) => row.status === "Missing").length, 6);
  assert.equal(exceptions.filter((row) => row.status === "Returned to station").length, 76);
  assert.equal(exceptions.filter((row) => row.status === "Pickup failed").length, 55);

  const scorecard = scorecardCsv(38);
  assert.equal(scorecard.filename, "scorecard-dna4-week-38.csv");
  assert.match(scorecard.csv, /,84,/);
  assert.match(scorecard.csv, /4,166\.9 DPMO/);
  assert.match(scorecard.csv, /99\.46%/);
  assert.match(scorecard.csv, /94\.01%/);
  assert.match(scorecard.csv, /Great/);
  assert.match(scorecard.csv, /Not shown in Console/);
  assert.doesNotMatch(scorecard.csv, /85\.8/);
  const week37 = scorecardCsv(37);
  assert.equal(week37.filename, "scorecard-dna4-week-37.csv");
  assert.match(week37.csv, /85\.8/);
  assert.doesNotMatch(scorecard.csv, /prior week was \d/i);
  const scorecardWeek41 = scorecardCsv();
  assert.equal(scorecardWeek41.filename, "scorecard-dna4-week-41.csv");
  assert.match(scorecardWeek41.csv, /82\.7/);
  assert.match(scorecardWeek41.csv, /No data/);

  const payments = paymentsCsv();
  assert.equal(payments.filename, "payments-settlements-dna4-2026-09-21.csv");
  assert.match(payments.csv, /\$3,878\.88/);
  assert.match(payments.csv, /\$88,556\.70/);
  assert.match(payments.csv, /Invoices/);

  const week39 = getComplianceReport(39);
  const missing = complianceViewCsv(week39, "missing");
  assert.equal(missing.filename, "compliance-missing-punches-dna4-week-39.csv");
  assert.equal(week39.missingPunches.length, 16);
  const sample = week39.missingPunches[0];
  assert.ok(sample);
  assert.match(missing.csv, new RegExp(sample.associate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(missing.csv, new RegExp(sample.hoursLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  const meals = complianceViewCsv(week39, "meals");
  assert.match(meals.csv, /Jazmonjr Worles/);
  assert.match(meals.csv, /Mismatch/);

  const combined = complianceCombinedCsv(week39);
  assert.equal(combined.filename, "compliance-dna4-week-39.csv");
  assert.match(combined.csv, /Missing punches/);
  assert.match(combined.csv, /Over 12 hours/);
  assert.match(combined.csv, /Over 60 hours/);
  assert.match(combined.csv, /Meal rows/);
  assert.equal(
    complianceViewCsv(getComplianceReport(38), "missing").filename,
    "compliance-missing-punches-dna4-week-38.csv"
  );
  const week41 = getComplianceReport(41);
  assert.equal(complianceViewCsv(week41, "missing").filename, "compliance-missing-punches-dna4-week-41.csv");
  assert.equal(complianceCombinedCsv(week41).filename, "compliance-dna4-week-41.csv");
  assert.match(complianceCombinedCsv(week41).csv, /Meal rows/);
});
