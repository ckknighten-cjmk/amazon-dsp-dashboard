"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ExportCsvButton } from "@/components/export-csv-button";
import { useDateRange } from "@/components/layout/date-range-context";
import { CoverageNote } from "@/components/period-coverage";
import { InvoiceStatusBadge } from "@/components/ops-badges";
import { EmptyState, PageHeader } from "@/components/page-header";
import { ReconcileBoard } from "@/components/reconcile-board";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPayments, getReconcile, parseReconcileWeek } from "@/lib/data";
import { paymentsCsv } from "@/lib/export/datasets";
import { formatNumber, formatRangeLabel, formatUsd, formatZonedDateTime } from "@/lib/format";
import {
  invoiceServiceWindow,
  rangesOverlap,
  SCORECARD_COVERAGE,
  workSummaryWeekForRange,
} from "@/lib/period";
import type { InvoiceKind, SettlementInvoice, SettlementLine } from "@/lib/types";

const KIND_LABEL: Record<InvoiceKind, string> = {
  incentive: "Incentive",
  variable: "Variable",
  other: "Other",
};

const DATA_SOURCE = "Amazon DSP Console Flex Payments";

function sumAmount(invoices: SettlementInvoice[]) {
  return invoices.reduce((total, invoice) => total + invoice.amount, 0);
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={null}>
      <PaymentsBody />
    </Suspense>
  );
}

