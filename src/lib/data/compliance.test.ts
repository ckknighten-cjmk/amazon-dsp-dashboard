import assert from "node:assert/strict";
import test from "node:test";
import { getComplianceReport, parseComplianceWeek } from "./compliance";
import adpWeek41 from "./seed/adp-timecards-week41.json";
import scheduleWeek38 from "./seed/week38-amazon-schedule.json";
import scheduleWeek39 from "./seed/week39-amazon-schedule.json";
import scheduleWeek41 from "./seed/week41-amazon-schedule.json";

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

test("Week 41 seed is the default and flags rostered blocks against the full Group Timecard", () => {
  const report = getComplianceReport();
  assert.equal(report.week, 41);
  assert.equal(parseComplianceWeek(undefined), 41);
  assert.equal(parseComplianceWeek("41"), 41);
  assert.equal(parseComplianceWeek(["41"]), 41);
  assert.equal(parseComplianceWeek("38"), 38);
  assert.equal(parseComplianceWeek("39"), 39);
  assert.equal(parseComplianceWeek("40"), 41);

  assert.equal(report.weekLabel, "Week 41, Oct 4–Oct 10, 2026");
  assert.equal(report.coverageLabel, "Oct 4–Oct 10");
  assert.equal(report.coverageDetail, "Group Timecard · Sun–Sat");
  assert.equal(report.company, "CJMK Inc.");
  assert.equal(report.station, "DNA4");
  assert.equal(report.exportedAt, "10/13/26, 7:51:45 PM");
  assert.deepEqual(report.coverageDates, [
    "2026-10-04",
    "2026-10-05",
    "2026-10-06",
    "2026-10-07",
    "2026-10-08",
    "2026-10-09",
    "2026-10-10",
  ]);
  assert.deepEqual(report.counts, {
    missingPunchDays: 16,
    missingPunchAssociates: 7,
    over12Days: 9,
    over60Associates: 0,
    mealMismatches: 45,
    mealRowsJoined: 95,
  });
  assert.equal(
    Object.values(adpWeek41.groupTimecard).reduce((sum, rows) => sum + rows.length, 0),
    1173
  );
  assert.equal(scheduleWeek41.associates.length, 101);
  assert.equal(scheduleWeek41.serviceDates.start, "2026-10-04");
  assert.equal(scheduleWeek41.serviceDates.end, "2026-10-10");
  assert.ok(report.missingPunches.every((row) => report.coverageDates.includes(row.date)));
  assert.ok(report.missingPunches.every((row) => row.amazonTimes.startsWith("Block:")));
  for (const row of report.missingPunches) {
    const person = scheduleWeek41.associates.find(
      (associate) => associate.name.replace(/\s+/g, " ").trim() === row.associate
    );
    assert.ok(person?.days.find((day) => day.date === row.date)?.workBlock, row.id);
  }
  assert.ok(
    report.missingPunches.some(
      (row) =>
        row.associate === "Draem Thomarcus Hines" &&
        row.date === "2026-10-04" &&
        row.adpTimes === "No ADP punch"
    )
  );
  const randolphOnCard = ["2026-10-07", "2026-10-08"] as const;
  for (const date of randolphOnCard) {
    const person = scheduleWeek41.associates.find((associate) => associate.transporterId === "AEAPP9NVQAEM7");
    const day = person?.days.find((item) => item.date === date);
    assert.equal(day?.workBlock, null);
    assert.ok(day?.shift);
    assert.ok(
      adpWeek41.groupTimecard[date].some((row) => row.name === "RANDOLPH, DARIUS" && row.timeIn === "")
    );
    assert.equal(
      report.missingPunches.some((row) => row.associate === "Darius Marques Randolph" && row.date === date),
      false
    );
  }
  assert.deepEqual(
    report.over12.map((row) => `${row.date} ${row.adpName} ${row.hoursLabel}`),
    [
      "2026-10-04 LOWERY, GREGORY 12.16 ADP",
      "2026-10-04 WILLIAMS, JAYDEN 12.92 ADP",
      "2026-10-05 WILLIAMS, JAYDEN 12.83 ADP",
      "2026-10-06 LEWIS, CEDRIC 14.41 ADP",
      "2026-10-06 ARMSTRONG, DIBRELL 12.10 ADP",
      "2026-10-06 LOWERY, GREGORY 12.18 ADP",
      "2026-10-07 LEWIS, CEDRIC 13.33 ADP",
      "2026-10-09 HARRIS, ARLANDO 12.02 ADP",
      "2026-10-09 WILLIAMS, JAYDEN 13.55 ADP",
    ]
  );
  assert.equal(report.over60.length, 0);
  assert.equal(report.over60Peak?.adpName, "PICKENS, LARRICO");
  assert.equal(report.over60Peak?.hoursLabel, "55.59");
  assert.match(report.over60Windows[0]?.coverageLabel ?? "", /^1 of 7 days captured/);
  assert.match(report.over60Windows.at(-1)?.coverageLabel ?? "", /^7 of 7 days captured/);
  assert.match(report.scheduleTemplateNote, /Coming later/);
  assert.match(report.notes.join("\n"), /does not load or push|Coming later|schedule template/i);
  assert.doesNotMatch(report.notes.join("\n"), /ORA-20005/);
  assert.match(
    report.notes.join("\n"),
    /Rostered work-block totals Sun–Sat from the schedule workbook: 35, 41, 44, 40, 41, 39, 41/
  );

  const mismatches = report.mealRows.filter((row) => row.mismatch);
  assert.equal(mismatches.length, 45);
  assert.deepEqual(
    [...new Set(mismatches.map((row) => `${row.amazonStatus} | ${row.adpMeal}`))].sort(),
    ["Missing Punch | Meal Punch", "Non-compliant | Meal Punch"]
  );
  assert.ok(
    mismatches.some(
      (row) => row.associate === "Jazmonjr Worles" && row.date === "2026-10-04" && row.amazonStatus === "Non-compliant"
    )
  );
  assert.ok(
    mismatches.some(
      (row) =>
        row.associate === "Jalon Gerald Lewis" &&
        row.date === "2026-10-04" &&
        row.adpMeal === "Meal Punch"
    )
  );
  for (const row of report.mealRows) {
    assert.match(row.amazonTimes, /^Not in capture/);
    assert.equal(row.amazonStatus === "Non-compliant" || row.amazonStatus === "Missing Punch", true);
  }
  assert.ok(report.unmatchedAmazon.some((row) => row.name === "Alexis Marrie Hutchison"));
  assert.equal(report.mealRows.some((row) => row.associate === "Lewis Gerald Lewis"), false);
  assert.equal(report.workHoursSummary.dasNearingViolations, 3);
  assert.equal(report.workHoursSummary.worked50to60HoursPast7Days, 3);
  assert.equal(report.breaksSummary.dasWithViolations, 29);
  assert.equal(report.breaksSummary.missingPunches, 19);
  assert.equal(report.breaksSummary.breaksBoardAssociates, 94);
  assert.equal(report.breaksSummary.dasWithViolationsYesterday, null);
});

test("Week 38 seed uses the full Group Timecard and does not invent meals or work-hour counts", () => {
  const report = getComplianceReport(38);
  assert.equal(report.week, 38);
  assert.equal(parseComplianceWeek("38"), 38);
  assert.equal(parseComplianceWeek("39"), 39);
  assert.equal(parseComplianceWeek("40"), 41);

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
