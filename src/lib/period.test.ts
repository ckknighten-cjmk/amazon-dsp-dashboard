import assert from "node:assert/strict";
import { describe, it } from "node:test";
import paymentsSeed from "./data/seed/payments-settlements-2026-09-21.json";
import scheduleWeek38 from "./data/seed/week38-amazon-schedule.json";
import scheduleWeek39 from "./data/seed/week39-amazon-schedule.json";
import scheduleWeek41 from "./data/seed/week41-amazon-schedule.json";
import scheduleWeek42 from "./data/seed/week42-amazon-schedule.json";
import scheduleWeek43 from "./data/seed/week43-amazon-schedule.json";
import {
  BONUS_COVERAGE,
  boundsOf,
  COMPLIANCE_COVERAGE,
  dateInRange,
  datesInRange,
  DELIVERY_COVERAGE,
  DVIC_COVERAGE,
  deserializePeriod,
  formatRangeLabel,
  hrefWithPeriod,
  invoiceServiceWindow,
  parsePeriodParam,
  rangesOverlap,
  routeUsesPeriod,
  SCORECARD_COVERAGE,
  serializePeriod,
  STATION_TODAY,
  WORK_SUMMARY_COVERAGE,
  workSummaryWeekForRange,
} from "./period";

describe("period bounds", () => {
  it("maps today and this week to the frozen station clock", () => {
    assert.deepEqual(boundsOf({ kind: "today" }), {
      start: STATION_TODAY,
      end: STATION_TODAY,
    });
    assert.deepEqual(boundsOf({ kind: "week" }), {
      start: "2026-10-15",
      end: "2026-10-21",
    });
    assert.equal(formatRangeLabel({ kind: "today" }), "Today · Wed Oct 21");
    assert.equal(formatRangeLabel({ kind: "week" }), "This week · Oct 15–21");
  });

  it("orders a custom range and rejects dates that are not real", () => {
    assert.deepEqual(boundsOf({ kind: "custom", start: "2026-10-19", end: "2026-09-06" }), {
      start: "2026-09-06",
      end: "2026-10-19",
    });
    assert.equal(parsePeriodParam("custom", "2026-02-31", "2026-03-01"), null);
    assert.equal(parsePeriodParam("custom", "09-21-2026", "2026-09-22"), null);
    assert.deepEqual(deserializePeriod(serializePeriod({ kind: "custom", start: "2026-10-19", end: "2026-09-06" })), {
      kind: "custom",
      start: "2026-09-06",
      end: "2026-10-19",
    });
  });

  it("keeps the compliance week query when writing the period", () => {
    assert.equal(
      hrefWithPeriod("/compliance?week=39", { kind: "week" }),
      "/compliance?week=39&period=week"
    );
    assert.equal(
      hrefWithPeriod("/payments?week=38", { kind: "today" }),
      "/payments?week=38&period=today"
    );
    assert.equal(
      hrefWithPeriod("/compliance", { kind: "custom", start: "2026-09-21", end: "2026-09-21" }),
      "/compliance?period=custom&start=2026-09-21&end=2026-09-21"
    );
    assert.equal(
      hrefWithPeriod("/scorecard?week=37", {
        kind: "custom",
        start: "2026-09-06",
        end: "2026-09-12",
      }),
      "/scorecard?week=37&period=custom&start=2026-09-06&end=2026-09-12"
    );
    assert.equal(routeUsesPeriod("/bonus"), true);
  });
});

