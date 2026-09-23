import { getDrivers, getExceptions, getPayments, getRoutes, getScorecard, getVehicles } from "@/lib/data";
import { rosterSourceLabel } from "@/lib/data/roster";
import {
  formatCompletionPct,
  formatScorecardValue,
  formatUsd,
  routeStatusLabel,
  scorecardTierLabel,
  vehicleStatusLabel,
  vehicleTypeLabel,
} from "@/lib/format";
import { gradeMetric } from "@/lib/scorecard";
import type { Driver, Route, ScorecardMetric } from "@/lib/types";
import { datasetFilename, toCsv, toSectionedCsv, type CsvValue } from "@/lib/export/csv";

const ROSTER_STAMP = "weeks-38-39";
const SERVICE_DAY = "2026-09-21";
const SCORECARD_STAMP = "week-37";
const PAYMENTS_STAMP = "2026-09-21";

export interface CsvFile {
  filename: string;
  csv: string;
}

function driverRouteCodes(driver: Driver, routes: Route[]) {
  const byId = new Map(routes.map((route) => [route.id, route.code]));
  return driver.routeIds.map((id) => byId.get(id) ?? id);
}

function rescuerNames(route: Route, nameOf: (id: string) => string | undefined) {
  return route.rescueDriverIds.map((id) => nameOf(id) ?? id).join("; ");
}

export function associatesCsv(): CsvFile {
  const drivers = getDrivers();
  const routes = getRoutes();
  const headers = [
    "Name",
    "Transporter ID",
    "ADP name",
    "Source",
    "Schedule weeks",
    "Role",
    "Status",
    "Today packages",
    "Today stops",
    "Routes",
    "On Sep 21 board",
  ];
  const rows = drivers.map((driver) => [
    driver.name,
    driver.transporterId ?? "",
    driver.adpName ?? "",
    rosterSourceLabel(driver),
    (driver.scheduleWeeks ?? []).join("; "),
    driver.role,
    driver.status,
    driver.todayPackages,
    driver.todayStops,
    driverRouteCodes(driver, routes).join("; "),
    driver.routeIds.length > 0 ? "Yes" : "No",
  ]);
  return {
    filename: datasetFilename("associates-roster", ROSTER_STAMP),
    csv: toCsv(headers, rows),
  };
}

export function routesCsv(): CsvFile {
  const routes = getRoutes();
  const drivers = getDrivers();
  const nameOf = (id: string) => drivers.find((driver) => driver.id === id || driver.aliasIds?.includes(id))?.name;
  const headers = [
    "Route",
    "Primary associate",
    "Associates",
    "Rescue",
    "Rescuers",
    "Rescue basis",
    "Stops done",
    "Stops planned",
    "Packages delivered",
    "Packages planned",
    "Remaining",
    "Status",
    "Completion",
    "Notes",
  ];
  const rows = routes.map((route) => {
    const names = route.associateIds.map((id) => nameOf(id) ?? id);
    return [
      route.code,
      names[0] ?? "",
      names.join("; "),
      route.receivedRescue ? "Yes" : "No",
      route.receivedRescue ? rescuerNames(route, nameOf) : "",
      route.receivedRescue ? "Multi-associate route; not an Amazon rescueActions flag" : "",
      route.completedStops,
      route.stopCount,
      route.packagesDelivered,
      route.packageCount,
      route.packagesRemaining,
      routeStatusLabel[route.status],
      formatCompletionPct(route.progressPct),
      route.notes ?? "",
    ];
  });
  return {
    filename: datasetFilename("routes", SERVICE_DAY),
    csv: toCsv(headers, rows),
  };
}

export function vehiclesCsv(): CsvFile {
  const headers = [
    "Unit",
    "Plate",
    "VIN",
    "Make/model",
    "Ownership",
    "Type",
    "Status",
    "Year",
    "Mileage",
    "Last inspection",
    "Notes",
    "Source",
  ];
  const rows = getVehicles().map((van) => [
    van.unitId,
    van.plate,
    van.vin ?? "",
    van.makeModel ?? "",
    van.ownership ?? "",
    vehicleTypeLabel[van.type],
    vehicleStatusLabel[van.status],
    van.year ?? "",
    van.mileage ?? "",
    van.lastInspection ?? "",
    van.notes ?? "",
    van.origin === "console" ? "Amazon DSP Console My vehicles" : "Mock yard roster",
  ]);
  const stamp = getVehicles().some((van) => van.origin === "console") ? "dna4" : "mock";
  return {
    filename: datasetFilename("fleet-vehicles", stamp),
    csv: toCsv(headers, rows),
  };
}

