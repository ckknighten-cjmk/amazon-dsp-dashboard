/**
 * Week-level reconcile of the Amazon variable invoice and the Work Summary Tool.
 * Dollars come only from the invoice capture. Counts that use different
 * definitions are marked not comparable and do not get a variance.
 */
import { formatNumber, formatUsd } from "../format";
import invoiceWeek37 from "../data/seed/variable-invoice-week37.json";
import workWeek37 from "../data/seed/work-summary-week37.json";
import workWeek38 from "../data/seed/work-summary-week38.json";
import workWeek39 from "../data/seed/work-summary-week39.json";
import { parseUsdToCents, sumCents } from "./money";
import type {
  HeadlineCompare,
  InvoiceLineView,
  InvoiceSectionView,
  ReconcileRow,
  ReconcileSide,
  ReconcileStatus,
  ReconcileWeek,
  ServiceCompareRow,
  SourceCheck,
  WeekReconcile,
} from "./types";
import { RECONCILE_WEEKS } from "./types";

const NOT_IN_WORK_SUMMARY = "Not in Work Summary";
const NOT_ON_INVOICE = "Not on invoice";
const NOT_YET_LISTED = "Not yet listed";

const PACKAGE_BRANDING = "Payment for branding - deliveries";
const PACKAGE_DELIVERIES = "Per piece payment - deliveries";
const PACKAGE_PICKUPS = "Per piece payment - pickups";

interface SeedLine {
  label: string;
  quantity: number;
  rate: string;
  amount: string;
  date?: string;
  serviceType?: string;
}

interface SeedSection {
  name: string;
  quantityLabel: string;
  quantity: number;
  total: string;
  lineItems: SeedLine[];
}

interface SeedInvoice {
  station: string;
  invoiceType: string;
  invoiceId: string;
  period: string;
  week: string;
  status: string;
  disputeWindowCloses: string;
  total: string;
  capturedAt: string;
  navPath: string;
  sections: SeedSection[];
  reconciliation: { atAGlance: string };
  invoiceListingObservation: {
    week38OrWeek39VariableListed: boolean;
    note: string;
  };
}

interface SeedRoute {
  label: string;
  deliveredPackages: number;
  pickupPackages: number;
  providerLateCancel: number;
  amzlLateCancel: number;
  quickCoverage: number;
  accepted: number;
  completedRoutes: number;
}

interface SeedWorkSummary {
  station: string;
  serviceArea: string;
  week: number;
  period: string;
  capturedAt: string;
  navPath: string;
  summary: {
    totalPackages: number;
    deliveredPackages: number;
    pickupPackages: number;
    completedRoutes: number;
    miles: number;
    unplannedDelayCount: number;
  };
  routeSummaries: SeedRoute[];
  rates: string;
  notes: string;
}

interface InvoiceModel {
  station: string;
  invoiceType: string;
  invoiceId: string;
  period: string;
  weekLabel: string;
  status: string;
  disputeWindowCloses: string;
  total: string;
  totalCents: number;
  capturedAt: string;
  navPath: string;
  atAGlance: string;
  listingNote: string;
  week38Or39Listed: boolean;
  sections: InvoiceSectionView[];
}

interface WorkModel {
  station: string;
  serviceArea: string;
  week: ReconcileWeek;
  period: string;
  capturedAt: string;
  navPath: string;
  totalPackages: number;
  deliveredPackages: number;
  pickupPackages: number;
  completedRoutes: number;
  miles: number;
  unplannedDelayCount: number;
  ratesSentence: string;
  notes: string;
  routes: SeedRoute[];
  routeDeliveredSum: number;
  routePickupSum: number;
  routeCompletedSum: number;
  quickCoverageSum: number;
  acceptedSum: number;
}

const invoiceSeed = invoiceWeek37 as SeedInvoice;
const workSeeds: Record<ReconcileWeek, SeedWorkSummary> = {
  37: workWeek37 as SeedWorkSummary,
  38: workWeek38 as SeedWorkSummary,
  39: workWeek39 as SeedWorkSummary,
};

export function parseReconcileWeek(value: string | string[] | undefined | null): ReconcileWeek {
  const raw = Array.isArray(value) ? value[0] : value;
  const week = Number(raw);
  if ((RECONCILE_WEEKS as readonly number[]).includes(week)) return week as ReconcileWeek;
  return 37;
}

