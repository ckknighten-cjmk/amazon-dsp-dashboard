import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getComplianceReport } from "../data/compliance";
import { deliveryBoard, exceptions, routes } from "../data/delivery-execution";
import { associateId } from "../data/delivery-execution";
import october14 from "../data/seed/delivery-execution-2026-10-14.json";
import seed from "../data/seed/delivery-execution-2026-10-28.json";
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
  assert.equal(deliveryBoard.serviceDate, "2026-10-28");
  assert.equal(routes.length, 44);
  assert.equal(deliveryBoard.totals.inProgress, 2);
  assert.equal(deliveryBoard.totals.incomplete, 0);
  assert.equal(routes.filter((route) => route.status === "in_progress").length, 2);
  assert.equal(routes.filter((route) => route.status === "completed").length, 42);
  assert.equal(deliveryBoard.totals.executionGaugesPct.locations, 99);
  assert.equal(deliveryBoard.totals.executionGaugesPct.stops, 99);
  assert.equal(deliveryBoard.totals.executionGaugesPct.packages, 99);
  assert.equal(deliveryBoard.totals.executionGaugesPct.attemptSuccess, 100);
  assert.equal(deliveryBoard.totals.packagesDelivered, 13726);
  assert.equal(deliveryBoard.totals.packagesPlanned, 13782);
  assert.equal(deliveryBoard.totals.packageStatusCounts.remaining, 25);
  assert.equal(deliveryBoard.totals.packageStatusCounts.reattemptable, 0);
  assert.equal(deliveryBoard.totals.packageStatusCounts.undeliverable, 7);
  assert.equal(deliveryBoard.totals.packageStatusCounts.missing, 4);
  assert.equal(deliveryBoard.totals.packageStatusCounts.returnedToStation, 55);
  assert.equal(deliveryBoard.totals.packageStatusCounts.pickupFailed, 85);
  assert.equal(deliveryBoard.totals.workHourRisk, 0);
  assert.equal(deliveryBoard.totals.noBreaksTaken, 0);
  assert.equal(deliveryBoard.totals.inactive, 0);
  assert.equal(deliveryBoard.totals.unknownStops, 31);
  assert.equal(deliveryBoard.totals.onRoadPickups.total, 7);
  assert.equal(deliveryBoard.totals.onRoadPickups.remaining, 1);
  assert.equal(deliveryBoard.totals.onRoadPickups.complete, 6);
  assert.equal(seed.totals.ahead, 0);
  assert.equal(seed.totals.atRisk, 0);
  assert.equal(seed.totals.behind, 1);
  assert.equal(seed.totals.multiTransporter, 13);
  assert.match(deliveryBoard.disclaimer, /CX326 174\/194, 20 behind; CX302 131\/132 with 7m left on shift/);
  assert.match(deliveryBoard.disclaimer, /CX135 196\/197 and CX301 179\/180 counted complete/);
  assert.match(deliveryBoard.disclaimer, /ahead 0, at risk 0, behind 1/);
  assert.deepEqual(
    routes.filter((route) => route.status === "in_progress").map((route) => route.code),
    ["CX326", "CX302"]
  );
  assert.equal(rescued.length, 13);
  assert.equal(rescued.length, deliveryBoard.totals.multiTransporter);
  assert.equal(deliveryBoard.totals.rescueActions, 0);
  assert.ok(rescued.every((route) => route.rescueDriverIds.length >= 1));
  assert.ok(rescued.every((route) => route.rescueDriverId === route.rescueDriverIds[0]));
  assert.ok(rescued.every((route) => route.status !== "rescued"));

  const cx326 = routes.find((route) => route.code === "CX326");
  assert.ok(cx326);
  assert.equal(cx326.receivedRescue, false);
  assert.equal(cx326.status, "in_progress");
  assert.equal(cx326.driverId, associateId("Bernard Nelson"));
  assert.deepEqual(cx326.rescueDriverIds, []);
  assert.equal(cx326.completedStops, 174);
  assert.equal(cx326.stopCount, 194);
  assert.equal(cx326.packagesDelivered, 301);
  assert.equal(cx326.packageCount, 330);
  assert.equal(cx326.packagesRemaining, 29);
  assert.equal(cx326.notes, "20 behind");

  const cx302 = routes.find((route) => route.code === "CX302");
  assert.ok(cx302);
  assert.equal(cx302.receivedRescue, true);
  assert.equal(cx302.status, "in_progress");
  assert.equal(cx302.driverId, associateId("Chance Stupp"));
  assert.deepEqual(cx302.rescueDriverIds, [associateId("Shaquille Tate")]);
  assert.equal(cx302.completedStops, 131);
  assert.equal(cx302.stopCount, 132);
  assert.equal(cx302.packagesDelivered, 296);
  assert.equal(cx302.packageCount, 320);
  assert.equal(cx302.packagesRemaining, 24);
  assert.equal(cx302.notes, null);

  const cx135 = routes.find((route) => route.code === "CX135");
  assert.ok(cx135);
  assert.equal(cx135.receivedRescue, false);
  assert.equal(cx135.status, "completed");
  assert.equal(cx135.driverId, associateId("Jessica Davis"));
  assert.deepEqual(cx135.rescueDriverIds, []);
  assert.equal(cx135.completedStops, 196);
  assert.equal(cx135.stopCount, 197);
  assert.equal(cx135.packagesDelivered, 335);
  assert.equal(cx135.packageCount, 336);
  assert.equal(cx135.packagesRemaining, 1);
  assert.equal(cx135.notes, null);

  const cx301 = routes.find((route) => route.code === "CX301");
  assert.ok(cx301);
  assert.equal(cx301.receivedRescue, false);
  assert.equal(cx301.status, "completed");
  assert.equal(cx301.driverId, associateId("Chance Stupp"));
  assert.deepEqual(cx301.rescueDriverIds, []);
  assert.equal(cx301.completedStops, 179);
  assert.equal(cx301.stopCount, 180);
  assert.equal(cx301.packagesRemaining, 1);
  assert.equal(cx301.notes, null);

  const file = routesCsv();
  assert.equal(file.filename, "routes-dna4-2026-10-28.csv");
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
  assert.equal(dvic.filename, "dvic-dna4-2026-10-18.csv");
  assert.match(dvic.csv, /^Station,/);
  assert.equal(csvLines(dvic.csv).length, 37);
  assert.match(dvic.csv, /Pre-trip damage/);
  assert.doesNotMatch(dvic.csv, /dent|scratch|VIN/i);

  const fleet = vehiclesCsv();
  assert.equal(fleet.filename, "fleet-vehicles-dna4-console.csv");
  assert.match(fleet.csv, /^Station,Unit/);
  assert.equal(csvLines(fleet.csv).length - 1, 56);
  assert.match(fleet.csv, /Amazon DSP Console My vehicles/);
  assert.match(fleet.csv, /3C6MRVJG5ME549360/);
  assert.match(fleet.csv, /CP81075/);
  assert.doesNotMatch(fleet.csv, /EDV-4401|TN 441-CJM|Mock yard roster/);

  const exceptionFile = exceptionsCsv();
  assert.equal(exceptionFile.filename, "package-exceptions-dna4-2026-10-28.csv");
  assert.equal(csvLines(exceptionFile.csv).length - 1, 149);
  assert.equal(exceptions.length, 149);
  assert.equal(exceptions.filter((row) => row.status === "Reattemptable").length, 0);
  assert.equal(exceptions.filter((row) => row.status === "Undeliverable").length, 7);
  assert.equal(exceptions.filter((row) => row.status === "Missing").length, 4);
  assert.equal(exceptions.filter((row) => row.status === "Returned to station").length, 53);
  assert.equal(exceptions.filter((row) => row.status === "Pickup failed").length, 85);

  const sourceCsv = readFileSync("src/lib/data/seed/packages-exceptions-2026-10-28.csv", "utf8");
  const sourceLines = csvLines(sourceCsv);
  assert.match(sourceLines[0], /^Scannable Id,/);
  assert.equal(sourceLines.length - 1, 149);
  assert.deepEqual(
    sourceLines.slice(1).map((line) => line.split(",")[0]),
    seed.exceptionPackages.map((row) => row["Scannable Id"])
  );

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
  const week42 = getComplianceReport(42);
  assert.equal(week42.week, 42);
  assert.equal(complianceViewCsv(week42, "missing").filename, "compliance-missing-punches-dna4-week-42.csv");
  assert.equal(complianceCombinedCsv(week42).filename, "compliance-dna4-week-42.csv");
  assert.match(complianceCombinedCsv(week42).csv, /Meal rows/);
  const week43 = getComplianceReport();
  assert.equal(week43.week, 43);
  assert.equal(complianceViewCsv(week43, "missing").filename, "compliance-missing-punches-dna4-week-43.csv");
  assert.equal(complianceCombinedCsv(week43).filename, "compliance-dna4-week-43.csv");
  assert.match(complianceCombinedCsv(week43).csv, /Meal rows/);
});

