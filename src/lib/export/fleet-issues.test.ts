import assert from "node:assert/strict";
import test from "node:test";
import { loadFleetIssueCatalog, loadFleetIssueSnapshots } from "@/lib/data/fleet-issues";
import { csvLines } from "@/lib/export/csv";
import { buildFleetIssueDayReport } from "@/lib/fleet-issues/detect";
import { newDamageCsv, newDamageExcel } from "./fleet-issues";

test("new-damage CSV and Excel list the Oct 14 inspection defects apart from maintenance", () => {
  const catalog = loadFleetIssueCatalog();
  assert.equal(catalog.previous?.date, "2026-10-15");
  const october14 = loadFleetIssueSnapshots().find((snapshot) => snapshot.date === "2026-10-14");
  assert.ok(october14);
  assert.equal(october14.date, "2026-10-14");
  const report = buildFleetIssueDayReport({
    current: october14.issues,
    previous: null,
    day: "2026-10-14",
  });
  const csv = newDamageCsv(report, "DNA4");
  const excel = newDamageExcel(report, "DNA4");
  assert.equal(csv.filename, "new-damage-dna4-2026-10-14.csv");
  assert.equal(excel.filename, "new-damage-dna4-2026-10-14.xls");

  const damageTitle = csv.csv.indexOf("New inspection damage");
  const otherTitle = csv.csv.indexOf("Other issues created this day");
  assert.ok(damageTitle >= 0 && otherTitle > damageTitle);
  const damageSection = csv.csv.slice(damageTitle, otherTitle);
  const otherSection = csv.csv.slice(otherTitle);
  assert.match(damageSection, /Station,Row,Vehicle/);
  assert.match(damageSection, /DNA4,.*EDV 20/);
  assert.match(damageSection, /EDV 20/);
  assert.match(damageSection, /Y142870/);
  assert.match(damageSection, /Van 24/);
  assert.match(damageSection, /15DLEA/);
  assert.match(damageSection, /2026-10-14T19:01:00-05:00/);
  assert.match(damageSection, /AVI · AVI SCANNER/);
  assert.match(damageSection, /Damage found after driver checks passed/);
  assert.doesNotMatch(damageSection, /Self reported maintenance/);
  assert.doesNotMatch(damageSection, /Light repair/);
  assert.match(otherSection, /Self reported maintenance/);
  assert.match(otherSection, /Light repair/);
  assert.match(otherSection, /Keys/);
  assert.equal(csvLines(damageSection).length - 2, 2);

  assert.match(excel.xml, /<Worksheet ss:Name="New damage">/);
  assert.match(excel.xml, /<Worksheet ss:Name="Other issues">/);
  const newSheet = excel.xml.slice(excel.xml.indexOf('ss:Name="New damage"'), excel.xml.indexOf('ss:Name="Other issues"'));
  const otherSheet = excel.xml.slice(excel.xml.indexOf('ss:Name="Other issues"'));
  assert.match(newSheet, />Station</);
  assert.match(newSheet, />DNA4</);
  assert.match(newSheet, /Y142870/);
  assert.match(newSheet, /15DLEA/);
  assert.match(newSheet, /7FCEHEB23SN031818/);
  assert.match(newSheet, /1FTBR1C88PKB49079/);
  assert.doesNotMatch(newSheet, /Self reported maintenance|Light repair/);
  assert.match(otherSheet, /Self reported maintenance/);
  assert.match(otherSheet, /Keys/);
});
