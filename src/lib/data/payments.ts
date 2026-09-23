/**
 * Amazon DSP Console Flex Payments scrape captured 2026-09-21.
 * Amounts, invoice ids, and the YTD year label are copied from that JSON.
 * Week 37 variable section lines match the Sep 23 variable invoice capture.
 */
import seedJson from "@/lib/data/seed/payments-settlements-2026-09-21.json";
import variableInvoiceWeek37 from "@/lib/data/seed/variable-invoice-week37.json";
import { parseUsdToCents } from "@/lib/payments/money";
import type {
  InvoiceKind,
  InvoiceStatus,
  PaymentsSnapshot,
  SettlementInvoice,
  SettlementLine,
} from "@/lib/types";

const INVOICE_KINDS: readonly InvoiceKind[] = ["incentive", "variable", "other"];
const INVOICE_STATUSES: readonly InvoiceStatus[] = ["New", "Paid"];

function cents(value: number) {
  return Math.round(value * 100);
}

function sumCents(rows: { amount: number }[]) {
  return rows.reduce((total, row) => total + cents(row.amount), 0);
}

function asKind(value: string, id: string): InvoiceKind {
  if ((INVOICE_KINDS as readonly string[]).includes(value)) return value as InvoiceKind;
  throw new Error(`Invoice ${id} has an unexpected kind.`);
}

function asStatus(value: string, id: string): InvoiceStatus {
  if ((INVOICE_STATUSES as readonly string[]).includes(value)) return value as InvoiceStatus;
  throw new Error(`Invoice ${id} has an unexpected status.`);
}

function asLine(line: { label: string; qty: number | null; amount: number }): SettlementLine {
  return { label: line.label, qty: line.qty, amount: line.amount };
}

function buildPayments(raw: typeof seedJson): PaymentsSnapshot {
  const invoices: SettlementInvoice[] = raw.invoices.map((invoice) => ({
    id: invoice.id,
    periodLabel: invoice.periodLabel,
    week: invoice.week,
    kind: asKind(invoice.kind, invoice.id),
    status: asStatus(invoice.status, invoice.id),
    amount: invoice.amount,
  }));

  const snapshot: PaymentsSnapshot = {
    source: raw.source,
    company: raw.company,
    station: { code: raw.station.code, name: raw.station.name },
    capturedAt: raw.capturedAt,
    timezone: raw.timezone,
    pendingAction: {
      count: raw.pendingAction.count,
      totalExact: raw.pendingAction.totalExact,
      currency: raw.pendingAction.currency,
    },
    visiblePaidTotal: raw.visiblePaidTotal,
    invoices,
    week37Variable: {
      invoiceId: raw.week37Variable.invoiceId,
      status: asStatus(raw.week37Variable.status, raw.week37Variable.invoiceId),
      disputeWindowCloses: raw.week37Variable.disputeWindowCloses,
      total: raw.week37Variable.total,
      lines: raw.week37Variable.lines.map(asLine),
    },
    week37Incentive: {
      invoiceId: raw.week37Incentive.invoiceId,
      status: asStatus(raw.week37Incentive.status, raw.week37Incentive.invoiceId),
      disputeWindowCloses: raw.week37Incentive.disputeWindowCloses,
      total: raw.week37Incentive.total,
      notes: raw.week37Incentive.notes,
    },
    ytdInsights: {
      station: raw.ytdInsights.station,
      yearAsShownInConsole: raw.ytdInsights.yearAsShownInConsole,
      totalRevenue: raw.ytdInsights.totalRevenue,
      variablePayment: raw.ytdInsights.variablePayment,
      fixedMonthly: raw.ytdInsights.fixedMonthly,
      perPiecePlusDxi: raw.ytdInsights.perPiecePlusDxi,
      other: raw.ytdInsights.other,
      disclaimer: raw.ytdInsights.disclaimer,
    },
    disclaimer: raw.disclaimer,
  };

  assertPaymentsSeed(snapshot);
  return snapshot;
}

