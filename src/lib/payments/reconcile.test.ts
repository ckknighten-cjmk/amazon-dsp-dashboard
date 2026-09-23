import assert from "node:assert/strict";
import test from "node:test";
import { getPaymentsSnapshot } from "../data/payments";
import { reconcileToCsv, reconcileToExcel } from "./reconcile-export";
import { getWeekReconcile, normalizeServiceLabel, parseReconcileWeek } from "./reconcile";

test("parseReconcileWeek defaults to 37 and accepts 38 and 39", () => {
  assert.equal(parseReconcileWeek(undefined), 37);
  assert.equal(parseReconcileWeek("38"), 38);
  assert.equal(parseReconcileWeek(["39"]), 39);
  assert.equal(parseReconcileWeek("36"), 37);
});

test("Week 37 payments rollup matches the variable invoice sections", () => {
  const payments = getPaymentsSnapshot();
  assert.equal(payments.week37Variable.invoiceId, "INV-GA6T0P-0000000614");
  assert.equal(payments.week37Variable.total, 88556.7);
  assert.deepEqual(
    payments.week37Variable.lines.map((line) => [line.label, line.qty, line.amount]),
    [
      ["Routes", 240, 78886],
      ["Training sessions", 9, 2008.8],
      ["Late cancellations", 5, 1000],
      ["Unplanned delay", 0, 12.02],
      ["Packages", 55428, 6649.88],
    ]
  );
});

test("Week 37 reconcile keeps unit mismatches comparable only when the unit is shared", () => {
  const report = getWeekReconcile(37);
  assert.equal(report.invoiceListed, true);
  assert.equal(report.invoice?.total, "$88,556.70");
  assert.equal(report.invoice?.totalCents, 8855670);
  assert.equal(report.workSummary.totalPackages, 5335);
  assert.equal(report.workSummary.deliveredPackages, 5333);
  assert.equal(report.workSummary.completedRoutes, 31);

  const routes = row(report, "routes");
  assert.equal(routes.status, "not_comparable");
  assert.equal(routes.variance, null);
  assert.match(routes.invoice.text, /240 route payments/);
  assert.match(routes.workSummary.text, /31 routes completed/);
  assert.equal(routes.workSummary.text.includes("$"), false);

  const packages = row(report, "packages");
  assert.equal(packages.status, "not_comparable");
  assert.equal(packages.variance, null);
  assert.match(packages.invoice.text, /55,428 package units/);
  assert.match(packages.workSummary.text, /5,335 packages/);
  assert.match(packages.note, /different package definitions/);

  const delays = row(report, "unplanned-delay-count");
  assert.equal(delays.status, "match");
  assert.equal(delays.variance, 0);

  const late = row(report, "amzl-late-cancels");
  assert.equal(late.status, "mismatch");
  assert.equal(late.variance, 4);
  assert.match(late.invoice.text, /\$1,000\.00/);
  assert.equal(late.workSummary.text.includes("$"), false);

  assert.deepEqual(report.counts, { match: 1, mismatch: 1, notComparable: 10 });
  assert.equal(
    report.rows.some((item) => item.workSummary.text.includes("$")),
    false
  );

  const rivian = report.serviceRows.find((item) => item.id.includes("rivian medium - 10 hr") && !item.id.includes("recycle"));
  assert.ok(rivian);
  assert.equal(rivian.invoiceRoutePayments, 204);
  assert.equal(rivian.invoiceAmountCents, 6_630_000);
  assert.equal(rivian.completedRoutes, 30);
  assert.equal(rivian.status, "not_comparable");

  const van = report.serviceRows.find((item) => item.label.includes("Custom Delivery Van 12ft"));
  assert.equal(van?.invoiceRoutePayments, 7);
  assert.equal(van?.completedRoutes, 1);

  const recycle = report.serviceRows.find((item) => item.label.toLowerCase().includes("recycle"));
  assert.equal(recycle?.invoiceRoutePayments, null);
  assert.equal(recycle?.completedRoutes, 0);

  assert.equal(
    normalizeServiceLabel("Standard Parcel Electric - Rivian MEDIUM - Block of 10 Hours"),
    normalizeServiceLabel("Standard Parcel Electric - Rivian MEDIUM - 10 hr")
  );
  assert.notEqual(
    normalizeServiceLabel("Standard Parcel Electric - Rivian MEDIUM - Recycle - 10 hr"),
    normalizeServiceLabel("Standard Parcel Electric - Rivian MEDIUM - Block of 10 Hours")
  );

  const amountGaps = report.checks.filter(
    (check) => check.kind === "gap" && (check.id.startsWith("amount-") || check.id.startsWith("rate-") || check.id.startsWith("qty-"))
  );
  assert.deepEqual(amountGaps, []);
  assert.equal(report.checks.find((check) => check.id === "invoice-total")?.kind, "holds");
  assert.equal(report.checks.find((check) => check.id === "package-composition")?.kind, "holds");
  assert.equal(report.checks.find((check) => check.id === "delay-qty")?.kind, "gap");
  assert.equal(report.checks.find((check) => check.id === "ws-delivered-rows")?.kind, "gap");
  assert.match(report.insight, /does not convert/);
});

