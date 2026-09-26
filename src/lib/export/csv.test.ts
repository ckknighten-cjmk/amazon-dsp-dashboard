import assert from "node:assert/strict";
import test from "node:test";
import { getComplianceReport } from "../data/compliance";
import { deliveryBoard, routes } from "../data/delivery-execution";
import { associateId } from "../data/delivery-execution";
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
  assert.equal(file.filename, "associates-roster-weeks-38-39.csv");
  assert.match(lines[0], /Transporter ID/);
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
  assert.equal(deliveryBoard.serviceDate, "2026-09-25");
  assert.equal(routes.length, 33);
  assert.equal(deliveryBoard.totals.inProgress, 2);
  assert.equal(deliveryBoard.totals.incomplete, 0);
  assert.equal(routes.filter((route) => route.status === "in_progress").length, 2);
  assert.equal(routes.filter((route) => route.status === "completed").length, 31);
  assert.equal(deliveryBoard.totals.executionGaugesPct.locations, 99);
  assert.equal(deliveryBoard.totals.executionGaugesPct.stops, 99);
  assert.equal(deliveryBoard.totals.executionGaugesPct.packages, 99);
  assert.equal(deliveryBoard.totals.executionGaugesPct.attemptSuccess, 99);
  assert.equal(deliveryBoard.totals.packagesDelivered, 9626);
  assert.equal(deliveryBoard.totals.packagesPlanned, 9635);
  assert.equal(deliveryBoard.totals.packageStatusCounts.remaining, 9);
  assert.equal(deliveryBoard.totals.packageStatusCounts.reattemptable, 4);
  assert.equal(deliveryBoard.totals.packageStatusCounts.undeliverable, 2);
  assert.equal(deliveryBoard.totals.packageStatusCounts.missing, 4);
  assert.equal(deliveryBoard.totals.packageStatusCounts.returnedToStation, 19);
  assert.equal(deliveryBoard.totals.packageStatusCounts.pickupFailed, 212);
  assert.equal(deliveryBoard.totals.workHourRisk, 1);
  assert.equal(deliveryBoard.totals.unknownStops, 25);
  assert.equal(deliveryBoard.totals.onRoadPickups.total, 6);
  assert.equal(deliveryBoard.totals.onRoadPickups.complete, 6);
  assert.equal(rescued.length, 15);
  assert.equal(rescued.length, deliveryBoard.totals.multiTransporter);
  assert.equal(deliveryBoard.totals.rescueActions, 0);
  assert.ok(rescued.every((route) => route.rescueDriverIds.length >= 1));
  assert.ok(rescued.every((route) => route.rescueDriverId === route.rescueDriverIds[0]));
  assert.ok(rescued.every((route) => route.status !== "rescued"));

  const split = routes.find((route) => route.code === "CX252");
  assert.ok(split);
  assert.equal(split.receivedRescue, true);
  assert.equal(split.status, "in_progress");
  assert.deepEqual(split.rescueDriverIds, [associateId("Draem Hines")]);
  assert.equal(split.driverId, associateId("Brandon Clark"));

  const file = routesCsv();
  assert.equal(file.filename, "routes-2026-09-25.csv");
  const lines = csvLines(file.csv);
  const header = lines[0].split(",");
  const rescueCol = header.indexOf("Rescue");
  assert.ok(rescueCol >= 0);
  const yes = lines.slice(1).filter((line) => line.split(",")[rescueCol] === "Yes");
  assert.equal(yes.length, 15);
  assert.match(file.csv, /Multi-associate route; not an Amazon rescueActions flag/);
  assert.match(file.csv, /Completed/);
});

test("other dataset exports stay on seeded values", () => {
  const dvic = dvicCsv();
  assert.equal(dvic.filename, "dvic-2026-09-23.csv");
  assert.equal(csvLines(dvic.csv).length, 1);
  assert.match(dvic.csv, /Pre-trip damage/);
  assert.doesNotMatch(dvic.csv, /dent|scratch|VIN/i);

  const fleet = vehiclesCsv();
  assert.equal(fleet.filename, "fleet-vehicles-dna4.csv");
  assert.equal(csvLines(fleet.csv).length - 1, 56);
  assert.match(fleet.csv, /Amazon DSP Console My vehicles/);
  assert.match(fleet.csv, /3C6MRVJG5ME549360/);
  assert.match(fleet.csv, /CP81075/);
  assert.doesNotMatch(fleet.csv, /EDV-4401|TN 441-CJM|Mock yard roster/);

  const exceptions = exceptionsCsv();
  assert.equal(exceptions.filename, "package-exceptions-2026-09-25.csv");
  assert.equal(csvLines(exceptions.csv).length - 1, 241);

  const scorecard = scorecardCsv();
  assert.equal(scorecard.filename, "scorecard-week-38.csv");
  assert.match(scorecard.csv, /,84,/);
  assert.match(scorecard.csv, /4,166\.9 DPMO/);
  assert.match(scorecard.csv, /99\.46%/);
  assert.match(scorecard.csv, /94\.01%/);
  assert.match(scorecard.csv, /Great/);
  assert.match(scorecard.csv, /Not shown in Console/);
  assert.doesNotMatch(scorecard.csv, /85\.8/);
  const week37 = scorecardCsv(37);
  assert.equal(week37.filename, "scorecard-week-37.csv");
  assert.match(week37.csv, /85\.8/);
  assert.doesNotMatch(scorecard.csv, /prior week was \d/i);

  const payments = paymentsCsv();
  assert.equal(payments.filename, "payments-settlements-2026-09-21.csv");
  assert.match(payments.csv, /\$3,878\.88/);
  assert.match(payments.csv, /\$88,556\.70/);
  assert.match(payments.csv, /Invoices/);

  const week39 = getComplianceReport(39);
  const missing = complianceViewCsv(week39, "missing");
  assert.equal(missing.filename, "compliance-missing-punches-week-39.csv");
  assert.equal(week39.missingPunches.length, 28);
  const sample = week39.missingPunches[0];
  assert.ok(sample);
  assert.match(missing.csv, new RegExp(sample.associate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(missing.csv, new RegExp(sample.hoursLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  const meals = complianceViewCsv(week39, "meals");
  assert.match(meals.csv, /Jazmonjr Worles/);
  assert.match(meals.csv, /Mismatch/);

  const combined = complianceCombinedCsv(week39);
  assert.equal(combined.filename, "compliance-week-39.csv");
  assert.match(combined.csv, /Missing punches/);
  assert.match(combined.csv, /Over 12 hours/);
  assert.match(combined.csv, /Over 60 hours/);
  assert.match(combined.csv, /Meal rows/);
  assert.equal(
    complianceViewCsv(getComplianceReport(38), "missing").filename,
    "compliance-missing-punches-week-38.csv"
  );
});