export function getWeekReconcile(week: ReconcileWeek): WeekReconcile {
  const work = readWorkSummary(workSeeds[week]);
  const invoice = week === 37 ? readInvoice(invoiceSeed) : null;
  if (invoice && invoiceSeed.invoiceListingObservation.week38OrWeek39VariableListed) {
    throw new Error("Week 38/39 listing flag changed; reconcile empty state needs a review.");
  }
  const rows = invoice ? rowsWithInvoice(invoice, work) : rowsWithoutInvoice(work);
  const serviceRows = buildServiceRows(invoice, work);
  const checks = buildChecks(invoice, work);
  assertVarianceRules(rows);
  return {
    week,
    period: work.period,
    invoiceListed: invoice != null,
    insight: insightFor(invoice, work),
    listingNote: invoiceSeed.invoiceListingObservation.note,
    counts: {
      match: rows.filter((row) => row.status === "match").length,
      mismatch: rows.filter((row) => row.status === "mismatch").length,
      notComparable: rows.filter((row) => row.status === "not_comparable").length,
    },
    invoice: invoice
      ? {
          invoiceId: invoice.invoiceId,
          invoiceType: invoice.invoiceType,
          station: invoice.station,
          period: invoice.period,
          status: invoice.status,
          disputeWindowCloses: invoice.disputeWindowCloses,
          total: invoice.total,
          totalCents: invoice.totalCents,
          capturedAt: invoice.capturedAt,
          navPath: invoice.navPath,
          sections: invoice.sections,
        }
      : null,
    workSummary: {
      station: work.station,
      serviceArea: work.serviceArea,
      period: work.period,
      capturedAt: work.capturedAt,
      navPath: work.navPath,
      totalPackages: work.totalPackages,
      deliveredPackages: work.deliveredPackages,
      pickupPackages: work.pickupPackages,
      completedRoutes: work.completedRoutes,
      miles: work.miles,
      unplannedDelayCount: work.unplannedDelayCount,
      ratesSentence: work.ratesSentence,
      notes: work.notes,
      routeDeliveredSum: work.routeDeliveredSum,
      routePickupSum: work.routePickupSum,
      routeCompletedSum: work.routeCompletedSum,
      quickCoverageSum: work.quickCoverageSum,
      acceptedSum: work.acceptedSum,
    },
    rows,
    serviceRows,
    checks,
  };
}

export function headlineCompares(report: WeekReconcile): HeadlineCompare[] {
  const packages = report.rows.find((row) => row.id === "packages");
  const routes = report.rows.find((row) => row.id === "routes");
  return [packages, routes].flatMap((row) =>
    row
      ? [{ label: row.field, invoice: row.invoice.text, workSummary: row.workSummary.text }]
      : []
  );
}

export function normalizeServiceLabel(label: string) {
  return label
    .toLowerCase()
    .replace(/block of\s+/g, "")
    .replace(/\bhours\b/g, "hr")
    .replace(/\s+/g, " ")
    .trim();
}

function readInvoice(raw: SeedInvoice): InvoiceModel {
  const sections = raw.sections.map((section) => {
    const lines: InvoiceLineView[] = section.lineItems.map((line) => ({
      date: line.date ?? null,
      label: line.label,
      serviceType: line.serviceType ?? null,
      quantity: line.quantity,
      rate: line.rate,
      amount: line.amount,
    }));
    return {
      name: section.name,
      quantityLabel: section.quantityLabel,
      quantity: section.quantity,
      total: section.total,
      totalCents: parseUsdToCents(section.total),
      lines,
    };
  });
  return {
    station: raw.station,
    invoiceType: raw.invoiceType,
    invoiceId: raw.invoiceId,
    period: raw.period,
    weekLabel: raw.week,
    status: raw.status,
    disputeWindowCloses: raw.disputeWindowCloses,
    total: raw.total,
    totalCents: parseUsdToCents(raw.total),
    capturedAt: raw.capturedAt,
    navPath: raw.navPath,
    atAGlance: raw.reconciliation.atAGlance,
    listingNote: raw.invoiceListingObservation.note,
    week38Or39Listed: raw.invoiceListingObservation.week38OrWeek39VariableListed,
    sections,
  };
}

function readWorkSummary(raw: SeedWorkSummary): WorkModel {
  const week = raw.week;
  if (week !== 37 && week !== 38 && week !== 39) {
    throw new Error(`Unexpected Work Summary week ${raw.week}.`);
  }
  const routes = raw.routeSummaries;
  return {
    station: raw.station,
    serviceArea: raw.serviceArea,
    week,
    period: raw.period,
    capturedAt: raw.capturedAt,
    navPath: raw.navPath,
    totalPackages: raw.summary.totalPackages,
    deliveredPackages: raw.summary.deliveredPackages,
    pickupPackages: raw.summary.pickupPackages,
    completedRoutes: raw.summary.completedRoutes,
    miles: raw.summary.miles,
    unplannedDelayCount: raw.summary.unplannedDelayCount,
    ratesSentence: raw.rates.split(". ")[0] + (raw.rates.includes(".") ? "." : ""),
    notes: raw.notes,
    routes,
    routeDeliveredSum: routes.reduce((total, row) => total + row.deliveredPackages, 0),
    routePickupSum: routes.reduce((total, row) => total + row.pickupPackages, 0),
    routeCompletedSum: routes.reduce((total, row) => total + row.completedRoutes, 0),
    quickCoverageSum: routes.reduce((total, row) => total + row.quickCoverage, 0),
    acceptedSum: routes.reduce((total, row) => total + row.accepted, 0),
  };
}

