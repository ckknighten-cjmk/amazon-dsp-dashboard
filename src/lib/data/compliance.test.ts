import assert from "node:assert/strict";
import test from "node:test";
import { getComplianceReport, parseComplianceWeek } from "./compliance";
import adpWeek41 from "./seed/adp-timecards-week41.json";
import adpWeek42 from "./seed/adp-timecards-week42.json";
import adpWeek43 from "./seed/adp-timecards-week43.json";
import breaksWeek42 from "./seed/week42-amazon-breaks.json";
import scheduleWeek38 from "./seed/week38-amazon-schedule.json";
import scheduleWeek39 from "./seed/week39-amazon-schedule.json";
import scheduleWeek41 from "./seed/week41-amazon-schedule.json";
import scheduleWeek42 from "./seed/week42-amazon-schedule.json";
import scheduleWeek43 from "./seed/week43-amazon-schedule.json";

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

test("Week 41 seed flags rostered blocks against the full Group Timecard", () => {
  const report = getComplianceReport(41);
  assert.equal(report.week, 41);
  assert.equal(parseComplianceWeek("41"), 41);
  assert.equal(parseComplianceWeek(["41"]), 41);
  assert.equal(parseComplianceWeek("38"), 38);
  assert.equal(parseComplianceWeek("39"), 39);

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
    missingPunchDays: 1,
    missingPunchAssociates: 1,
    over12Days: 0,
    over60Associates: 0,
    mealMismatches: 52,
    mealRowsJoined: 95,
  });
  assert.equal(
    Object.values(adpWeek41.groupTimecard).reduce((sum, rows) => sum + rows.length, 0),
    1196
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
        row.associate === "Michael Neal" &&
        row.date === "2026-10-08" &&
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
    []
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
  assert.equal(mismatches.length, 52);
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

test("Week 42 seed flags the full Group Timecard and leaves the partial Work hour table empty", () => {
  const report = getComplianceReport(42);
  assert.equal(report.week, 42);
  assert.equal(getComplianceReport().week, 43);
  assert.equal(parseComplianceWeek("42"), 42);
  assert.equal(parseComplianceWeek(["42"]), 42);
  assert.equal(parseComplianceWeek(undefined), 43);
  assert.equal(parseComplianceWeek("40"), 43);
  assert.equal(parseComplianceWeek("43"), 43);

  assert.equal(report.weekLabel, "Week 42, Oct 11–Oct 17, 2026");
  assert.equal(report.coverageLabel, "Oct 11–Oct 17");
  assert.equal(report.coverageDetail, "Group Timecard · Sun–Sat");
  assert.equal(report.company, "CJMK Inc.");
  assert.equal(report.station, "DNA4");
  assert.equal(report.exportedAt, "10/21/26, 7:00:55 AM");
  assert.match(report.sourceNote, /pages 1–4 only \(77 DAs\)/);
  assert.match(report.sourceNote, /Pages 5–6 errored on Amazon's side and were not filled in/);
  assert.deepEqual(report.coverageDates, [
    "2026-10-11",
    "2026-10-12",
    "2026-10-13",
    "2026-10-14",
    "2026-10-15",
    "2026-10-16",
    "2026-10-17",
  ]);
  assert.deepEqual(report.counts, {
    missingPunchDays: 18,
    missingPunchAssociates: 9,
    over12Days: 3,
    over60Associates: 0,
    mealMismatches: 22,
    mealRowsJoined: 113,
  });
  assert.equal(
    Object.values(adpWeek42.groupTimecard).reduce((sum, rows) => sum + rows.length, 0),
    1016
  );
  assert.deepEqual(Object.keys(adpWeek42.groupTimecard), report.coverageDates);
  assert.deepEqual(Object.keys(adpWeek42.individualTimecards), []);
  const outTypes = Object.values(adpWeek42.groupTimecard).flatMap((rows) => rows.map((row) => row.outType));
  assert.equal(outTypes.filter((value) => value === "Meal Punch").length, 169);
  assert.equal(outTypes.filter((value) => value === "No Meal").length, 21);
  assert.equal(
    Object.values(adpWeek42.groupTimecard)
      .flat()
      .filter((row) => row.positionId === "00G000601")
      .every((row) => row.department === ""),
    true
  );
  assert.ok(
    adpWeek42.groupTimecard["2026-10-11"].some(
      (row) => row.name === "KNIGHT, KYLAN" && row.positionId === "00G000061" && row.department === "000009"
    )
  );
  assert.equal(scheduleWeek42.associates.length, 102);
  assert.equal(scheduleWeek42.serviceDates.start, "2026-10-11");
  assert.equal(scheduleWeek42.serviceDates.end, "2026-10-17");
  assert.equal(scheduleWeek42.parsedFrom, "week42-amazon-schedule.xlsx");
  const aaron = scheduleWeek42.associates.find((associate) => associate.transporterId === "AD3O3G0B92UUS");
  assert.equal(aaron?.days[1]?.date, "2026-10-12");
  assert.equal(aaron?.days[1]?.workBlock?.route, "Standard Parcel Electric - Rivian MEDIUM");
  assert.equal(aaron?.days[1]?.workBlock?.start, "10:15am");
  assert.equal(aaron?.days[1]?.workBlock?.durationHours, 10);
  assert.equal(aaron?.days[1]?.shift?.role, "Driver");
  assert.deepEqual(scheduleWeek42.rosteredTotals, {
    "2026-10-11": 35,
    "2026-10-12": 39,
    "2026-10-13": 45,
    "2026-10-14": 41,
    "2026-10-15": 38,
    "2026-10-16": 39,
    "2026-10-17": 36,
  });
  assert.ok(report.missingPunches.every((row) => report.coverageDates.includes(row.date)));
  assert.ok(report.missingPunches.every((row) => row.amazonTimes.startsWith("Block:")));
  for (const row of report.missingPunches) {
    const person = scheduleWeek42.associates.find(
      (associate) => associate.name.replace(/\s+/g, " ").trim() === row.associate
    );
    assert.ok(person?.days.find((day) => day.date === row.date)?.workBlock, row.id);
  }
  assert.ok(
    report.missingPunches.some(
      (row) =>
        row.associate === "Dibrell Antwoine Armstrong" &&
        row.date === "2026-10-11" &&
        row.adpTimes === "No ADP punch"
    )
  );
  assert.ok(
    report.missingPunches.some(
      (row) => row.associate === "Martez Wilkins" && row.date === "2026-10-12" && /no out/.test(row.adpTimes)
    )
  );
  const randolph = ["2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17"] as const;
  for (const date of randolph) {
    const person = scheduleWeek42.associates.find((associate) => associate.transporterId === "AEAPP9NVQAEM7");
    const day = person?.days.find((item) => item.date === date);
    assert.equal(day?.workBlock, null);
    assert.ok(day?.shift);
    assert.ok(adpWeek42.groupTimecard[date].some((row) => row.name === "RANDOLPH, DARIUS" && row.timeIn === ""));
    assert.equal(
      report.missingPunches.some((row) => row.associate === "Darius Marques Randolph" && row.date === date),
      false
    );
  }
  assert.deepEqual(
    report.over12.map((row) => `${row.date} ${row.adpName} ${row.hoursLabel}`),
    [
      "2026-10-11 WILLIAMS, JAYDEN 12.25 ADP",
      "2026-10-12 TYLER, DORIAN 12.97 ADP",
      "2026-10-16 WILLIAMS, JAYDEN 12.50 ADP",
    ]
  );
  assert.equal(report.over60.length, 0);
  assert.equal(report.over60Peak?.adpName, "WILLIAMS, SHAMEKA");
  assert.equal(report.over60Peak?.hoursLabel, "51.70");
  assert.match(report.over60Windows[0]?.coverageLabel ?? "", /^1 of 7 days captured/);
  assert.match(report.over60Windows.at(-1)?.coverageLabel ?? "", /^7 of 7 days captured/);
  assert.match(report.scheduleTemplateNote, /Coming later/);
  assert.match(report.notes.join("\n"), /does not load or push|Coming later|schedule template/i);
  assert.doesNotMatch(report.notes.join("\n"), /ORA-20005/);
  assert.match(
    report.notes.join("\n"),
    /Rostered work-block totals Sun–Sat from the schedule workbook: 35, 39, 45, 41, 38, 39, 36/
  );
  assert.match(report.notes.join("\n"), /pages 1–4 only \(77 DAs\)/);
  assert.match(report.notes.join("\n"), /were not filled in/);
  assert.equal(breaksWeek42.rows.length, 113);
  assert.equal(breaksWeek42.rows.filter((row) => row.status === "non_compliant").length, 64);
  assert.equal(breaksWeek42.rows.filter((row) => row.status === "missing_punch").length, 49);
  assert.equal("workHour" in breaksWeek42, false);

  const mismatches = report.mealRows.filter((row) => row.mismatch);
  assert.equal(mismatches.length, 22);
  assert.deepEqual(
    [...new Set(mismatches.map((row) => `${row.amazonStatus} | ${row.adpMeal}`))].sort(),
    ["Missing Punch | Meal Punch", "Non-compliant | Meal Punch"]
  );
  assert.ok(
    mismatches.some(
      (row) =>
        row.associate === "Shakira Kenyato Singleton" &&
        row.date === "2026-10-12" &&
        row.amazonStatus === "Non-compliant"
    )
  );
  assert.ok(
    mismatches.some(
      (row) =>
        row.associate === "Brandon Michael Clark" &&
        row.date === "2026-10-12" &&
        row.amazonStatus === "Missing Punch" &&
        row.adpMeal === "Meal Punch"
    )
  );
  for (const row of report.mealRows) {
    assert.match(row.amazonTimes, /^Not in capture/);
    assert.equal(row.amazonStatus === "Non-compliant" || row.amazonStatus === "Missing Punch", true);
  }
  assert.ok(report.unmatchedAmazon.some((row) => row.name === "Alexis Marrie Hutchison"));
  assert.equal(report.workHoursSummary.dasNearingViolations, 9);
  assert.equal(report.workHoursSummary.worked50to60HoursPast7Days, 3);
  assert.equal(report.workHoursSummary.worked5to6ConsecutiveDays, 7);
  assert.equal(report.workHoursSummary.associateNamed, false);
  assert.equal(report.workHoursSummary.lastRefreshedDate, "2026-10-21");
  assert.equal(report.breaksSummary.dasWithViolations, 36);
  assert.equal(report.breaksSummary.dasWithViolationsYesterday, null);
  assert.equal(report.breaksSummary.missingBreaks, 14);
  assert.equal(report.breaksSummary.delayedBreaks, 7);
  assert.equal(report.breaksSummary.shorterBreakThanRequired, 3);
  assert.equal(report.breaksSummary.packageDeliveredDuringBreak, 13);
  assert.equal(report.breaksSummary.missingPunches, 21);
  assert.equal(report.breaksSummary.breaksBoardAssociates, 95);
});

test("Week 43 seed is the default and leaves future days outside the Group Timecard", () => {
  const report = getComplianceReport();
  assert.equal(report.week, 43);
  assert.equal(parseComplianceWeek(undefined), 43);
  assert.equal(parseComplianceWeek("43"), 43);
  assert.equal(parseComplianceWeek(["43"]), 43);
  assert.equal(parseComplianceWeek("41"), 41);
  assert.equal(parseComplianceWeek("38"), 38);
  assert.equal(parseComplianceWeek("39"), 39);
  assert.equal(parseComplianceWeek("40"), 43);
  assert.equal(parseComplianceWeek("42"), 42);

  assert.equal(report.weekLabel, "Week 43, Oct 18–Oct 24, 2026");
  assert.equal(report.coverageLabel, "Oct 18–Oct 21");
  assert.equal(report.coverageDetail, "Group Timecard · Sun–Wed");
  assert.equal(report.company, "CJMK Inc.");
  assert.equal(report.station, "DNA4");
  assert.equal(report.exportedAt, "10/21/26, 6:16:20 AM");
  assert.deepEqual(report.weekDates, [
    "2026-10-18",
    "2026-10-19",
    "2026-10-20",
    "2026-10-21",
    "2026-10-22",
    "2026-10-23",
    "2026-10-24",
  ]);
  assert.deepEqual(report.coverageDates, [
    "2026-10-18",
    "2026-10-19",
    "2026-10-20",
    "2026-10-21",
  ]);
  assert.deepEqual(Object.keys(adpWeek43.groupTimecard).sort(), [
    "2026-10-18",
    "2026-10-19",
    "2026-10-20",
    "2026-10-21",
  ]);
  assert.deepEqual(report.counts, {
    missingPunchDays: 67,
    missingPunchAssociates: 51,
    over12Days: 2,
    over60Associates: 0,
    mealMismatches: 0,
    mealRowsJoined: 78,
  });
  assert.equal(
    Object.values(adpWeek43.groupTimecard).reduce((sum, rows) => sum + rows.length, 0),
    591
  );
  assert.ok(
    Object.values(adpWeek43.groupTimecard).every((rows) => rows.every((row) => row.outType === ""))
  );
  assert.equal(scheduleWeek43.associates.length, 101);
  assert.equal(scheduleWeek43.serviceDates.start, "2026-10-18");
  assert.equal(scheduleWeek43.serviceDates.end, "2026-10-24");
  assert.deepEqual(scheduleWeek43.rosteredTotals, {
    "2026-10-18": 36,
    "2026-10-19": 42,
    "2026-10-20": 42,
    "2026-10-21": 37,
    "2026-10-22": 0,
    "2026-10-23": 0,
    "2026-10-24": 0,
  });
  assert.ok(report.missingPunches.every((row) => report.coverageDates.includes(row.date)));
  assert.ok(report.missingPunches.every((row) => row.amazonTimes.startsWith("Block:")));
  assert.equal(report.missingPunches.filter((row) => row.date >= "2026-10-22").length, 0);
  const oct21 = report.missingPunches.filter((row) => row.date === "2026-10-21");
  assert.equal(oct21.length, 37);
  assert.ok(oct21.every((row) => row.adpTimes === "No ADP punch"));
  assert.ok(
    report.missingPunches.some(
      (row) =>
        row.associate === "Michael Neal" &&
        row.date === "2026-10-18" &&
        row.adpTimes === "No ADP punch"
    )
  );
  const amy = scheduleWeek43.associates.find((associate) => associate.transporterId === "A18P3MJLHQG320");
  const amySunday = amy?.days.find((day) => day.date === "2026-10-18");
  assert.equal(amySunday?.workBlock, null);
  assert.ok(amySunday?.shift);
  assert.ok(
    adpWeek43.groupTimecard["2026-10-18"].some((row) => row.name === "RHINEHART, AMY" && row.timeIn === "")
  );
  assert.equal(
    report.missingPunches.some((row) => row.associate === "Amy Ann Rhinehart" && row.date === "2026-10-18"),
    false
  );
  assert.deepEqual(
    report.over12.map((row) => `${row.date} ${row.adpName} ${row.hoursLabel}`),
    ["2026-10-20 ESPINOZA, DANIEL 13.67 ADP", "2026-10-20 Ruffin, Arielle 12.08 ADP"]
  );
  assert.equal(report.over60.length, 0);
  assert.equal(report.over60Peak?.adpName, "STUPP, COLTER");
  assert.equal(report.over60Peak?.hoursLabel, "26.99");
  assert.match(report.over60Windows[0]?.coverageLabel ?? "", /^1 of 7 days captured/);
  assert.match(report.over60Windows.at(-1)?.coverageLabel ?? "", /^4 of 7 days captured/);
  assert.match(report.scheduleTemplateNote, /Coming later/);
  assert.match(report.notes.join("\n"), /does not load or push|Coming later|schedule template/i);
  assert.match(report.notes.join("\n"), /10\/22-10\/24 are future and skipped/);
  assert.match(
    report.notes.join("\n"),
    /Rostered work-block totals Sun–Sat from the schedule workbook: 36, 42, 42, 37, 0, 0, 0/
  );
  assert.doesNotMatch(report.notes.join("\n"), /ORA-20005/);
  assert.equal(report.mealRows.filter((row) => row.mismatch).length, 0);
  assert.equal(report.mealRows.some((row) => row.adpMeal === "Meal Punch"), false);
  assert.ok(
    report.mealRows.some(
      (row) =>
        row.associate === "Jazmonjr Worles" &&
        row.date === "2026-10-18" &&
        row.amazonStatus === "Non-compliant" &&
        row.mismatch === false
    )
  );
  for (const row of report.mealRows) {
    assert.match(row.amazonTimes, /^Not in capture/);
    assert.equal(row.amazonStatus === "Non-compliant" || row.amazonStatus === "Missing Punch", true);
  }
  assert.ok(report.unmatchedAmazon.some((row) => row.name === "Alexis Marrie Hutchison"));
  assert.equal(report.workHoursSummary.dasNearingViolations, 3);
  assert.equal(report.workHoursSummary.worked50to60HoursPast7Days, 1);
  assert.equal(report.workHoursSummary.worked5to6ConsecutiveDays, 2);
  assert.equal(report.workHoursSummary.associateNamed, false);
  assert.equal(report.workHoursSummary.lastRefreshedDate, "2026-10-21");
  assert.equal(report.breaksSummary.dasWithViolations, 20);
  assert.equal(report.breaksSummary.dasWithViolationsYesterday, 11);
  assert.equal(report.breaksSummary.missingPunches, 36);
  assert.equal(report.breaksSummary.breaksBoardAssociates, 83);
});

test("Week 38 seed uses the full Group Timecard and does not invent meals or work-hour counts", () => {
  const report = getComplianceReport(38);
  assert.equal(report.week, 38);
  assert.equal(parseComplianceWeek("38"), 38);
  assert.equal(parseComplianceWeek("39"), 39);
  assert.equal(parseComplianceWeek("40"), 43);
  assert.equal(parseComplianceWeek("43"), 43);

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
