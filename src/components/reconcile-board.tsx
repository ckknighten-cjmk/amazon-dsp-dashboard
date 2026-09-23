"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { useDateRange } from "@/components/layout/date-range-context";
import { EmptyState } from "@/components/page-header";
import { InvoiceStatusBadge, ReconcileStatusBadge } from "@/components/ops-badges";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber, formatUsd, formatZonedDateTime } from "@/lib/format";
import {
  formatRangeLabel,
  hrefWithPeriod as withPeriod,
  parsePeriodParam,
  rangesOverlap,
  WORK_SUMMARY_COVERAGE,
} from "@/lib/period";
import { headlineCompares } from "@/lib/payments/reconcile";
import type { InvoiceStatus } from "@/lib/types";
import type {
  ReconcileRow,
  ServiceCompareRow,
  SourceCheck,
  WeekReconcile,
} from "@/lib/payments/types";
import { RECONCILE_WEEKS } from "@/lib/payments/types";

const WEEKS = RECONCILE_WEEKS.map((week) => ({
  week,
  href: `/payments?week=${week}`,
  label: `Week ${week}`,
}));

export function ReconcileBoard({ report }: { report: WeekReconcile }) {
  const params = useSearchParams();
  const { range } = useDateRange();
  const period = parsePeriodParam(params.get("period"), params.get("start"), params.get("end")) ?? range;
  const workCoverage = WORK_SUMMARY_COVERAGE[report.week];
  const workOverlaps = rangesOverlap(workCoverage.start, workCoverage.end, period);
  const headline = headlineCompares(report);
  const holds = report.checks.filter((check) => check.kind === "holds");
  const gaps = report.checks.filter((check) => check.kind === "gap");
  const exportBase = `/payments/export?week=${report.week}`;

  return (
    <section id="reconcile" aria-labelledby="reconcile-heading" data-reconcile-week={report.week} data-invoice-listed={report.invoiceListed ? "yes" : "no"} className="mb-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="reconcile-heading" className="text-sm font-semibold">
            Work Summary vs variable invoice
          </h2>
          <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
            Week {report.week} · {report.period}. {report.counts.match} match · {report.counts.mismatch} mismatch ·{" "}
            {report.counts.notComparable} not comparable. Variance is invoice minus Work Summary, and only when both
            sides use the same unit. {workCoverage.label}{" "}
            {workOverlaps
              ? `overlaps ${formatRangeLabel(period)}. Weekly totals stay whole.`
              : `does not overlap ${formatRangeLabel(period)}. The weekly capture stays on this reconcile and is not copied onto empty days.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1" role="group" aria-label="Reconcile week">
            {WEEKS.map((item) => (
              <Link
                key={item.week}
                href={`${withPeriod(item.href, period)}#reconcile`}
                aria-current={report.week === item.week ? "page" : undefined}
                className={buttonVariants({
                  size: "sm",
                  variant: report.week === item.week ? "default" : "outline",
                })}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <a className={buttonVariants({ size: "sm", variant: "outline" })} href={`${exportBase}&format=csv`}>
            <Download aria-hidden />
            CSV
          </a>
          <a className={buttonVariants({ size: "sm", variant: "outline" })} href={`${exportBase}&format=xls`}>
            <Download aria-hidden />
            Excel
          </a>
        </div>
      </div>

      <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:text-amber-100">
        {report.insight}
      </p>

      {headline.length > 0 ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {headline.map((item) => (
            <Card key={item.label} size="sm">
              <CardContent className="grid gap-2">
                <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Invoice</p>
                    <p className="font-medium tabular-nums">{item.invoice}</p>
                  </div>
                  <div>
                    <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Work Summary</p>
                    <p className="font-medium tabular-nums">{item.workSummary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <InvoicePanel report={report} />
        <WorkSummaryPanel report={report} />
      </div>

      <ReconcileTable rows={report.rows} />

      <ServiceTable report={report} />

      {report.invoice ? <InvoiceLines report={report} /> : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <CheckList title="Checks that hold" checks={holds} />
        <CheckList title="Differences inside one source" checks={gaps} />
      </div>
    </section>
  );
}

function InvoicePanel({ report }: { report: WeekReconcile }) {
  const invoice = report.invoice;
  if (!invoice) {
    return (
      <Card>
        <CardHeader className="border-b">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Variable invoice</p>
          <CardTitle>Week {report.week}</CardTitle>
          <CardDescription>{report.period}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Variable invoice not yet listed"
            description={report.listingNote}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {invoice.invoiceType}
            </p>
            <CardTitle className="font-mono text-sm">{invoice.invoiceId}</CardTitle>
            <CardDescription className="mt-1">
              {invoice.station} · {invoice.period}. Dispute window closes {invoice.disputeWindowCloses}. Captured{" "}
              {formatZonedDateTime(invoice.capturedAt)}.
            </CardDescription>
          </div>
          {isInvoiceStatus(invoice.status) ? <InvoiceStatusBadge status={invoice.status} /> : null}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="font-heading text-3xl font-semibold tabular-nums tracking-tight">{invoice.total}</p>
        <p className="mt-1 text-xs text-muted-foreground">{invoice.navPath}</p>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Section</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.sections.map((section) => (
                <TableRow key={section.name}>
                  <TableCell>
                    {section.name}
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">{section.quantityLabel}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(section.quantity)}</TableCell>
                  <TableCell className="text-right tabular-nums">{section.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkSummaryPanel({ report }: { report: WeekReconcile }) {
  const work = report.workSummary;
  const metrics = [
    ["Total packages", work.totalPackages],
    ["Delivered", work.deliveredPackages],
    ["Pickups", work.pickupPackages],
    ["Routes completed", work.completedRoutes],
    ["Miles", work.miles],
    ["Unplanned delays", work.unplannedDelayCount],
  ] as const;

  return (
    <Card>
      <CardHeader className="border-b">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Work Summary</p>
        <CardTitle>Week {report.week}</CardTitle>
        <CardDescription className="mt-1">
          {work.serviceArea}. Captured {formatZonedDateTime(work.capturedAt)}. {work.ratesSentence}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {metrics.map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] text-muted-foreground">{label}</p>
              <p className="font-heading text-xl font-semibold tabular-nums">{formatNumber(value)}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{work.notes}</p>
        <p className="mt-2 text-[11px] text-muted-foreground">{work.navPath}</p>
      </CardContent>
    </Card>
  );
}

function ReconcileTable({ rows }: { rows: ReconcileRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Field</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead>Work Summary</TableHead>
            <TableHead className="text-right">Variance</TableHead>
            <TableHead>Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} data-status={row.status}>
              <TableCell className="font-medium whitespace-nowrap">{row.field}</TableCell>
              <TableCell>
                <ReconcileStatusBadge status={row.status} />
              </TableCell>
              <TableCell className="max-w-52 tabular-nums">{row.invoice.text}</TableCell>
              <TableCell className="max-w-52 tabular-nums">{row.workSummary.text}</TableCell>
              <TableCell className="text-right tabular-nums whitespace-nowrap">{formatVariance(row)}</TableCell>
              <TableCell className="max-w-md text-xs leading-relaxed text-muted-foreground">{row.note}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ServiceTable({ report }: { report: WeekReconcile }) {
  if (report.serviceRows.length === 0) {
    return (
      <p className="mt-4 text-xs text-muted-foreground">
        No Work Summary route-summary rows for Week {report.week}.
      </p>
    );
  }
  return (
    <div className="mt-4">
      <h3 className="mb-2 text-sm font-semibold">Service labels</h3>
      <p className="mb-2 max-w-3xl text-xs text-muted-foreground">
        Invoice route payments are the sum of billed blocks for that label. Work Summary completed routes are the
        route-summary counter. Those columns stay not comparable.
      </p>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead className="text-right">Invoice route payments</TableHead>
              <TableHead className="text-right">Invoice amount</TableHead>
              <TableHead className="text-right">Routes completed</TableHead>
              <TableHead className="text-right">WS delivered</TableHead>
              <TableHead className="text-right">WS pickups</TableHead>
              <TableHead className="text-right">AMZL late cancel</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.serviceRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="min-w-64">
                  {row.label}
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">{row.note}</span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{invoiceQty(row, report.invoiceListed)}</TableCell>
                <TableCell className="text-right tabular-nums">{invoiceAmount(row, report.invoiceListed)}</TableCell>
                <TableCell className="text-right tabular-nums">{dashNumber(row.completedRoutes)}</TableCell>
                <TableCell className="text-right tabular-nums">{dashNumber(row.deliveredPackages)}</TableCell>
                <TableCell className="text-right tabular-nums">{dashNumber(row.pickupPackages)}</TableCell>
                <TableCell className="text-right tabular-nums">{dashNumber(row.amzlLateCancel)}</TableCell>
                <TableCell>
                  <ReconcileStatusBadge status={row.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function InvoiceLines({ report }: { report: WeekReconcile }) {
  const invoice = report.invoice;
  if (!invoice) return null;
  return (
    <div className="mt-4">
      <h3 className="mb-2 text-sm font-semibold">Invoice line items</h3>
      <div className="space-y-2">
        {invoice.sections.map((section) => (
          <details key={section.name} className="rounded-xl border bg-card px-4 py-3" open={section.name === "Routes"}>
            <summary className="cursor-pointer text-sm font-medium">
              {section.name} · {formatNumber(section.quantity)} {section.quantityLabel} · {section.total}
            </summary>
            <div className="mt-3 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Line</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.lines.map((line, index) => (
                    <TableRow key={`${section.name}-${index}`}>
                      <TableCell className="whitespace-nowrap">{line.date ?? "—"}</TableCell>
                      <TableCell>
                        {line.label}
                        {line.serviceType ? (
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">{line.serviceType}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(line.quantity)}</TableCell>
                      <TableCell className="text-right tabular-nums">{line.rate}</TableCell>
                      <TableCell className="text-right tabular-nums">{line.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function CheckList({ title, checks }: { title: string; checks: SourceCheck[] }) {
  if (checks.length === 0) return null;
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 space-y-2">
        {checks.map((check) => (
          <li key={check.id} className="text-xs leading-relaxed">
            <span className="font-medium">{check.label}. </span>
            <span className="text-muted-foreground">{check.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatVariance(row: ReconcileRow) {
  if (row.variance == null) return "—";
  const formatted = formatNumber(row.variance);
  return row.variance > 0 ? `+${formatted}` : formatted;
}

function invoiceQty(row: ServiceCompareRow, invoiceListed: boolean) {
  if (!invoiceListed) return "Not yet listed";
  return dashNumber(row.invoiceRoutePayments);
}

function invoiceAmount(row: ServiceCompareRow, invoiceListed: boolean) {
  if (!invoiceListed) return "Not yet listed";
  if (row.invoiceAmountCents == null) return "—";
  return formatUsd(row.invoiceAmountCents / 100);
}

function dashNumber(value: number | null) {
  return value == null ? "—" : formatNumber(value);
}

function isInvoiceStatus(value: string): value is InvoiceStatus {
  return value === "New" || value === "Paid";
}