function section(invoice: InvoiceModel, name: string) {
  const found = invoice.sections.find((item) => item.name === name);
  if (!found) throw new Error(`Variable invoice is missing the ${name} section.`);
  return found;
}

function rowsWithInvoice(invoice: InvoiceModel, work: WorkModel): ReconcileRow[] {
  const routes = section(invoice, "Routes");
  const training = section(invoice, "Training sessions");
  const late = section(invoice, "Late cancellations");
  const delay = section(invoice, "Unplanned delay");
  const packages = section(invoice, "Packages");
  const branding = packages.lines.filter((line) => line.label === PACKAGE_BRANDING);
  const deliveries = packages.lines.filter((line) => line.label === PACKAGE_DELIVERIES);
  const pickups = packages.lines.filter((line) => line.label === PACKAGE_PICKUPS);
  const known = new Set([PACKAGE_BRANDING, PACKAGE_DELIVERIES, PACKAGE_PICKUPS]);
  const unknown = packages.lines.filter((line) => !known.has(line.label));
  if (unknown.length > 0) {
    throw new Error(`Unexpected package line label: ${unknown[0].label}`);
  }
  const brandingQty = branding.reduce((total, line) => total + line.quantity, 0);
  const deliveryQty = deliveries.reduce((total, line) => total + line.quantity, 0);
  const pickupQty = pickups.reduce((total, line) => total + line.quantity, 0);
  const sameDeliveryList =
    branding.map((line) => line.quantity).join(",") === deliveries.map((line) => line.quantity).join(",");
  const delayLine = delay.lines[0];
  if (!delayLine || delay.lines.length !== 1) {
    throw new Error("Unplanned delay section did not have exactly one line.");
  }

  const amzlLines = late.lines.filter((line) => line.label.toLowerCase().includes("amzl late cancel"));
  const otherLate = late.lines.filter((line) => !line.label.toLowerCase().includes("amzl late cancel"));
  const amzlQty = amzlLines.reduce((total, line) => total + line.quantity, 0);
  const amzlCents = sumCents(amzlLines.map((line) => parseUsdToCents(line.amount)));
  const serviceTypes = [...new Set(amzlLines.map((line) => line.serviceType).filter(Boolean))] as string[];
  const matchingRoutes = work.routes.filter((route) =>
    serviceTypes.some((serviceType) => routeMatchesServiceType(route.label, serviceType))
  );
  const amzlOnRoutes = matchingRoutes.reduce((total, route) => total + route.amzlLateCancel, 0);
  const providerOnRoutes = work.routes.reduce((total, route) => total + route.providerLateCancel, 0);

  const deliveredEcho = branding.filter((line) => line.quantity === work.deliveredPackages).length;
  const pickupEcho = pickups.filter((line) => line.quantity === work.pickupPackages).length;

  return [
    row({
      id: "invoice-total",
      field: "Invoice total",
      invoice: side(invoice.total, invoice.totalCents / 100, "USD"),
      workSummary: side(NOT_IN_WORK_SUMMARY, null, null),
      status: "not_comparable",
      note: `${work.ratesSentence} The invoice total has no Work Summary dollar amount to compare.`,
    }),
    row({
      id: "routes",
      field: "Routes",
      invoice: side(countText(routes.quantity, "route payment", "route payments"), routes.quantity, "route payments"),
      workSummary: side(
        countText(work.completedRoutes, "route completed", "routes completed"),
        work.completedRoutes,
        "routes completed"
      ),
      status: "not_comparable",
      note: `Invoice Routes quantity is ${formatNumber(routes.quantity)} route payments, equal to the sum of route line quantities. Work Summary completed routes are ${formatNumber(work.completedRoutes)}. Route payments and routes completed are different definitions. The capture has no conversion between them, so this row has no variance.`,
    }),
    row({
      id: "packages",
      field: "Packages",
      invoice: side(countText(packages.quantity, "package unit", "package units"), packages.quantity, "package units"),
      workSummary: side(countText(work.totalPackages, "package", "packages"), work.totalPackages, "packages"),
      status: "not_comparable",
      note: packageNote(packages.quantity, branding, brandingQty, deliveryQty, pickupQty, sameDeliveryList, work.totalPackages),
    }),
    row({
      id: "delivered-packages",
      field: "Delivered packages",
      invoice: side("No single delivered-package total on the invoice", null, null),
      workSummary: side(
        countText(work.deliveredPackages, "delivered package", "delivered packages"),
        work.deliveredPackages,
        "delivered packages"
      ),
      status: "not_comparable",
      note: deliveredNote(work.deliveredPackages, branding, deliveries, sameDeliveryList, deliveredEcho),
    }),
    row({
      id: "pickup-packages",
      field: "Pickup packages",
      invoice: side(
        `${formatNumber(pickupQty)} per-piece pickup payment units`,
        pickupQty,
        "pickup payment units"
      ),
      workSummary: side(
        countText(work.pickupPackages, "pickup package", "pickup packages"),
        work.pickupPackages,
        "pickup packages"
      ),
      status: "not_comparable",
      note: pickupNote(pickups, pickupQty, work.pickupPackages, pickupEcho),
    }),
    row({
      id: "unplanned-delay-count",
      field: "Unplanned delay count",
      invoice: side(countText(delay.quantity, "delay", "delays"), delay.quantity, "delays"),
      workSummary: side(
        countText(work.unplannedDelayCount, "delay", "delays"),
        work.unplannedDelayCount,
        "delays"
      ),
      status: delay.quantity === work.unplannedDelayCount ? "match" : "mismatch",
      note: `Both fields are delay counts. The invoice section quantity is ${formatNumber(delay.quantity)}. Work Summary unplannedDelayCount is ${formatNumber(work.unplannedDelayCount)}. The invoice also has an Unplanned Delay line of ${formatNumber(delayLine.quantity)} at ${delayLine.rate} for ${delayLine.amount}. That line quantity is not a delay count, so it is not used in this variance.`,
    }),
    row({
      id: "unplanned-delay-line-qty",
      field: "Unplanned delay line quantity",
      invoice: side(`${formatNumber(delayLine.quantity)} on the Unplanned Delay line`, delayLine.quantity, "line quantity"),
      workSummary: side(NOT_IN_WORK_SUMMARY, null, null),
      status: "not_comparable",
      note: `The line is ${formatNumber(delayLine.quantity)} × ${delayLine.rate} = ${delayLine.amount}. Work Summary only publishes an unplanned-delay count (${formatNumber(work.unplannedDelayCount)}), not this line quantity.`,
    }),
    row({
      id: "unplanned-delay-amount",
      field: "Unplanned delay amount",
      invoice: side(delay.total, parseUsdToCents(delay.total) / 100, "USD"),
      workSummary: side(NOT_IN_WORK_SUMMARY, null, null),
      status: "not_comparable",
      note: work.ratesSentence,
    }),
    amzlRow(amzlLines, otherLate, amzlQty, amzlCents, serviceTypes, matchingRoutes, amzlOnRoutes),
    row({
      id: "provider-late-cancels",
      field: "Provider late cancels",
      invoice: side(NOT_ON_INVOICE, null, null),
      workSummary: side(
        `${formatNumber(providerOnRoutes)} on route-summary rows`,
        providerOnRoutes,
        "provider late cancels"
      ),
      status: "not_comparable",
      note: "Work Summary has no weekly provider-late-cancel total. The figure is the sum of providerLateCancel on the route-summary rows. The variable invoice has no provider-late-cancel line.",
    }),
    row({
      id: "training",
      field: "Training sessions",
      invoice: side(
        `${countText(training.quantity, "session", "sessions")} · ${training.total}`,
        training.quantity,
        "sessions"
      ),
      workSummary: side(NOT_IN_WORK_SUMMARY, null, null),
      status: "not_comparable",
      note: "Work Summary does not list training sessions. The invoice amount is the Training sessions section total.",
    }),
    row({
      id: "miles",
      field: "Miles",
      invoice: side(NOT_ON_INVOICE, null, null),
      workSummary: side(countText(work.miles, "mile", "miles"), work.miles, "miles"),
      status: "not_comparable",
      note: "The variable invoice does not list miles.",
    }),
  ];
}

