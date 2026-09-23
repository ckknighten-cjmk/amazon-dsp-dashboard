import assert from "node:assert/strict";
import { describe, it } from "node:test";
import paymentsSeed from "./data/seed/payments-settlements-2026-09-21.json";
import scheduleWeek38 from "./data/seed/week38-amazon-schedule.json";
import scheduleWeek39 from "./data/seed/week39-amazon-schedule.json";
import {
  boundsOf,
  COMPLIANCE_COVERAGE,
  dateInRange,
  datesInRange,
  DELIVERY_COVERAGE,
  deserializePeriod,
  formatRangeLabel,
  hrefWithPeriod,
  invoiceServiceWindow,
  parsePeriodParam,
  rangesOverlap,
  SCORECARD_COVERAGE,
  serializePeriod,
  STATION_TODAY,
} from "./period";

describe("period bounds", () => {
  it("maps today and this week to the frozen station clock", () => {
    assert.deepEqual(boundsOf({ kind: "today" }), {
      start: STATION_TODAY,
      end: STATION_TODAY,
    });
    assert.deepEqual(boundsOf({ kind: "week" }), {
      start: "2026-09-15",
      end: "2026-09-21",
    });
    assert.equal(formatRangeLabel({ kind: "today" }), "Today · Mon Sep 21");
    assert.equal(formatRangeLabel({ kind: "week" }), "This week · Sep 15–21");
  });

  it("orders a custom range and rejects dates that are not real", () => {
    assert.deepEqual(boundsOf({ kind: "custom", start: "2026-09-23", end: "2026-09-06" }), {
      start: "2026-09-06",
      end: "2026-09-23",
    });
    assert.equal(parsePeriodParam("custom", "2026-02-31", "2026-03-01"), null);
    assert.equal(parsePeriodParam("custom", "09-21-2026", "2026-09-22"), null);
    assert.deepEqual(deserializePeriod(serializePeriod({ kind: "custom", start: "2026-09-23", end: "2026-09-06" })), {
      kind: "custom",
      start: "2026-09-06",
      end: "2026-09-23",
    });
  });

  it("keeps the compliance week query when writing the period", () => {
    assert.equal(
      hrefWithPeriod("/compliance?week=39", { kind: "week" }),
      "/compliance?week=39&period=week"
    );
    assert.equal(
      hrefWithPeriod("/compliance", { kind: "custom", start: "2026-09-21", end: "2026-09-21" }),
      "/compliance?period=custom&start=2026-09-21&end=2026-09-21"
    );
  });
});

describe("seed coverage", () => {
  it("shows delivery metrics only when the range includes Sep 21", () => {
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
      rangesOverlap(SCORECARD_COVERAGE.start, SCORECARD_COVERAGE.end, { kind: "today" }),
      false
    );
    assert.equal(
      rangesOverlap(SCORECARD_COVERAGE.start, SCORECARD_COVERAGE.end, {
        kind: "custom",
        start: "2026-09-10",
        end: "2026-09-10",
      }),
      true
    );

    for (const week of [38, 39] as const) {
      const schedule = week === 38 ? scheduleWeek38 : scheduleWeek39;
      const dates = schedule.associates[0]?.days.map((day) => day.date) ?? [];
      assert.equal(dates[0], COMPLIANCE_COVERAGE[week].start);
      assert.equal(dates[dates.length - 1], COMPLIANCE_COVERAGE[week].end);
    }

    assert.deepEqual(datesInRange(["2026-09-20", "2026-09-21", "2026-09-22"], { kind: "today" }), [
      "2026-09-21",
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
    assert.deepEqual(todayIds, ["INV-GA6T0P-0000000613", "INV-USGA6T0P-0000000608"]);
  });
});
