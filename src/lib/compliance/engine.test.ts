import assert from "node:assert/strict";
import test from "node:test";
import { evaluateTimecards } from "./engine";
import { matchAmazonName } from "./names";
import type { AdpPunchRow, EvaluateInput, ScheduleAssociate } from "./types";

const WEEK = [
  "2026-09-20",
  "2026-09-21",
  "2026-09-22",
  "2026-09-23",
  "2026-09-24",
  "2026-09-25",
  "2026-09-26",
];

function associate(
  name: string,
  transporterId: string,
  days: Record<string, { block?: number; shift?: string }>
): ScheduleAssociate {
  return {
    name,
    transporterId,
    days: WEEK.map((date) => {
      const spec = days[date];
      const shift = spec?.shift;
      return {
        date,
        workBlock:
          spec?.block == null
            ? null
            : {
                raw: `Route\n10:00am • ${spec.block} hrs`,
                route: "Route",
                start: "10:00am",
                durationHours: spec.block,
              },
        shift:
          shift == null
            ? null
            : shift === "Unavailable"
              ? {
                  raw: "Unavailable",
                  role: "Unavailable",
                  start: null,
                  durationHours: null,
                  unavailable: true,
                }
              : {
                  raw: `Driver • 9:15 AM • ${shift}`,
                  role: "Driver",
                  start: "9:15 AM",
                  durationHours: Number(shift.replace("h", "")),
                  unavailable: false,
                },
      };
    }),
  };
}

function punch(partial: Partial<AdpPunchRow> & Pick<AdpPunchRow, "name" | "date">): AdpPunchRow {
  return {
    positionId: "00G000001",
    timeIn: "",
    timeOut: "",
    hours: "",
    outType: "",
    payCode: "",
    ...partial,
  };
}

function base(overrides: Partial<EvaluateInput>): EvaluateInput {
  return {
    weekDates: WEEK,
    coverageDates: ["2026-09-20", "2026-09-21"],
    associates: [],
    punches: [],
    individuals: [],
    breaks: [],
    sourceNotes: [],
    ...overrides,
  };
}

test("matches fuzzy Amazon names and leaves true strangers unmatched", () => {
  const adp = ["WORLES, JAZMON", "MOSELY, BRIANA", "SANDOVAL, ADRIAN", "DAVIS, AARON"];
  assert.equal(matchAmazonName("Jazmonjr Worles", adp).status, "matched");
  assert.equal(matchAmazonName("briana Maeleah Mosley", adp).status, "matched");
  assert.equal(matchAmazonName("Adrian Sandoval Arellano", adp).status, "matched");
  assert.deepEqual(matchAmazonName("Aaron Calvin Davis", adp), {
    status: "matched",
    adpName: "DAVIS, AARON",
    method: "exact",
  });
  assert.equal(matchAmazonName("Alexis Marrie Hutchison", adp).status, "unmatched");
});

test("flags a scheduled day with no ADP in/out and ignores uncovered days", () => {
  const result = evaluateTimecards(
    base({
      associates: [
        associate("Ada Example", "T1", {
          "2026-09-20": { shift: "10h" },
          "2026-09-22": { block: 10, shift: "10h" },
        }),
      ],
      punches: [punch({ name: "EXAMPLE, ADA", date: "2026-09-20" })],
    })
  );
  assert.equal(result.missingPunches.length, 1);
  assert.equal(result.missingPunches[0]?.date, "2026-09-20");
  assert.match(result.missingPunches[0]?.rule ?? "", /No ADP in\/out/);
  assert.equal(result.over12.length, 0);
});

test("a complete in/out is not a missing punch; an in-only punch is", () => {
  const result = evaluateTimecards(
    base({
      associates: [
        associate("Ada Example", "T1", { "2026-09-20": { block: 10, shift: "10h" } }),
        associate("Bea Example", "T2", { "2026-09-21": { shift: "10h" } }),
      ],
      punches: [
        punch({
          name: "EXAMPLE, ADA",
          date: "2026-09-20",
          timeIn: "09:00 AM",
          timeOut: "07:00 PM",
          hours: "10.00",
        }),
        punch({
          name: "EXAMPLE, BEA",
          date: "2026-09-21",
          timeIn: "09:11 AM",
        }),
      ],
    })
  );
  assert.deepEqual(
    result.missingPunches.map((row) => row.associate),
    ["Bea Example"]
  );
  assert.match(result.missingPunches[0]?.adpTimes ?? "", /no out/);
});

test("Unavailable is not a scheduled shift", () => {
  const result = evaluateTimecards(
    base({
      associates: [associate("Ada Example", "T1", { "2026-09-20": { shift: "Unavailable" } })],
      punches: [punch({ name: "EXAMPLE, ADA", date: "2026-09-20" })],
    })
  );
  assert.equal(result.missingPunches.length, 0);
});