function rowsWithoutInvoice(work: WorkModel): ReconcileRow[] {
  const absent = "Variable invoice for this week was not listed in the Payments capture.";
  const rows: ReconcileRow[] = [
    metricRow("packages", "Packages", countText(work.totalPackages, "package", "packages"), work.totalPackages, "packages", absent),
    metricRow(
      "delivered-packages",
      "Delivered packages",
      countText(work.deliveredPackages, "delivered package", "delivered packages"),
      work.deliveredPackages,
      "delivered packages",
      absent
    ),
    metricRow(
      "pickup-packages",
      "Pickup packages",
      countText(work.pickupPackages, "pickup package", "pickup packages"),
      work.pickupPackages,
      "pickup packages",
      absent
    ),
    metricRow(
      "routes",
      "Routes",
      countText(work.completedRoutes, "route completed", "routes completed"),
      work.completedRoutes,
      "routes completed",
      absent
    ),
    metricRow(
      "unplanned-delay-count",
      "Unplanned delay count",
      countText(work.unplannedDelayCount, "delay", "delays"),
      work.unplannedDelayCount,
      "delays",
      absent
    ),
    metricRow("miles", "Miles", countText(work.miles, "mile", "miles"), work.miles, "miles", absent),
  ];
  if (work.routes.length > 0) {
    const amzl = work.routes.reduce((total, route) => total + route.amzlLateCancel, 0);
    const provider = work.routes.reduce((total, route) => total + route.providerLateCancel, 0);
    rows.push(
      metricRow(
        "amzl-late-cancels",
        "AMZL late cancels",
        `${formatNumber(amzl)} on route-summary rows`,
        amzl,
        "AMZL late cancels",
        `${absent} Work Summary did not publish a weekly late-cancel total; this is the sum of amzlLateCancel on the route-summary rows.`
      ),
      metricRow(
        "provider-late-cancels",
        "Provider late cancels",
        `${formatNumber(provider)} on route-summary rows`,
        provider,
        "provider late cancels",
        `${absent} This is the sum of providerLateCancel on the route-summary rows, not a weekly total.`
      )
    );
  }
  return rows;
}

