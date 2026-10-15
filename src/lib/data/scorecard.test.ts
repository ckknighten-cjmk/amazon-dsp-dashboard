import assert from "node:assert/strict";
import test from "node:test";
import { formatOverallScore, formatScorecardValue } from "../format";
import { gradeMetric } from "../scorecard";
import {
  DEFAULT_SCORECARD_WEEK,
  getScorecardSnapshot,
  newestScorecardCapturedAt,
  parseScorecardWeek,
  scorecardWeekHref,
  scorecardWeekOptions,
} from "./scorecard";

test("Week 38 keeps the Console capture and prefers the fresher timestamp", () => {
  assert.equal(parseScorecardWeek("38"), 38);
  assert.equal(parseScorecardWeek("37"), 37);
  assert.equal(parseScorecardWeek("39"), 39);
  const week38 = getScorecardSnapshot(38);
  assert.equal(week38.asOf, "2026-09-23T12:01:44.632799Z");
  assert.equal(week38.weekNumber, 38);
  assert.equal(week38.periodLabel, "Sep 13–19, 2026");
  assert.equal(week38.overallScore, 84);
  assert.equal(week38.overallTier, "fantastic");
  assert.equal(formatOverallScore(week38.overallScore), "84");
  assert.match(week38.disclaimer, /Week 38 Sep 13–19 DNA4 from Console Performance Summary/);
  assert.ok(week38.categories.every((category) => category.tier === "fantastic"));
  assert.equal(week38.priorWeekLabel, null);
  assert.ok(week38.metrics.every((metric) => metric.prior == null));

  const byId = Object.fromEntries(week38.metrics.map((metric) => [metric.id, metric]));
  assert.equal(byId["on-road-safety"].current, null);
  assert.equal(byId["on-road-safety"].reportedTier, "fantastic");
  assert.equal(byId["safe-driving"].unit, "unavailable");
  assert.equal(byId["safe-driving"].current, null);
  assert.equal(byId["safe-driving"].reportedTier, null);
  assert.equal(byId.seatbelt.current, 0);
  assert.equal(byId.speeding.current, 3.6);
  assert.equal(byId.speeding.reportedTier, "fantastic");
  assert.equal(byId.speeding.thresholds, null);
  assert.equal(byId.distractions.current, 2.3);
  assert.equal(byId.following.current, 0);
  assert.equal(byId["sign-signal"].current, 1.8);
  assert.equal(byId["working-device"].unit, "unavailable");
  assert.equal(byId.boc.compliance, "compliant");
  assert.equal(byId.audit.compliance, "compliant");
  assert.equal(byId["dcr-dpmo"].current, 4166.9);
  assert.equal(byId["dcr-dpmo"].reportedTier, "great");
  assert.equal(byId["dcr-dpmo"].thresholds, null);
  assert.equal(gradeMetric(byId["dcr-dpmo"]), "great");
  assert.equal(formatScorecardValue(byId["dcr-dpmo"]), "4,166.9 DPMO");
  assert.equal(byId.dsb.current, 119);
  assert.equal(byId["ced-dpmo"].current, 0);
  assert.equal(byId["cdf-dpmo"].current, 1360);
  assert.equal(byId["cdf-dpmo"].reportedTier, "great");
  assert.equal(byId.pod.current, 99.46);
  assert.equal(formatScorecardValue(byId.pod), "99.46%");
  assert.equal(byId.psb.current, 0);
  assert.equal(byId["fleet-exec"].current, 2.22);
  assert.equal(byId.tenured.current, 94.01);
  assert.equal(formatScorecardValue(byId.tenured), "94.01%");
});

test("Week 37 scorecard stays on the Sep 6–12 capture", () => {
  const week37 = getScorecardSnapshot(37);
  assert.equal(week37.overallScore, 85.8);
  assert.equal(formatOverallScore(week37.overallScore), "85.8");
  assert.equal(week37.metrics.find((metric) => metric.id === "dcr-dpmo")?.current, 1953.7);
  assert.equal(week37.metrics.find((metric) => metric.id === "dcr-dpmo")?.reportedTier, "fantastic");
  assert.equal(week37.metrics.find((metric) => metric.id === "speeding")?.current, 1.4);
  assert.ok(week37.metrics.find((metric) => metric.id === "speeding")?.thresholds);
  assert.match(week37.disclaimer, /Week 37/);
  assert.doesNotMatch(week37.disclaimer, /Week 38/);
  assert.equal(week37.asOf, "2026-10-15T03:34:55Z");
});