test("Oct 14 refresh-final seed replaces the evening-wrap counts", () => {
  assert.equal(october14.serviceDate, "2026-10-14");
  assert.equal(october14.capturedAt, "2026-10-18T20:49:19-05:00");
  assert.equal(october14.totals.routes, 38);
  assert.equal(october14.routes.length, 38);
  assert.equal(october14.totals.inProgress, 3);
  assert.equal(october14.totals.complete, 35);
  assert.equal(october14.totals.incomplete, 0);
  assert.equal(october14.totals.executionGaugesPct.locations, null);
  assert.equal(october14.totals.executionGaugesPct.stops, null);
  assert.equal(october14.totals.executionGaugesPct.packages, null);
  assert.equal(october14.totals.executionGaugesPct.attemptSuccess, null);
  assert.equal(
    october14.routes.reduce((sum, route) => sum + route.packagesDelivered, 0),
    11395
  );
  assert.equal(
    october14.routes.reduce((sum, route) => sum + route.packagesPlanned, 0),
    11427
  );
  assert.equal(october14.totals.packageStatusCounts.remaining, 22);
  assert.equal(october14.totals.packageStatusCounts.reattemptable, 0);
  assert.equal(october14.totals.packageStatusCounts.undeliverable, 18);
  assert.equal(october14.totals.packageStatusCounts.missing, 0);
  assert.equal(october14.totals.packageStatusCounts.returned_to_station, 45);
  assert.equal(october14.totals.packageStatusCounts.pickup_failed, 82);
  assert.equal(october14.totals.workHourRisk, 0);
  assert.equal(october14.totals.noBreaksTaken, 3);
  assert.equal(october14.totals.inactive, 0);
  assert.equal(october14.totals.unknownStops, 23);
  assert.equal(october14.totals.onRoadPickups.total, 6);
  assert.equal(october14.totals.onRoadPickups.remaining, 0);
  assert.equal(october14.totals.onRoadPickups.complete, 6);
  assert.equal(october14.totals.ahead, 1);
  assert.equal(october14.totals.atRisk, 1);
  assert.equal(october14.totals.behind, 1);
  assert.equal(october14.totals.multiTransporter, 15);
  assert.equal(october14.totals.rescueActions, 0);
  assert.match(october14.disclaimer, /38 routes \/ 3 in progress/);
  assert.match(october14.disclaimer, /Execution gauges not rendered/);
  assert.deepEqual(
    october14.routes.filter((route) => route.status === "in_progress").map((route) => route.routeCode),
    ["AX110", "CX276", "CX255"]
  );
  const behind = october14.routes.find((route) => route.routeCode === "AX110");
  assert.ok(behind);
  assert.deepEqual(behind.associates, ["Gregory Lowery"]);
  assert.equal(behind.stopsDone, 66);
  assert.equal(behind.stopsPlanned, 84);
  assert.deepEqual(behind.notes, ["17 stops behind"]);
  const live = october14.routes.find((route) => route.routeCode === "CX255");
  assert.ok(live);
  assert.deepEqual(live.associates, ["Shameka Williams", "Donnell Jefferson"]);
  assert.equal(live.stopsDone, 191);
  assert.equal(live.stopsPlanned, 192);
  assert.deepEqual(live.notes, ["4 stops ahead"]);
  assert.equal(new Set(october14.routes.flatMap((route) => route.associates)).size, 43);
  assert.ok(october14.routes.some((route) => route.routeCode === "CX254" && route.associates.includes("Aaron Davis")));

  const byStatus = (status: string) =>
    october14.exceptionPackages.filter((row) => row["Package Status"] === status).length;
  assert.equal(october14.exceptionPackages.length, 134);
  assert.equal(byStatus("Reattemptable"), 0);
  assert.equal(byStatus("Undeliverable"), 15);
  assert.equal(byStatus("Missing"), 0);
  assert.equal(byStatus("Returned to station"), 45);
  assert.equal(byStatus("Pickup failed"), 74);

  const csv = readFileSync("src/lib/data/seed/packages-exceptions-2026-10-14.csv", "utf8");
  const lines = csvLines(csv);
  assert.match(lines[0], /^Scannable Id,/);
  assert.equal(lines.length - 1, 134);
  assert.deepEqual(
    lines.slice(1).map((line) => line.split(",")[0]),
    october14.exceptionPackages.map((row) => row["Scannable Id"])
  );
});