function metricRow(
  id: string,
  field: string,
  workText: string,
  workNumeric: number,
  unit: string,
  note: string
): ReconcileRow {
  return row({
    id,
    field,
    invoice: side(NOT_YET_LISTED, null, null),
    workSummary: side(workText, workNumeric, unit),
    status: "not_comparable",
    note,
  });
}

function amzlRow(
  amzlLines: InvoiceLineView[],
  otherLate: InvoiceLineView[],
  amzlQty: number,
  amzlCents: number,
  serviceTypes: string[],
  matchingRoutes: SeedRoute[],
  amzlOnRoutes: number
): ReconcileRow {
  const serviceLabel = serviceTypes.join("; ") || "AMZL late cancel";
  const routeDetail =
    matchingRoutes.length === 0
      ? "No Work Summary route-summary row matched that service type."
      : matchingRoutes
          .map((route) => `${route.label} shows amzlLateCancel ${formatNumber(route.amzlLateCancel)}`)
          .join("; ");
  const otherNote =
    otherLate.length > 0
      ? ` ${formatNumber(otherLate.length)} late-cancellation lines are not labeled AMZL and are not included in this count.`
      : "";
  const comparable = matchingRoutes.length > 0 && otherLate.length === 0;
  const status: ReconcileStatus = !comparable
    ? "not_comparable"
    : amzlQty === amzlOnRoutes
      ? "match"
      : "mismatch";
  return row({
    id: "amzl-late-cancels",
    field: "AMZL late cancels",
    invoice: side(
      `${formatNumber(amzlQty)} cancellation payments · ${formatUsd(amzlCents / 100)}`,
      comparable ? amzlQty : null,
      comparable ? "AMZL late cancels" : null
    ),
    workSummary: side(
      matchingRoutes.length === 0
        ? "No matching route-summary row"
        : `${formatNumber(amzlOnRoutes)} on the matching route-summary row`,
      comparable ? amzlOnRoutes : null,
      comparable ? "AMZL late cancels" : null
    ),
    status,
    note: `Invoice lines labeled AMZL late cancel for ${serviceLabel} sum to ${formatNumber(amzlQty)} payments (${formatUsd(amzlCents / 100)}). Work Summary has no weekly late-cancel total. ${routeDetail} Variance is invoice payments minus that route-summary counter, and only when a row matches.${otherNote}`,
  });
}

function packageNote(
  sectionQty: number,
  branding: InvoiceLineView[],
  brandingQty: number,
  deliveryQty: number,
  pickupQty: number,
  sameDeliveryList: boolean,
  workTotal: number
) {
  const list = branding.map((line) => formatNumber(line.quantity)).join(", ");
  const repeat = sameDeliveryList
    ? `Per-piece delivery lines repeat that list (also ${formatNumber(deliveryQty)}).`
    : `Per-piece delivery quantities sum to ${formatNumber(deliveryQty)} and do not repeat the branding list.`;
  const composed = brandingQty + pickupQty;
  const composition =
    composed === sectionQty
      ? `${formatNumber(brandingQty)} + ${formatNumber(pickupQty)} = ${formatNumber(composed)}, which is the section quantity.`
      : `${formatNumber(brandingQty)} + ${formatNumber(pickupQty)} = ${formatNumber(composed)}, which does not equal the section quantity ${formatNumber(sectionQty)}.`;
  return `Invoice Packages section quantity is ${formatNumber(sectionQty)} package units. Branding-delivery quantities are ${list} (sum ${formatNumber(brandingQty)}). ${repeat} Per-piece pickup quantities sum to ${formatNumber(pickupQty)}. ${composition} Work Summary total packages are ${formatNumber(workTotal)}. These are different package definitions, so this row has no variance.`;
}

