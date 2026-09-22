import assert from "node:assert/strict";
import test from "node:test";
import { getComplianceReport } from "./compliance";

test("Week 39 seed flags only captured punches and does not invent meal clocks", () => {
  const report = getComplianceReport();

  assert.deepEqual(report.counts, {
    missingPunchDays: 28,
    missingPunchAssociates: 22,
    over12Days: 2,
    over60Associates: 0,
    mealMismatches: 2,
    mealRowsJoined: 4,
  });
  assert.deepEqual(report.coverageDates, ["2026-09-20", "2026-09-21"]);
  assert.ok(report.missingPunches.every((row) => report.coverageDates.includes(row.date)));
  assert.deepEqual(
    report.over12.map((row) => `${row.associate} ${row.hoursLabel}`),
    ["Jayden Williams 13.15 ADP", "Shakira Kenyato Singleton 12.08 ADP"]
  );
  assert.equal(
    report.over12.some((row) => row.adpName === "JONES, KHALID"),
    false
  );
  assert.equal(report.over60.length, 0);
  assert.equal(report.over60Peak?.hoursLabel, "23.83");
  assert.match(report.scheduleTemplateNote, /Coming later/);

  const mismatches = report.mealRows.filter((row) => row.mismatch);
  assert.deepEqual(
    mismatches.map((row) => `${row.associate} ${row.date}`),
    ["Jazmonjr Worles 2026-09-20", "Jazmonjr Worles 2026-09-21"]
  );
  for (const row of report.mealRows) {
    assert.match(row.amazonTimes, /^Not in capture/);
    assert.equal(row.amazonStatus === "Non-compliant" || row.amazonStatus === "Missing Punch", true);
  }

  assert.ok(report.unmatchedAmazon.some((row) => row.name === "Alexis Marrie Hutchison"));
  assert.equal(
    report.unmatchedAmazon.some((row) => row.name.toLowerCase().includes("mosley")),
    false
  );
  assert.ok(report.unmatchedAdp.some((row) => row.name === "Ruffin, Arielle" && row.dateKeys.length === 1));
  assert.match(report.notes.join("\n"), /ORA-20005/);
  assert.match(report.notes.join("\n"), /CHANCE R STUPP/);
});