test("sums ADP hours over 12 and does not double-count an identical span", () => {
  const result = evaluateTimecards(
    base({
      associates: [
        associate("Jayden Williams", "T1", { "2026-09-20": { block: 10 } }),
        associate("Khalid Jones", "T2", { "2026-09-21": { block: 10 } }),
      ],
      punches: [
        punch({
          name: "WILLIAMS, JAYDEN",
          date: "2026-09-20",
          timeIn: "07:45 AM",
          timeOut: "02:00 PM",
          hours: "6.25",
        }),
        punch({
          name: "WILLIAMS, JAYDEN",
          date: "2026-09-20",
          timeIn: "02:30 PM",
          timeOut: "09:24 PM",
          hours: "6.90",
        }),
        punch({
          name: "JONES, KHALID",
          date: "2026-09-21",
          timeIn: "09:34 AM",
          timeOut: "03:04 PM",
          hours: "5.50",
        }),
        punch({
          name: "JONES, KHALID",
          date: "2026-09-21",
          timeIn: "09:34 AM",
          timeOut: "03:04 PM",
          hours: "5.50",
          outType: "Meal Punch",
        }),
        punch({
          name: "JONES, KHALID",
          date: "2026-09-21",
          timeIn: "03:34 PM",
          timeOut: "08:41 PM",
          hours: "5.12",
        }),
      ],
    })
  );
  assert.deepEqual(
    result.over12.map((row) => [row.adpName, row.hoursLabel]),
    [["WILLIAMS, JAYDEN", "13.15 ADP"]]
  );
  assert.match(result.notes.join("\n"), /JONES, KHALID/);
});

test("uses an Amazon block over 12 hours only when the associate is matched and ADP has no hours", () => {
  const matched = evaluateTimecards(
    base({
      associates: [associate("Ada Example", "T1", { "2026-09-20": { block: 13 } })],
      punches: [punch({ name: "EXAMPLE, ADA", date: "2026-09-20" })],
    })
  );
  assert.equal(matched.over12.length, 1);
  assert.match(matched.over12[0]?.hoursLabel ?? "", /Amazon block/);

  const shortBlock = evaluateTimecards(
    base({
      associates: [associate("Ada Example", "T1", { "2026-09-20": { block: 10 } })],
      punches: [punch({ name: "EXAMPLE, ADA", date: "2026-09-20" })],
    })
  );
  assert.equal(shortBlock.over12.length, 0);

  const unmatched = evaluateTimecards(
    base({
      associates: [associate("Nobody Known", "T9", { "2026-09-20": { block: 13 } })],
      punches: [punch({ name: "EXAMPLE, ADA", date: "2026-09-20" })],
    })
  );
  assert.equal(unmatched.over12.length, 0);
  assert.equal(unmatched.unmatchedAmazon.length, 1);
});

test("flags a rolling window only when captured ADP hours exceed 60", () => {
  const punches: AdpPunchRow[] = [];
  for (const date of ["2026-09-20", "2026-09-21"]) {
    punches.push(
      punch({
        name: "LONG, DAY",
        date,
        timeIn: "12:00 AM",
        timeOut: "11:00 PM",
        hours: "31.00",
      })
    );
  }
  const over = evaluateTimecards(
    base({
      associates: [associate("Day Long", "T1", {})],
      punches,
    })
  );
  assert.ok(over.over60.length >= 1);
  assert.ok(over.over60.every((row) => row.hoursLabel.startsWith("62.00")));
  assert.match(over.over60[0]?.rule ?? "", /not treated as zero/);

  const under = evaluateTimecards(
    base({
      associates: [associate("Day Long", "T1", {})],
      punches: [
        punch({
          name: "LONG, DAY",
          date: "2026-09-20",
          timeIn: "09:00 AM",
          timeOut: "07:00 PM",
          hours: "10.00",
        }),
      ],
    })
  );
  assert.equal(under.over60.length, 0);
  assert.equal(under.over60Peak?.hoursLabel, "10.00");
});

test("meal mismatch is Meal Punch versus Amazon non-compliant, without invented meal clocks", () => {
  const result = evaluateTimecards(
    base({
      associates: [
        associate("Jazmonjr Worles", "T1", { "2026-09-20": { block: 10 } }),
        associate("Keon Kentrell Gross", "T2", { "2026-09-20": { block: 10 } }),
      ],
      punches: [
        punch({
          name: "WORLES, JAZMON",
          date: "2026-09-20",
          timeIn: "09:19 AM",
          timeOut: "02:04 PM",
          hours: "4.75",
          outType: "Meal Punch",
        }),
        punch({ name: "GROSS, KEON", date: "2026-09-20" }),
      ],
      breaks: [
        { associateName: "Jazmonjr Worles", date: "2026-09-20", status: "non_compliant" },
        { associateName: "Keon Kentrell Gross", date: "2026-09-20", status: "missing_punch" },
      ],
    })
  );
  const jazmon = result.mealRows.find((row) => row.associate.startsWith("Jazmon"));
  const keon = result.mealRows.find((row) => row.associate.startsWith("Keon"));
  assert.equal(jazmon?.mismatch, true);
  assert.equal(jazmon?.adpMeal, "Meal Punch");
  assert.match(jazmon?.amazonTimes ?? "", /^Not in capture/);
  assert.doesNotMatch(jazmon?.amazonTimes ?? "", /Meal \d/);
  assert.equal(keon?.mismatch, false);
  assert.match(keon?.rule ?? "", /not as a meal mismatch/i);
});

test("notes when an individual timecard omits a Group Timecard day", () => {
  const result = evaluateTimecards(
    base({
      associates: [],
      punches: [
        punch({
          name: "STUPP, CHANCE",
          positionId: "00G000554",
          date: "2026-09-21",
          timeIn: "09:15 AM",
          timeOut: "02:07 PM",
          hours: "4.87",
          outType: "Meal Punch",
        }),
      ],
      individuals: [
        {
          name: "CHANCE R STUPP",
          positionId: "00G000554",
          weekTotalHours: 11.1,
          days: [{ date: "2026-09-21", segments: [] }],
        },
      ],
    })
  );
  assert.match(result.notes.join("\n"), /CHANCE R STUPP/);
});