function deliveredNote(
  delivered: number,
  branding: InvoiceLineView[],
  deliveries: InvoiceLineView[],
  sameDeliveryList: boolean,
  echo: number
) {
  const echoNote =
    echo > 0
      ? ` ${formatNumber(echo)} branding line${echo === 1 ? "" : "s"} ${echo === 1 ? "is" : "are"} ${formatNumber(delivered)}, the same number as Work Summary delivered packages. The invoice does not identify that line as the weekly Work Summary total.`
      : "";
  return `Work Summary delivered packages are ${formatNumber(delivered)}. The invoice has ${formatNumber(branding.length)} branding-delivery lines and ${formatNumber(deliveries.length)} per-piece delivery lines${sameDeliveryList ? ", and those quantity lists match" : ""}. It does not publish one delivered-package total.${echoNote}`;
}

function pickupNote(pickups: InvoiceLineView[], pickupQty: number, workPickups: number, echo: number) {
  const echoNote =
    echo > 0
      ? ` ${formatNumber(echo)} pickup line${echo === 1 ? "" : "s"} ${echo === 1 ? "is" : "are"} quantity ${formatNumber(workPickups)}, equal to the Work Summary pickup count. The invoice does not identify that line as the weekly total.`
      : "";
  return `Per-piece pickup line quantities are ${pickups.map((line) => formatNumber(line.quantity)).join(", ")} (sum ${formatNumber(pickupQty)}). Work Summary pickup packages are ${formatNumber(workPickups)}. Pickup payment units and pickup packages are different definitions, so this row has no variance.${echoNote}`;
}

function buildServiceRows(invoice: InvoiceModel | null, work: WorkModel): ServiceCompareRow[] {
  const groups = new Map<
    string,
    { label: string; quantity: number; amountCents: number; onInvoice: boolean; route: SeedRoute | null }
  >();

  if (invoice) {
    for (const line of section(invoice, "Routes").lines) {
      const key = normalizeServiceLabel(line.label);
      const current = groups.get(key) ?? {
        label: line.label,
        quantity: 0,
        amountCents: 0,
        onInvoice: true,
        route: null,
      };
      current.quantity += line.quantity;
      current.amountCents += parseUsdToCents(line.amount);
      current.onInvoice = true;
      groups.set(key, current);
    }
  }

  for (const route of work.routes) {
    const key = normalizeServiceLabel(route.label);
    const current = groups.get(key) ?? {
      label: route.label,
      quantity: 0,
      amountCents: 0,
      onInvoice: false,
      route: null,
    };
    current.route = route;
    if (!current.onInvoice) current.label = route.label;
    groups.set(key, current);
  }

  const rows: ServiceCompareRow[] = [];
  for (const [key, group] of groups) {
    const route = group.route;
    let note: string;
    if (!invoice) {
      note =
        "Variable invoice for this week was not listed. Work Summary completed routes are not invoice route payments.";
    } else if (group.onInvoice && route) {
      note =
        "Invoice value is the sum of route-payment quantities and amounts for this label. Work Summary value is completed routes on that route-summary row. Different definitions, so there is no variance.";
    } else if (group.onInvoice) {
      note = "This service is on the variable invoice and not in the Work Summary route-summary rows.";
    } else {
      note = "This service is on the Work Summary route summary and not on the variable invoice.";
    }
    rows.push({
      id: key,
      label: group.label,
      invoiceRoutePayments: group.onInvoice ? group.quantity : null,
      invoiceAmountCents: group.onInvoice ? group.amountCents : null,
      completedRoutes: route ? route.completedRoutes : null,
      deliveredPackages: route ? route.deliveredPackages : null,
      pickupPackages: route ? route.pickupPackages : null,
      amzlLateCancel: route ? route.amzlLateCancel : null,
      providerLateCancel: route ? route.providerLateCancel : null,
      status: "not_comparable",
      note,
    });
  }

  return rows.sort((a, b) => {
    const aq = a.invoiceRoutePayments ?? -1;
    const bq = b.invoiceRoutePayments ?? -1;
    if (bq !== aq) return bq - aq;
    return (b.completedRoutes ?? -1) - (a.completedRoutes ?? -1);
  });
}

function routeMatchesServiceType(routeLabel: string, serviceType: string) {
  const route = normalizeServiceLabel(routeLabel);
  const service = normalizeServiceLabel(serviceType);
  if (!route.startsWith(`${service} -`) && route !== service) return false;
  const rest = route.slice(service.length).replace(/^\s*-\s*/, "");
  return /^\d+\s*hr$/.test(rest);
}