test("the scorecard week selector defaults to Week 41 and lists every Console week", () => {
  assert.equal(DEFAULT_SCORECARD_WEEK, 41);
  assert.equal(parseScorecardWeek(undefined), 41);
  assert.equal(parseScorecardWeek(null), 41);
  assert.equal(parseScorecardWeek(""), 41);
  const options = scorecardWeekOptions();
  assert.equal(options.length, 52);
  assert.equal(options[0]?.week, 41);
  assert.equal(options[0]?.label, "Week 41 · Oct 4 – Oct 10, 2026");
  assert.deepEqual(
    options.slice(0, 3).map((option) => option.week),
    [41, 40, 39]
  );
  const week41 = getScorecardSnapshot();
  assert.equal(week41.weekNumber, 41);
  assert.equal(week41.periodLabel, "Oct 4–10, 2026");
  assert.equal(week41.overallScore, 82.7);
  assert.equal(week41.overallTier, "fantastic");
  assert.equal(week41.overallNote ?? null, null);
  assert.equal(week41.asOf, "2026-10-15T03:25:18Z");
  assert.equal(newestScorecardCapturedAt(), week41.asOf);
  assert.equal(week41.metrics.find((metric) => metric.id === "safe-driving")?.unit, "unavailable");
  assert.equal(formatScorecardValue(week41.metrics.find((metric) => metric.id === "safe-driving")!), "No data");
  assert.equal(week41.metrics.find((metric) => metric.id === "distractions")?.current, 5.6);
  assert.equal(week41.metrics.find((metric) => metric.id === "distractions")?.reportedTier, "great");
  assert.equal(week41.metrics.find((metric) => metric.id === "cdf-dpmo")?.current, 1642);
  assert.equal(week41.metrics.find((metric) => metric.id === "cdf-dpmo")?.reportedTier, "fair");
  assert.equal(options.filter((option) => option.week === 42 && option.year === 2026).length, 0);
});

test("switching scorecard weeks changes the standing and the link", () => {
  const week41 = getScorecardSnapshot(41);
  const week3 = getScorecardSnapshot(3);
  const week39 = getScorecardSnapshot(39);
  assert.equal(scorecardWeekHref(41), "/scorecard?week=41");
  assert.equal(scorecardWeekHref(3), "/scorecard?week=3");
  assert.equal(week3.overallScore, 86.5);
  assert.equal(week3.overallTier, "fantastic_plus");
  assert.equal(week39.overallScore, 48.9);
  assert.equal(week39.overallTier, "fair");
  assert.notEqual(week41.overallScore, week3.overallScore);
  assert.equal(parseScorecardWeek("3"), 3);
  assert.equal(parseScorecardWeek(["39", "41"]), 39);
});

test("2025 scorecard weeks are labeled with the year", () => {
  const options = scorecardWeekOptions();
  const year2025 = options.filter((option) => option.year === 2025);
  assert.equal(year2025.length, 11);
  assert.deepEqual(
    year2025.map((option) => option.week),
    [52, 51, 50, 49, 48, 47, 46, 45, 44, 43, 42]
  );
  assert.ok(year2025.every((option) => option.label.includes("2025")));
  const week42 = year2025.find((option) => option.week === 42);
  assert.equal(week42?.label, "Week 42 · Oct 12 – Oct 18, 2025");
  assert.equal(getScorecardSnapshot(42).overallScore, 69.9);
  assert.equal(getScorecardSnapshot(42).overallTier, "great");
  assert.match(getScorecardSnapshot(42).overallNote ?? "", /Capped for Safety & Compliance/);
  const week1 = options.find((option) => option.week === 1);
  assert.equal(week1?.year, 2026);
  assert.equal(week1?.label, "Week 1 · Dec 28, 2025 – Jan 3, 2026");
});

test("a missing scorecard week falls back to the newest week", () => {
  assert.equal(parseScorecardWeek("99"), 41);
  assert.equal(parseScorecardWeek("0"), 41);
  assert.equal(parseScorecardWeek("53"), 41);
  assert.equal(parseScorecardWeek("2026-42"), 41);
  assert.equal(parseScorecardWeek("week-42"), 41);
  assert.equal(parseScorecardWeek("nope"), 41);
  assert.equal(getScorecardSnapshot(parseScorecardWeek("100")).weekNumber, 41);
  assert.equal(getScorecardSnapshot(99).weekNumber, 41);
});
