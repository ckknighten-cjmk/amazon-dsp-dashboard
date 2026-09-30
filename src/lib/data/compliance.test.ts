import assert from "node:assert/strict";
import test from "node:test";
import { getComplianceReport, parseComplianceWeek } from "./compliance";
import scheduleWeek38 from "./seed/week38-amazon-schedule.json";
import scheduleWeek39 from "./seed/week39-amazon-schedule.json";

test("Week 39 seed flags the full Group Timecard and does not invent meal clocks", () => {
  const report = getComplianceReport(39);

  assert.deepEqual(report.counts, {
    missingPunchDays: 16,
    missingPunchAssociates: 13,
    over12Days: 3,
    over60Associates: 0,
    mealMismatches: 2,
    mealRowsJoined: 4,
  });
  assert.deepEqual(report.coverageDates, [
    "2026-09-20",
    "2026-09-21",
    "2026-09-22",
    "2026-09-23",
    "2026-09-24",
    "2026-09-25",
    "2026-09-26",
  ]);
  assert.equal(report.coverageDetail, "Group Timecard · Sun–Sat");
  assert.ok(report.missingPunches.every((row) => report.coverageDates.includes(row.date)));
  assert.ok(report.missingPunches.every((row) => row.amazonTimes.startsWith("Block:")));
  assert.ok(
    report.missingPunches.some(
      (row) =>
        row.associate === "Draem Thomarcus Hines" &&
        row.date === "2026-09-20" &&
        row.adpTimes === "No ADP punch"
    )
  );
  assert.ok(
    report.missingPunches.some(
      (row) => row.associate === "Makayla Sharmaine Cooper" && row.date === "2026-09-20" && /no out/.test(row.adpTimes)
    )
  );
  assert.ok(report.coverageDates.includes("2026-09-26"));
  const shiftOnlyDates = ["2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26"] as const;
  for (const date of shiftOnlyDates) {
    assert.equal(scheduleWeek39.rosteredTotals[date], 0);
    assert.ok(scheduleWeek39.scheduledTotals[date] > 0);
    assert.equal(report.missingPunches.some((row) => row.date === date), false);
  }
  assert.deepEqual(
    report.over12.map((row) => `${row.date} ${row.adpName} ${row.hoursLabel}`),
    [
      "2026-09-20 WILLIAMS, JAYDEN 13.15 ADP",
      "2026-09-21 WILLIAMS, JAYDEN 12.92 ADP",
      "2026-09-22 LEWIS, CEDRIC 13.37 ADP",
    ]
  );
  assert.equal(report.over60.length, 0);
  assert.equal(report.over60Peak?.adpName, "STUPP, CHANCE");
  assert.equal(report.over60Peak?.hoursLabel, "43.93");
  assert.match(report.over60Windows[0]?.coverageLabel ?? "", /^1 of 7 days captured/);
  assert.match(report.over60Windows.at(-1)?.coverageLabel ?? "", /^7 of 7 days captured/);
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
  assert.ok(report.unmatchedAdp.some((row) => row.name === "Ruffin, Arielle" && row.dateKeys.length === 4));
  const notes = report.notes.join("\n");
  assert.doesNotMatch(notes, /ORA-20005/);
  assert.doesNotMatch(notes, /CHANCE R STUPP/);
  assert.match(notes, /Date column|displayed Date field/);
  assert.equal(report.week, 39);
  assert.equal(report.coverageLabel, "Sep 20–Sep 26");
  assert.equal(report.workHoursSummary.dasNearingViolations, 1);
});