function buildChecks(invoice: InvoiceModel | null, work: WorkModel): SourceCheck[] {
  const checks: SourceCheck[] = [];
  if (invoice) {
    const sectionCents = sumCents(invoice.sections.map((item) => item.totalCents));
    checks.push({
      id: "invoice-total",
      source: "invoice",
      kind: sectionCents === invoice.totalCents ? "holds" : "gap",
      label: "Section totals vs invoice total",
      detail:
        sectionCents === invoice.totalCents
          ? `Section totals sum to ${invoice.total}, the invoice total.`
          : `Section totals sum to ${formatUsd(sectionCents / 100)} and the invoice total is ${invoice.total}.`,
    });
    for (const item of invoice.sections) {
      const lineCents = sumCents(item.lines.map((line) => parseUsdToCents(line.amount)));
      checks.push({
        id: `amount-${item.name}`,
        source: "invoice",
        kind: lineCents === item.totalCents ? "holds" : "gap",
        label: `${item.name} line amounts`,
        detail:
          lineCents === item.totalCents
            ? `Line amounts sum to the section total ${item.total}.`
            : `Line amounts sum to ${formatUsd(lineCents / 100)}; section total is ${item.total}.`,
      });
      const rateGaps = item.lines.filter(
        (line) => Math.round(line.quantity * parseUsdToCents(line.rate)) !== parseUsdToCents(line.amount)
      );
      checks.push({
        id: `rate-${item.name}`,
        source: "invoice",
        kind: rateGaps.length === 0 ? "holds" : "gap",
        label: `${item.name} quantity × rate`,
        detail:
          rateGaps.length === 0
            ? "Each line amount matches quantity × rate, rounded to the cent."
            : `${rateGaps.length} lines do not match quantity × rate to the cent.`,
      });
    }
    for (const name of ["Routes", "Training sessions", "Late cancellations"] as const) {
      const item = section(invoice, name);
      const qty = item.lines.reduce((total, line) => total + line.quantity, 0);
      checks.push({
        id: `qty-${name}`,
        source: "invoice",
        kind: qty === item.quantity ? "holds" : "gap",
        label: `${name} quantity`,
        detail:
          qty === item.quantity
            ? `Line quantities sum to the section quantity ${formatNumber(item.quantity)} ${item.quantityLabel}.`
            : `Line quantities sum to ${formatNumber(qty)}; section quantity is ${formatNumber(item.quantity)}.`,
      });
    }
    const delay = section(invoice, "Unplanned delay");
    const delayQty = delay.lines.reduce((total, line) => total + line.quantity, 0);
    checks.push({
      id: "delay-qty",
      source: "invoice",
      kind: "gap",
      label: "Unplanned delay quantity",
      detail: `Section quantity is ${formatNumber(delay.quantity)} ${delay.quantityLabel}. The line quantity is ${formatNumber(delayQty)}. Those are different fields. The line amount is still included in the section total ${delay.total}.`,
    });
    const packages = section(invoice, "Packages");
    const brandingQty = packages.lines
      .filter((line) => line.label === PACKAGE_BRANDING)
      .reduce((total, line) => total + line.quantity, 0);
    const pickupQty = packages.lines
      .filter((line) => line.label === PACKAGE_PICKUPS)
      .reduce((total, line) => total + line.quantity, 0);
    const allQty = packages.lines.reduce((total, line) => total + line.quantity, 0);
    const composed = brandingQty + pickupQty;
    checks.push({
      id: "package-composition",
      source: "invoice",
      kind: composed === packages.quantity ? "holds" : "gap",
      label: "Packages section quantity",
      detail: `Branding-delivery quantities (${formatNumber(brandingQty)}) plus per-piece pickup quantities (${formatNumber(pickupQty)}) equal ${formatNumber(composed)}. The section quantity is ${formatNumber(packages.quantity)}. Adding every package line instead totals ${formatNumber(allQty)}, because per-piece delivery lines repeat the branding quantities.`,
    });
    const routeGroups = buildServiceRows(invoice, { ...work, routes: [] });
    const groupedQty = routeGroups.reduce((total, item) => total + (item.invoiceRoutePayments ?? 0), 0);
    const groupedCents = sumCents(routeGroups.map((item) => item.invoiceAmountCents ?? 0));
    const routeSection = section(invoice, "Routes");
    checks.push({
      id: "route-groups",
      source: "invoice",
      kind: groupedQty === routeSection.quantity && groupedCents === routeSection.totalCents ? "holds" : "gap",
      label: "Route service groups",
      detail:
        groupedQty === routeSection.quantity && groupedCents === routeSection.totalCents
          ? `Service-label groups sum to ${formatNumber(routeSection.quantity)} route payments and ${routeSection.total}.`
          : "Service-label groups do not add back to the Routes section.",
    });
  }

  const packageIdentity = work.deliveredPackages + work.pickupPackages === work.totalPackages;
  checks.push({
    id: "ws-packages",
    source: "work_summary",
    kind: packageIdentity ? "holds" : "gap",
    label: "Work Summary package total",
    detail: packageIdentity
      ? `Delivered ${formatNumber(work.deliveredPackages)} + pickup ${formatNumber(work.pickupPackages)} = ${formatNumber(work.totalPackages)} total packages.`
      : `Delivered ${formatNumber(work.deliveredPackages)} + pickup ${formatNumber(work.pickupPackages)} does not equal total packages ${formatNumber(work.totalPackages)}.`,
  });

  if (work.routes.length === 0) {
    checks.push({
      id: "ws-routes-empty",
      source: "work_summary",
      kind: "gap",
      label: "Work Summary route rows",
      detail: work.notes,
    });
  } else {
    checks.push(routeGapCheck("ws-delivered-rows", "Route-summary delivered packages", work.deliveredPackages, work.routeDeliveredSum, "delivered packages"));
    checks.push(routeGapCheck("ws-pickup-rows", "Route-summary pickup packages", work.pickupPackages, work.routePickupSum, "pickup packages"));
    checks.push(routeGapCheck("ws-completed-rows", "Route-summary completed routes", work.completedRoutes, work.routeCompletedSum, "completed routes"));
  }

  if (work.routes.length > 0 && work.quickCoverageSum === 0 && work.acceptedSum === 0) {
    checks.push({
      id: "ws-quick-accepted",
      source: "work_summary",
      kind: "holds",
      label: "Quick coverage and accepted",
      detail: "Every captured route-summary row shows quick coverage 0 and accepted 0.",
    });
  }

  return checks;
}