function invoiceAmount(invoices: SettlementInvoice[], id: string) {
  return invoices.find((invoice) => invoice.id === id)?.amount;
}

function assertPaymentsSeed(seed: PaymentsSnapshot) {
  const pending = seed.invoices.filter((invoice) => invoice.status === "New");
  const paid = seed.invoices.filter((invoice) => invoice.status === "Paid");

  if (pending.length !== seed.pendingAction.count) {
    throw new Error(
      `Pending invoice count ${pending.length} does not match seed count ${seed.pendingAction.count}.`
    );
  }
  if (sumCents(pending) !== cents(seed.pendingAction.totalExact)) {
    throw new Error("Pending invoice amounts do not match pendingAction.totalExact.");
  }
  if (sumCents(paid) !== cents(seed.visiblePaidTotal)) {
    throw new Error("Paid invoice amounts do not match visiblePaidTotal.");
  }
  if (seed.pendingAction.currency !== "USD") {
    throw new Error(`Unexpected settlement currency ${seed.pendingAction.currency}.`);
  }

  const variableLines = seed.week37Variable.lines.reduce(
    (total, line) => total + cents(line.amount),
    0
  );
  if (variableLines !== cents(seed.week37Variable.total)) {
    throw new Error("Week 37 variable lines do not match the invoice total.");
  }
  if (seed.week37Variable.total !== invoiceAmount(seed.invoices, seed.week37Variable.invoiceId)) {
    throw new Error("Week 37 variable total does not match its invoice row.");
  }
  assertWeek37MatchesVariableInvoice(seed);
  if (seed.week37Incentive.total !== invoiceAmount(seed.invoices, seed.week37Incentive.invoiceId)) {
    throw new Error("Week 37 incentive total does not match its invoice row.");
  }

  const ytd = seed.ytdInsights;
  const ytdParts = ytd.variablePayment + ytd.fixedMonthly + ytd.perPiecePlusDxi + ytd.other;
  if (ytdParts !== ytd.totalRevenue) {
    throw new Error("YTD insight parts do not match totalRevenue.");
  }
  if (ytd.yearAsShownInConsole !== 2025) {
    throw new Error("YTD year label must stay 2025, as shown in Console.");
  }
}

/** Section rollup on the Sep 21 payments list stays aligned with the Sep 23 variable invoice. */
function assertWeek37MatchesVariableInvoice(seed: PaymentsSnapshot) {
  if (seed.week37Variable.invoiceId !== variableInvoiceWeek37.invoiceId) {
    throw new Error("Week 37 variable invoice id does not match the variable invoice capture.");
  }
  if (cents(seed.week37Variable.total) !== parseUsdToCents(variableInvoiceWeek37.total)) {
    throw new Error("Week 37 variable total does not match the variable invoice capture.");
  }
  if (seed.week37Variable.status !== variableInvoiceWeek37.status) {
    throw new Error("Week 37 variable status does not match the variable invoice capture.");
  }
  const lines = new Map(seed.week37Variable.lines.map((line) => [line.label, line]));
  if (lines.size !== variableInvoiceWeek37.sections.length) {
    throw new Error("Week 37 variable lines do not match variable invoice sections.");
  }
  for (const section of variableInvoiceWeek37.sections) {
    const line = lines.get(section.name);
    if (!line) throw new Error(`Week 37 payments line missing section ${section.name}.`);
    if (cents(line.amount) !== parseUsdToCents(section.total)) {
      throw new Error(`Week 37 ${section.name} amount does not match the variable invoice.`);
    }
    if (line.qty !== section.quantity) {
      throw new Error(`Week 37 ${section.name} quantity does not match the variable invoice section quantity.`);
    }
  }
}

export const paymentsSeed = buildPayments(seedJson);

export function getPaymentsSnapshot(): PaymentsSnapshot {
  return paymentsSeed;
}
