import { InvoiceStatusBadge } from "@/components/ops-badges";
import { PageHeader } from "@/components/page-header";
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
import { formatNumber, formatUsd, formatZonedDateTime } from "@/lib/format";
import type { InvoiceKind, SettlementLine } from "@/lib/types";

export const metadata = {
  title: "Payments",
};

const KIND_LABEL: Record<InvoiceKind, string> = {
  incentive: "Incentive",
  variable: "Variable",
  other: "Other",
};

const DATA_SOURCE = "Amazon DSP Console Flex Payments";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string | string[] }>;
}) {
  const week = parseReconcileWeek((await searchParams).week);
  const reconcile = getReconcile(week);
  const payments = getPayments();
  const ytd = payments.ytdInsights;
  const variable = payments.week37Variable;
  const incentive = payments.week37Incentive;

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

      <section aria-labelledby="settlement-kpis" className="mb-5">
        <h2 id="settlement-kpis" className="sr-only">
          Settlement totals
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MoneyStat
            label="Pending action"
            value={formatUsd(payments.pendingAction.totalExact)}
            hint={`${formatNumber(payments.pendingAction.count)} invoices · ${payments.pendingAction.currency}`}
          />
          <MoneyStat
            label="Visible paid total"
            value={formatUsd(payments.visiblePaidTotal)}
            hint="Invoices marked Paid on this Console list"
          />
          <MoneyStat
            label="Week 37 variable"
            value={formatUsd(variable.total)}
            hint={`Dispute window closes ${formatZonedDateTime(variable.disputeWindowCloses)}`}
          />
          <MoneyStat
            label="Week 37 incentive"
            value={formatUsd(incentive.total)}
            hint={`Dispute window closes ${formatZonedDateTime(incentive.disputeWindowCloses)}`}
          />
        </div>
      </section>

      <ReconcileBoard report={reconcile} />

      <section aria-labelledby="all-invoices" className="mb-6">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="all-invoices" className="text-sm font-semibold">
            All invoices
          </h2>
          <p className="text-xs text-muted-foreground tabular-nums">
            {payments.invoices.length} on the {payments.station.code} list
          </p>
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
              {payments.invoices.map((invoice) => (
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

      <section aria-labelledby="ytd-insights">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="ytd-insights" className="text-sm font-semibold">
              YTD Insights · {ytd.yearAsShownInConsole}
            </h2>
            <p className="mt-1 max-w-3xl text-xs text-muted-foreground">{ytd.disclaimer}</p>
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