function routeGapCheck(id: string, label: string, weekly: number, rowSum: number, noun: string): SourceCheck {
  if (weekly === rowSum) {
    return {
      id,
      source: "work_summary",
      kind: "holds",
      label,
      detail: `Route-summary rows sum to ${formatNumber(rowSum)} ${noun}, matching the weekly summary.`,
    };
  }
  const gap = weekly - rowSum;
  return {
    id,
    source: "work_summary",
    kind: "gap",
    label,
    detail: `Route-summary rows sum to ${formatNumber(rowSum)} ${noun}. The weekly summary shows ${formatNumber(weekly)}. Difference ${formatNumber(gap)} (weekly minus row sum). The capture does not explain the gap.`,
  };
}

function insightFor(invoice: InvoiceModel | null, work: WorkModel) {
  if (!invoice) {
    return `Work Summary is available for Week ${work.week} (${work.period}). ${work.notes} ${invoiceSeed.invoiceListingObservation.note}`;
  }
  return `${invoice.atAGlance} Invoice packages are ${formatNumber(section(invoice, "Packages").quantity)} package units and routes are ${formatNumber(section(invoice, "Routes").quantity)} route payments. Work Summary shows ${formatNumber(work.totalPackages)} packages and ${formatNumber(work.completedRoutes)} routes completed. This view does not convert one into the other.`;
}

function side(text: string, numeric: number | null, unit: string | null): ReconcileSide {
  return { text, numeric, unit };
}

function countText(value: number, singular: string, plural: string) {
  return `${formatNumber(value)} ${value === 1 ? singular : plural}`;
}

function row(input: {
  id: string;
  field: string;
  invoice: ReconcileSide;
  workSummary: ReconcileSide;
  status: ReconcileStatus;
  note: string;
}): ReconcileRow {
  const sameUnit =
    input.status !== "not_comparable" &&
    input.invoice.unit != null &&
    input.invoice.unit === input.workSummary.unit &&
    input.invoice.numeric != null &&
    input.workSummary.numeric != null;
  const variance = sameUnit ? input.invoice.numeric! - input.workSummary.numeric! : null;
  return {
    ...input,
    variance,
    varianceUnit: variance == null ? null : input.invoice.unit,
  };
}

function assertVarianceRules(rows: ReconcileRow[]) {
  for (const item of rows) {
    if (item.status === "not_comparable" && item.variance != null) {
      throw new Error(`${item.id} is not comparable and must not have a variance.`);
    }
    if (item.status === "match" && item.variance !== 0) {
      throw new Error(`${item.id} is a match but variance is ${item.variance}.`);
    }
    if (item.status === "mismatch" && (item.variance == null || item.variance === 0)) {
      throw new Error(`${item.id} is a mismatch and needs a non-zero variance.`);
    }
    if (item.workSummary.text.includes("$")) {
      throw new Error(`${item.id} puts a dollar amount on the Work Summary side.`);
    }
  }
}