describe("seed coverage", () => {
  it("keeps the Oct 18 DVIC coverage off the Oct 21 delivery clock", () => {
    assert.equal(DVIC_COVERAGE.start, "2026-10-18");
    assert.equal(DVIC_COVERAGE.end, "2026-10-18");
    assert.match(DVIC_COVERAGE.label, /Oct 18/);
    assert.equal(dateInRange(DVIC_COVERAGE.start, { kind: "today" }), false);
    assert.equal(
      dateInRange(DVIC_COVERAGE.start, { kind: "custom", start: "2026-09-23", end: "2026-09-23" }),
      false
    );
  });

  it("shows delivery metrics only when the range includes Oct 21", () => {
    assert.equal(dateInRange(DELIVERY_COVERAGE.start, { kind: "today" }), true);
    assert.equal(rangesOverlap(DELIVERY_COVERAGE.start, DELIVERY_COVERAGE.end, { kind: "week" }), true);
    assert.equal(
      rangesOverlap(DELIVERY_COVERAGE.start, DELIVERY_COVERAGE.end, {
        kind: "custom",
        start: "2026-09-06",
        end: "2026-09-12",
      }),
      false
    );
  });

  it("aligns scorecard and compliance weeks with the schedule seeds", () => {
    assert.equal(
      rangesOverlap(SCORECARD_COVERAGE[37].start, SCORECARD_COVERAGE[37].end, { kind: "today" }),
      false
    );
    assert.equal(
      rangesOverlap(SCORECARD_COVERAGE[37].start, SCORECARD_COVERAGE[37].end, {
        kind: "custom",
        start: "2026-09-10",
        end: "2026-09-10",
      }),
      true
    );
    assert.equal(
      rangesOverlap(SCORECARD_COVERAGE[38].start, SCORECARD_COVERAGE[38].end, {
        kind: "custom",
        start: "2026-09-13",
        end: "2026-09-19",
      }),
      true
    );
    assert.equal(
      rangesOverlap(SCORECARD_COVERAGE[38].start, SCORECARD_COVERAGE[38].end, {
        kind: "custom",
        start: "2026-09-06",
        end: "2026-09-12",
      }),
      false
    );
    assert.equal(SCORECARD_COVERAGE[38].start, BONUS_COVERAGE.start);
    assert.equal(SCORECARD_COVERAGE[38].end, WORK_SUMMARY_COVERAGE[38].end);
    assert.equal(
      rangesOverlap(BONUS_COVERAGE.start, BONUS_COVERAGE.end, { kind: "today" }),
      false
    );
    assert.equal(
      workSummaryWeekForRange({ kind: "custom", start: "2026-09-13", end: "2026-09-19" }),
      38
    );
    assert.equal(
      workSummaryWeekForRange({ kind: "custom", start: "2026-09-06", end: "2026-09-12" }),
      37
    );
    // Oct 21 station week is Oct 15–21, which does not overlap Weeks 37–39.
    assert.equal(workSummaryWeekForRange({ kind: "week" }), null);
    assert.equal(workSummaryWeekForRange({ kind: "today" }), null);

    for (const week of [38, 39, 41, 42, 43] as const) {
      const schedule =
        week === 38
          ? scheduleWeek38
          : week === 39
            ? scheduleWeek39
            : week === 41
              ? scheduleWeek41
              : week === 42
                ? scheduleWeek42
                : scheduleWeek43;
      const dates = schedule.associates[0]?.days.map((day) => day.date) ?? [];
      assert.equal(dates[0], COMPLIANCE_COVERAGE[week].start);
      assert.equal(dates[dates.length - 1], COMPLIANCE_COVERAGE[week].end);
    }

    assert.deepEqual(datesInRange(["2026-10-19", "2026-10-20", "2026-10-21"], { kind: "today" }), [
      "2026-10-21",
    ]);
  });

  it("parses every Console invoice service window without using the invoice date as the span", () => {
    const windows = Object.fromEntries(
      paymentsSeed.invoices.map((invoice) => [invoice.id, invoiceServiceWindow(invoice.periodLabel)])
    );
    assert.deepEqual(windows["INV-GA6T0P-0000000615"], {
      start: "2026-09-06",
      end: "2026-09-12",
    });
    assert.deepEqual(windows["INV-GA6T0P-0000000614"], {
      start: "2026-09-06",
      end: "2026-09-12",
    });
    assert.deepEqual(windows["INV-GA6T0P-0000000613"], {
      start: "2026-09-01",
      end: "2026-09-30",
    });
    assert.deepEqual(windows["INV-USGA6T0P-0000000612"], {
      start: "2026-08-01",
      end: "2026-08-31",
    });
    assert.deepEqual(windows["INV-GA6T0P-0000000610"], {
      start: "2026-08-30",
      end: "2026-09-05",
    });
    assert.deepEqual(windows["INV-GA6T0P-0000000609"], {
      start: "2026-08-30",
      end: "2026-09-05",
    });
    assert.deepEqual(windows["INV-USGA6T0P-0000000608"], {
      start: "2026-09-01",
      end: "2026-09-30",
    });
    assert.deepEqual(windows["INV-GA6T0P-0000000607"], {
      start: "2026-08-23",
      end: "2026-08-29",
    });
    assert.deepEqual(windows["INV-GA6T0P-0000000603"], {
      start: "2026-08-16",
      end: "2026-08-22",
    });
    assert.deepEqual(windows["INV-GA6T0P-0000000606"], {
      start: "2026-08-16",
      end: "2026-08-22",
    });

    const todayIds = paymentsSeed.invoices
      .filter((invoice) => {
        const window = invoiceServiceWindow(invoice.periodLabel);
        return window ? rangesOverlap(window.start, window.end, { kind: "today" }) : false;
      })
      .map((invoice) => invoice.id);
    // Oct 21 is after every seeded invoice window, including the Sep 1–30 spans.
    assert.deepEqual(todayIds, []);
  });
});