test("Week 38 seed uses the full Group Timecard and does not invent meals or work-hour counts", () => {
  const report = getComplianceReport();
  assert.equal(report.week, 38);
  assert.equal(parseComplianceWeek(undefined), 38);
  assert.equal(parseComplianceWeek("39"), 39);
  assert.equal(parseComplianceWeek("40"), 38);

  assert.equal(report.weekLabel, "Week 38, Sep 13–Sep 19, 2026");
  assert.equal(report.coverageLabel, "Sep 13–Sep 19");
  assert.deepEqual(report.coverageDates, [
    "2026-09-13",
    "2026-09-14",
    "2026-09-15",
    "2026-09-16",
    "2026-09-17",
    "2026-09-18",
    "2026-09-19",
  ]);
  assert.equal(report.exportedAt, "9/22/26, 8:59:54 PM");
  assert.deepEqual(report.counts, {
    missingPunchDays: 18,
    missingPunchAssociates: 7,
    over12Days: 8,
    over60Associates: 0,
    mealMismatches: 0,
    mealRowsJoined: 0,
  });
  assert.equal(report.mealRows.length, 0);
  assert.deepEqual(report.workHoursSummary, {
    dasNearingViolations: null,
    worked50to60HoursPast7Days: null,
    worked5to6ConsecutiveDays: null,
    associateNamed: false,
    lastRefreshedDate: "2026-09-22",
  });
  assert.equal(report.breaksSummary.dasWithViolations, 31);
  assert.equal(report.breaksSummary.dasWithViolationsYesterday, null);
  assert.equal(report.breaksSummary.missingPunches, 13);
  assert.equal(report.breaksSummary.breaksBoardAssociates, 86);
  assert.ok(report.missingPunches.every((row) => report.coverageDates.includes(row.date)));
  assert.ok(report.missingPunches.every((row) => row.amazonTimes.startsWith("Block:")));
  assert.deepEqual(
    report.over12.map((row) => `${row.date} ${row.adpName} ${row.hoursLabel}`),
    [
      "2026-09-13 FULCHER, CANDIDO 12.25 ADP",
      "2026-09-13 WILLIAMS, JAYDEN 12.27 ADP",
      "2026-09-14 WILLIAMS, JAYDEN 13.27 ADP",
      "2026-09-15 LEWIS, CEDRIC 13.17 ADP",
      "2026-09-16 LEWIS, CEDRIC 14.17 ADP",
      "2026-09-16 SINGLETON, SHAKIRA 12.32 ADP",
      "2026-09-17 LEWIS, CEDRIC 13.25 ADP",
      "2026-09-18 WILLIAMS, JAYDEN 13.25 ADP",
    ]
  );
  assert.equal(report.over60.length, 0);
  assert.equal(report.over60Peak?.hoursLabel, "49.12");
  assert.equal(report.over60Peak?.adpName, "WILLIAMS, JAYDEN");
  assert.match(report.over60Windows[0]?.coverageLabel ?? "", /^1 of 7 days captured/);
  assert.match(report.over60Windows.at(-1)?.coverageLabel ?? "", /^7 of 7 days captured/);
  assert.match(report.scheduleTemplateNote, /Coming later/);
  assert.doesNotMatch(report.notes.join("\n"), /ORA-20005/);
  assert.match(report.notes.join("\n"), /No per-DA Compliance Breaks rows/);
  assert.match(report.notes.join("\n"), /were not in this capture/);
  assert.match(
    report.notes.join("\n"),
    /Rostered work-block totals Sun–Sat from the schedule workbook: 38, 41, 41, 42, 43, 39, 34/
  );
  assert.ok(report.unmatchedAmazon.some((row) => row.name === "Alexis Marrie Hutchison"));
  assert.ok(report.unmatchedAdp.some((row) => row.reason.includes("Week 38")));

  const aaron = scheduleWeek38.associates.find((row) => row.transporterId === "AD3O3G0B92UUS");
  assert.equal(scheduleWeek38.week, 38);
  assert.equal(scheduleWeek38.serviceDates.start, "2026-09-13");
  assert.equal(scheduleWeek38.serviceDates.end, "2026-09-19");
  assert.equal(scheduleWeek38.associates.length, 96);
  assert.equal(aaron?.days[0]?.workBlock, null);
  assert.equal(aaron?.days[1]?.date, "2026-09-14");
  assert.equal(aaron?.days[1]?.workBlock?.route, "Standard Parcel Electric - Rivian MEDIUM");
  assert.equal(aaron?.days[1]?.workBlock?.start, "10:15am");
  assert.equal(aaron?.days[1]?.workBlock?.durationHours, 10);
  assert.equal(aaron?.days[1]?.shift?.role, "Driver");
  assert.equal(aaron?.days[1]?.shift?.start, "9:15 AM");
  assert.equal(aaron?.days[1]?.shift?.unavailable, false);
  assert.deepEqual(scheduleWeek38.rosteredTotals, {
    "2026-09-13": 38,
    "2026-09-14": 41,
    "2026-09-15": 41,
    "2026-09-16": 42,
    "2026-09-17": 43,
    "2026-09-18": 39,
    "2026-09-19": 34,
  });
});
