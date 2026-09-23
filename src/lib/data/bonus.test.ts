import assert from "node:assert/strict";
import test from "node:test";
import routeSeed from "./seed/10hr-bonus-week38.json";
import { bonusCsv, bonusExcel } from "../export/bonus";
import { csvLines } from "../export/csv";
import { bonusCoDriverLabel, bonusEntriesInRange, getBonusList } from "./bonus";

const EXPECTED_SOLO_BY_DAY: Record<string, number> = {
  "2026-09-13": 9,
  "2026-09-14": 10,
  "2026-09-15": 10,
  "2026-09-16": 20,
  "2026-09-17": 18,
  "2026-09-18": 14,
  "2026-09-19": 19,
};

test("Week 38 bonus list is one row per delivery associate", () => {
  const list = getBonusList();
  assert.equal(list.week, 38);
  assert.equal(list.thresholdStopsCompleted, 180);
  assert.equal(list.entries.length, 215);
  assert.equal(list.soloCount, 100);
  assert.equal(list.multiTransporterCount, 115);
  assert.equal(new Set(list.entries.map((entry) => entry.deliveryAssociate)).size, 79);
  assert.equal(
    new Set(list.entries.filter((entry) => !entry.multiTransporter).map((entry) => entry.deliveryAssociate)).size,
    51
  );
  assert.ok(list.entries.every((entry) => entry.stopsCompleted >= 180));
  assert.deepEqual(
    Object.fromEntries(list.dayCounts.map((day) => [day.date, day.solo])),
    EXPECTED_SOLO_BY_DAY
  );

  const solo = list.entries.find((entry) => entry.deliveryAssociate === "Makayla Cooper" && entry.date === "2026-09-13");
  assert.ok(solo);
  assert.equal(solo.multiTransporter, false);
  assert.equal(solo.route, "CX1");
  assert.equal(solo.stopsCompleted, 199);
  assert.deepEqual(solo.coDrivers, []);

  const multi = list.entries.filter((entry) => entry.date === "2026-09-13" && entry.route === "CX2");
  assert.deepEqual(
    multi.map((entry) => entry.deliveryAssociate),
    ["DeAndre Adams", "Jayden Williams"]
  );
  assert.ok(multi.every((entry) => entry.multiTransporter && entry.stopsCompleted === 183));
  assert.equal(bonusCoDriverLabel(multi[0]!.coDrivers), "Jayden Williams");
  assert.equal(bonusCoDriverLabel(multi[1]!.coDrivers), "DeAndre Adams");

  const casing = list.entries.find((entry) => entry.deliveryAssociate === "darome boyland");
  assert.ok(casing);
  assert.equal(casing.multiTransporter, true);

  assert.equal(
    bonusEntriesInRange(list, { kind: "custom", start: "2026-09-13", end: "2026-09-19" }).length,
    215
  );
  assert.equal(bonusEntriesInRange(list, { kind: "today" }).length, 0);
});

test("multi-transporter rows keep the route total and do not invent a split", () => {
  const list = getBonusList();
  const routes = new Map<string, (typeof routeSeed.routes)[number]>(
    routeSeed.routes.map((route) => [`${route.date}|${route.route}`, route])
  );
  const grouped = new Map<string, typeof list.entries>();
  for (const entry of list.entries) {
    const key = `${entry.date}|${entry.route}`;
    grouped.set(key, [...(grouped.get(key) ?? []), entry]);
  }
  assert.equal(grouped.size, routeSeed.routes.length);
  for (const [key, rows] of grouped) {
    const route = routes.get(key);
    assert.ok(route, key);
    assert.deepEqual(
      rows.map((row) => row.deliveryAssociate),
      route.drivers
    );
    assert.ok(rows.every((row) => row.stopsCompleted === route.stopsCompleted));
    if (route.drivers.length === 1) {
      assert.ok(rows.every((row) => !row.multiTransporter && row.coDrivers.length === 0));
    } else {
      assert.equal(rows.length, route.drivers.length);
      for (const row of rows) {
        assert.equal(row.multiTransporter, true);
        assert.deepEqual(
          row.coDrivers,
          route.drivers.filter((name) => name !== row.deliveryAssociate)
        );
      }
    }
  }
});

test("10-hour bonus CSV and Excel are delivery-associate first", () => {
  const list = getBonusList();
  const csv = bonusCsv(list);
  assert.equal(csv.filename, "10-hour-bonus-week-38-by-da.csv");
  const lines = csvLines(csv.csv);
  assert.equal(lines.length - 1, 215);
  assert.equal(lines[0], "date,deliveryAssociate,stopsCompleted,route,multiTransporter,coDrivers");
  assert.match(csv.csv, /2026-09-13,Makayla Cooper,199,CX1,no,/);
  assert.match(csv.csv, /2026-09-13,DeAndre Adams,183,CX2,yes,Jayden Williams/);
  assert.match(csv.csv, /darome boyland/);
  assert.doesNotMatch(csv.csv, /\$/);

  const excel = bonusExcel(list);
  assert.equal(excel.filename, "10-hour-bonus-week-38-by-da.xls");
  assert.match(excel.xml, /<Worksheet ss:Name="10 Hour Bonus">/);
  assert.match(excel.xml, /deliveryAssociate/);
  assert.match(excel.xml, /DeAndre Adams/);
  assert.match(excel.xml, /<Data ss:Type="Number">199<\/Data>/);
  assert.equal((excel.xml.match(/<Row>/g) ?? []).length, 216);
});