test("Weeks 38 and 39 keep Work Summary and leave the variable invoice unlisted", () => {
  const week38 = getWeekReconcile(38);
  assert.equal(week38.invoiceListed, false);
  assert.equal(week38.invoice, null);
  assert.equal(week38.workSummary.totalPackages, 7865);
  assert.equal(week38.workSummary.completedRoutes, 34);
  assert.equal(week38.workSummary.miles, 2410);
  assert.match(week38.listingNote, /Week 38 and Week 39/);
  assert.ok(week38.rows.every((item) => item.status === "not_comparable" && item.variance == null));
  assert.ok(week38.rows.every((item) => item.invoice.text === "Not yet listed"));
  assert.equal(week38.serviceRows.length > 0, true);
  assert.equal(week38.serviceRows.every((item) => item.invoiceAmountCents == null), true);
  assert.equal(reconcileToCsv(week38).includes("$"), false);

  const week39 = getWeekReconcile(39);
  assert.equal(week39.invoice, null);
  assert.equal(week39.workSummary.totalPackages, 0);
  assert.equal(week39.workSummary.completedRoutes, 0);
  assert.equal(week39.serviceRows.length, 0);
  assert.match(week39.workSummary.notes, /week in progress/);
  assert.equal(reconcileToCsv(week39).includes("$"), false);
  assert.equal(
    week39.rows.some((item) => item.workSummary.text.includes("$")),
    false
  );
});

test("CSV and Excel exports use the reconcile rows and do not price Work Summary", () => {
  const report = getWeekReconcile(37);
  const csv = reconcileToCsv(report);
  const table = parseCsv(csv);
  const header = table[0];
  assert.deepEqual(header, [
    "Week",
    "Period",
    "Group",
    "Field",
    "Invoice",
    "Work Summary",
    "Status",
    "Variance",
    "Note",
  ]);
  const routes = table.find((cells) => cells[2] === "Summary" && cells[3] === "Routes");
  assert.ok(routes);
  assert.match(routes[4], /240 route payments/);
  assert.match(routes[5], /31 routes completed/);
  assert.equal(routes[6], "Not comparable");
  assert.equal(routes[7], "");
  assert.equal(routes[5].includes("$"), false);

  const late = table.find((cells) => cells[2] === "Summary" && cells[3] === "AMZL late cancels");
  assert.equal(late?.[6], "Mismatch");
  assert.match(late?.[7] ?? "", /^\+4 /);

  const workSummaryColumn = header.indexOf("Work Summary");
  assert.equal(
    table.slice(1).some((cells) => cells[workSummaryColumn]?.includes("$")),
    false
  );

  const excel = reconcileToExcel(report);
  assert.match(excel, /<Worksheet ss:Name="Reconcile">/);
  assert.match(excel, /240 route payments/);
  assert.match(excel, /31 routes completed/);
  assert.equal(excel.includes("66,300"), true);
});

function row(report: ReturnType<typeof getWeekReconcile>, id: string) {
  const found = report.rows.find((item) => item.id === id);
  assert.ok(found, id);
  return found;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let record: string[] = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      record.push(cell);
      cell = "";
    } else if (char === "\n") {
      record.push(cell.replace(/\r$/, ""));
      rows.push(record);
      record = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  return rows.filter((cells) => cells.length > 1 || cells[0] !== "");
}