function PaymentsBody() {
  const { range } = useDateRange();
  const weekParam = useSearchParams().get("week");
  const weekFromPeriod = range.kind === "custom" ? workSummaryWeekForRange(range) : null;
  const week = weekParam ? parseReconcileWeek(weekParam) : (weekFromPeriod ?? 37);
  const reconcile = getReconcile(week);
  const payments = getPayments();
  const paymentsExport = paymentsCsv();
  const ytd = payments.ytdInsights;
  const variable = payments.week37Variable;
  const incentive = payments.week37Incentive;
  const invoices = payments.invoices.filter((invoice) => {
    const window = invoiceServiceWindow(invoice.periodLabel);
    return window ? rangesOverlap(window.start, window.end, range) : false;
  });
  const newInvoices = invoices.filter((invoice) => invoice.status === "New");
  const paidInvoices = invoices.filter((invoice) => invoice.status === "Paid");
  const week37Coverage = SCORECARD_COVERAGE[37];
  const showWeek37 = rangesOverlap(week37Coverage.start, week37Coverage.end, range);

  return (
    <div>
      <PageHeader
        title="Payments"
        description={`${payments.company} · ${payments.station.code} ${payments.station.name}. Settlements from ${DATA_SOURCE}, reconciled to the Work Summary Tool where both captures exist.`}
      />

      <p className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:text-amber-100">
        Data source: {DATA_SOURCE}. Captured {formatZonedDateTime(payments.capturedAt)}.{" "}
        {payments.disclaimer}
      </p>

      <CoverageNote>
        Invoices are included when their service window overlaps {formatRangeLabel(range)}. The
        Console pending-action chip on the Sep 21 list is {formatUsd(payments.pendingAction.totalExact)}{" "}
        for {formatNumber(payments.pendingAction.count)} invoices and is not re-cut by day. Amounts
        below add only the overlapping published invoices. The export stays the full Console list.
        The Work Summary reconcile uses its own week and is not filtered by this period.
      </CoverageNote>

      <section aria-labelledby="settlement-kpis" className="mb-5">
        <h2 id="settlement-kpis" className="sr-only">
          Settlement totals
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MoneyStat
            label="New invoices in period"
            value={formatUsd(sumAmount(newInvoices))}
            hint={`${formatNumber(newInvoices.length)} published New invoices overlapping this period`}
          />
          <MoneyStat
            label="Paid invoices in period"
            value={formatUsd(sumAmount(paidInvoices))}
            hint={`${formatNumber(paidInvoices.length)} published Paid invoices overlapping this period`}
          />
          <MoneyStat
            label="Week 37 variable"
            value={showWeek37 ? formatUsd(variable.total) : "—"}
            hint={
              showWeek37
                ? `Dispute window closes ${formatZonedDateTime(variable.disputeWindowCloses)}`
                : `${week37Coverage.label}. Not in this period.`
            }
          />
          <MoneyStat
            label="Week 37 incentive"
            value={showWeek37 ? formatUsd(incentive.total) : "—"}
            hint={
              showWeek37
                ? `Dispute window closes ${formatZonedDateTime(incentive.disputeWindowCloses)}`
                : `${week37Coverage.label}. Not in this period.`
            }
          />
        </div>
      </section>

      <ReconcileBoard report={reconcile} />

      <section aria-labelledby="all-invoices" className="mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="all-invoices" className="text-sm font-semibold">
            All invoices
          </h2>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground tabular-nums">
              {invoices.length} of {payments.invoices.length} on the {payments.station.code} list
            </p>
            <ExportCsvButton
              filename={paymentsExport.filename}
              csv={paymentsExport.csv}
              label="Export settlements"
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyState
                      title="No settlements overlap this period"
                      description="Service windows on the Sep 21 Console list do not meet the selected dates. Amounts are not estimated."
                      className="border-0 py-8"
                    />
                  </TableCell>
                </TableRow>
              ) : null}
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-xs">{invoice.id}</TableCell>
                  <TableCell>{invoice.periodLabel}</TableCell>
                  <TableCell>{KIND_LABEL[invoice.kind]}</TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatUsd(invoice.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {showWeek37 ? (
      <section aria-labelledby="week-37" className="mb-6">
        <h2 id="week-37" className="mb-3 text-sm font-semibold">
          Week 37 breakdowns
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Variable invoice
                  </p>
                  <CardTitle className="font-mono text-sm">{variable.invoiceId}</CardTitle>
                  <CardDescription className="mt-1">
                    Dispute window closes {formatZonedDateTime(variable.disputeWindowCloses)}
                  </CardDescription>
                </div>
                <InvoiceStatusBadge status={variable.status} />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="font-heading text-3xl font-semibold tabular-nums tracking-tight">
                {formatUsd(variable.total)}
              </p>
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Line</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variable.lines.map((line) => (
                      <TableRow key={line.label}>
                        <TableCell>{line.label}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatQty(line)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatUsd(line.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Section quantities and amounts match the Sep 23 variable invoice. Unplanned delay quantity is the
                section count. The line quantity on that invoice is 0.37 and is shown in the reconcile above.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Incentive invoice
                  </p>
                  <CardTitle className="font-mono text-sm">{incentive.invoiceId}</CardTitle>
                  <CardDescription className="mt-1">
                    Dispute window closes {formatZonedDateTime(incentive.disputeWindowCloses)}
                  </CardDescription>
                </div>
                <InvoiceStatusBadge status={incentive.status} />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-4">
              <p className="font-heading text-3xl font-semibold tabular-nums tracking-tight">
                {formatUsd(incentive.total)}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">{incentive.notes}</p>
            </CardContent>
          </Card>
        </div>
      </section>
      ) : (
        <p className="mb-6 text-xs text-muted-foreground">
          Week 37 variable and incentive lines are hidden. {week37Coverage.label}.
        </p>
      )}

      <section aria-labelledby="ytd-insights">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="ytd-insights" className="text-sm font-semibold">
              YTD Insights · {ytd.yearAsShownInConsole}
            </h2>
            <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
              {ytd.disclaimer} These year figures are the Console YTD on the Sep 21 capture. They
              are not recalculated for the selected period.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Station {ytd.station} · year as shown in Console
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MoneyStat label="Total revenue" value={formatUsd(ytd.totalRevenue, 0)} hint={`${ytd.yearAsShownInConsole} YTD`} />
          <MoneyStat label="Variable payment" value={formatUsd(ytd.variablePayment, 0)} hint={`${ytd.yearAsShownInConsole} YTD`} />
          <MoneyStat label="Fixed monthly" value={formatUsd(ytd.fixedMonthly, 0)} hint={`${ytd.yearAsShownInConsole} YTD`} />
          <MoneyStat label="Per piece + DXI" value={formatUsd(ytd.perPiecePlusDxi, 0)} hint={`${ytd.yearAsShownInConsole} YTD`} />
          <MoneyStat label="Other" value={formatUsd(ytd.other, 0)} hint={`${ytd.yearAsShownInConsole} YTD`} />
        </div>
      </section>
    </div>
  );
}

function MoneyStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card size="sm" className="min-w-0">
      <CardContent className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="font-heading text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function formatQty(line: SettlementLine) {
  return line.qty == null ? "—" : formatNumber(line.qty);
}
