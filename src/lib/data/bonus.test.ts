import assert from "node:assert/strict";
import test from "node:test";
import { bonusCsv, bonusExcel } from "../export/bonus";
import { csvLines } from "../export/csv";
import { bonusDriverLabel, bonusRoutesInRange, getBonusList } from "./bonus";

const EXPECTED_BY_DAY: Record<string, number> = {
  "2026-09-13": 16,
  "2026-09-14": 12,
  "2026-09-15": 13,
  "2026-09-16": 28,
  "2026-09-17": 28,
  "2026-09-18": 25,
  "2026-09-19": 26,
};

test("Week 38 10-hour bonus list is the 180 completed-stop capture", () => {
  const list = getBonusList();
  assert.equal(list.week, 38);
  assert.equal(list.thresholdStopsCompleted, 180);
  assert.equal(list.routes.length, 148);
  assert.equal(list.start, "2026-09-13");
  assert.equal(list.end, "2026-09-19");
  assert.ok(list.routes.every((route) => route.stopsCompleted >= 180));
  assert.deepEqual(
    Object.fromEntries(list.dayCounts.map((day) => [day.date, day.count])),
    EXPECTED_BY_DAY
  );

  const multi = list.routes.find((route) => route.date === "2026-09-13" && route.route === "CX2");
  assert.ok(multi);
  assert.deepEqual(multi.drivers, ["DeAndre Adams", "Jayden Williams"]);
  assert.equal(bonusDriverLabel(multi.drivers), "DeAndre Adams; Jayden Williams");
  assert.equal(multi.stopsCompleted, 183);

  const casing = list.routes.find((route) => route.drivers.includes("darome boyland"));
  assert.ok(casing);
  assert.equal(casing.stopsCompleted >= 180, true);

  const week = bonusRoutesInRange(list, {
    kind: "custom",
    start: "2026-09-13",
    end: "2026-09-19",
  });
  assert.equal(week.length, 148);
  const partial = bonusRoutesInRange(list, {
    kind: "custom",
    start: "2026-09-15",
    end: "2026-09-19",
  });
  assert.equal(partial.length, 13 + 28 + 28 + 25 + 26);
  assert.equal(
    bonusRoutesInRange(list, { kind: "today" }).length,
    0
  );
});

test("10-hour bonus CSV and Excel export the captured routes", () => {
  const list = getBonusList();
  const csv = bonusCsv(list);
  assert.equal(csv.filename, "10-hour-bonus-week-38.csv");
  const lines = csvLines(csv.csv);
  assert.equal(lines.length - 1, 148);
  assert.match(lines[0], /Date,Route,Drivers,Stops completed/);
  assert.match(csv.csv, /2026-09-13,CX1,Makayla Cooper,199,180/);
  assert.match(csv.csv, /DeAndre Adams; Jayden Williams/);
  assert.match(csv.csv, /darome boyland; Candido Fulcher/);
  assert.doesNotMatch(csv.csv, /\$/);

  const excel = bonusExcel(list);
  assert.equal(excel.filename, "10-hour-bonus-week-38.xls");
  assert.match(excel.xml, /<Worksheet ss:Name="10 Hour Bonus">/);
  assert.match(excel.xml, /DeAndre Adams; Jayden Williams/);
  assert.match(excel.xml, /<Data ss:Type="Number">199<\/Data>/);
  assert.equal((excel.xml.match(/<Row>/g) ?? []).length, 149);
});