export function exceptionsCsv(): CsvFile {
  const headers = [
    "Scannable ID",
    "Route",
    "Transporter",
    "Transporter ID",
    "Address",
    "Status",
    "Reason",
    "Last scan",
  ];
  const rows = getExceptions().map((row) => [
    row.scannableId,
    row.routeCode,
    row.transporterName,
    row.transporterId ?? "",
    row.address,
    row.status,
    row.reasonCode,
    row.lastScan ?? "",
  ]);
  return {
    filename: datasetFilename("package-exceptions", SERVICE_DAY),
    csv: toCsv(headers, rows),
  };
}

function standingLabel(metric: ScorecardMetric) {
  if (metric.unit === "unavailable") return "No data";
  if (metric.unit === "compliance") {
    if (metric.compliance === "compliant") return "Compliant";
    if (metric.compliance === "noncompliant") return "Noncompliant";
    return "No data";
  }
  const tier = gradeMetric(metric);
  return tier ? scorecardTierLabel[tier] : "No data";
}

export function scorecardCsv(): CsvFile {
  const scorecard = getScorecard();
  const headers = ["Row", "Name", "Category", "Value", "Standing", "Prior week"];
  const rows: CsvValue[][] = [
    [
      "Overall",
      "Overall standing",
      "",
      scorecard.overallScore.toFixed(1),
      scorecardTierLabel[scorecard.overallTier],
      "Not shown in Console",
    ],
    ...scorecard.categories.map((category) => [
      "Category",
      category.name,
      category.name,
      "",
      scorecardTierLabel[category.tier],
      "Not shown in Console",
    ]),
    ...scorecard.metrics.map((metric) => [
      "Metric",
      metric.name,
      scorecard.categories.find((category) => category.id === metric.category)?.name ?? metric.category,
      formatScorecardValue(metric),
      standingLabel(metric),
      "Not shown in Console",
    ]),
  ];
  return {
    filename: datasetFilename("scorecard", SCORECARD_STAMP),
    csv: toCsv(headers, rows),
  };
}

export function paymentsCsv(): CsvFile {
  const payments = getPayments();
  const ytd = payments.ytdInsights;
  const variable = payments.week37Variable;
  const incentive = payments.week37Incentive;
  return {
    filename: datasetFilename("payments-settlements", PAYMENTS_STAMP),
    csv: toSectionedCsv([
      {
        title: "Invoices",
        headers: ["Invoice", "Period", "Week", "Type", "Status", "Amount"],
        rows: payments.invoices.map((invoice) => [
          invoice.id,
          invoice.periodLabel,
          invoice.week ?? "",
          invoice.kind,
          invoice.status,
          formatUsd(invoice.amount),
        ]),
      },
      {
        title: "Week 37 variable lines",
        headers: ["Invoice", "Status", "Line", "Qty", "Amount"],
        rows: variable.lines.map((line) => [
          variable.invoiceId,
          variable.status,
          line.label,
          line.qty ?? "",
          formatUsd(line.amount),
        ]),
      },
      {
        title: "Week 37 incentive",
        headers: ["Invoice", "Status", "Amount", "Notes"],
        rows: [[incentive.invoiceId, incentive.status, formatUsd(incentive.total), incentive.notes]],
      },
      {
        title: `YTD Insights ${ytd.yearAsShownInConsole}`,
        headers: ["Station", "Year as shown", "Line", "Amount"],
        rows: [
          [ytd.station, ytd.yearAsShownInConsole, "Total revenue", formatUsd(ytd.totalRevenue, 0)],
          [ytd.station, ytd.yearAsShownInConsole, "Variable payment", formatUsd(ytd.variablePayment, 0)],
          [ytd.station, ytd.yearAsShownInConsole, "Fixed monthly", formatUsd(ytd.fixedMonthly, 0)],
          [ytd.station, ytd.yearAsShownInConsole, "Per piece + DXI", formatUsd(ytd.perPiecePlusDxi, 0)],
          [ytd.station, ytd.yearAsShownInConsole, "Other", formatUsd(ytd.other, 0)],
        ],
      },
    ]),
  };
}
