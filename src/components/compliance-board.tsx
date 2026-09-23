"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { matchMethodLabel } from "@/lib/compliance/names";
import type {
  BreaksSummary,
  ComplianceReport,
  ExceptionRow,
  MealRow,
  UnmatchedRow,
} from "@/lib/compliance/types";
import { cn } from "@/lib/utils";

const WEEKS = [
  { week: 38, href: "/compliance", label: "Week 38" },
  { week: 39, href: "/compliance?week=39", label: "Week 39" },
] as const;

type View = "missing" | "over12" | "over60" | "meals" | "unmatched";

const VIEWS: Array<{ id: View; label: string }> = [
  { id: "missing", label: "Missing punches" },
  { id: "over12", label: "Over 12 hours" },
  { id: "over60", label: "Over 60 hours" },
  { id: "meals", label: "Meal breaks" },
  { id: "unmatched", label: "Unmatched names" },
];

export function ComplianceBoard({ report }: { report: ComplianceReport }) {
  const [view, setView] = useState<View>("missing");
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("all");
  const [mealScope, setMealScope] = useState<"mismatches" | "all">("mismatches");
  const [adpScope, setAdpScope] = useState<"punches" | "all">("punches");

  const counts = report.counts;

  return (
    <div
      data-week={report.week}
      data-missing={counts.missingPunchDays}
      data-over12={counts.over12Days}
      data-over60={counts.over60Associates}
      data-meals={counts.mealMismatches}
    >
      <PageHeader
        title="Compliance"
        description={`${report.company} · ${report.station}. Week ${report.week} timecard validation compares ADP punches with Amazon work blocks and scheduled shifts.`}
        actions={
          <div className="flex gap-1" role="group" aria-label="Compliance week">
            {WEEKS.map((item) => (
              <Link
                key={item.week}
                href={item.href}
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
        }
      />

      <p className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:text-amber-100">
        Sources: Amazon DSP Console Scheduling {report.weekLabel} (exported {report.exportedAt}) and
        Compliance Breaks; ADP Workforce Now Group Timecard, read-only. {report.sourceNote} ADP
        schedule template load is not part of this page.
      </p>

      <section aria-labelledby="compliance-kpis" className="mb-5">
        <h2 id="compliance-kpis" className="sr-only">
          Exception counts
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatButton
            label="Missing punches"
            value={String(counts.missingPunchDays)}
            hint={`${counts.missingPunchAssociates} associates · ${report.coverageLabel}`}
            pressed={view === "missing"}
            onClick={() => setView("missing")}
          />
          <StatButton
            label="Over 12h / day"
            value={String(counts.over12Days)}
            hint="ADP hours when punched"
            pressed={view === "over12"}
            onClick={() => setView("over12")}
          />
          <StatButton
            label="Over 60h / 7 days"
            value={String(counts.over60Associates)}
            hint="Captured ADP days only"
            pressed={view === "over60"}
            onClick={() => setView("over60")}
          />
          <StatButton
            label="Meal mismatches"
            value={String(counts.mealMismatches)}
            hint={`${counts.mealRowsJoined} break rows joined`}
            pressed={view === "meals"}
            onClick={() => setView("meals")}
          />
          <Card size="sm" className="min-w-0">
            <CardContent className="flex flex-col gap-1">
              <p className="text-xs font-medium text-muted-foreground">ADP days captured</p>
              <p className="font-heading text-2xl font-semibold tracking-tight">{report.coverageLabel}</p>
              <p className="text-xs text-muted-foreground">{report.coverageDetail}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card size="sm" className="mb-5 border-dashed">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-sm font-medium">ADP schedule templates</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {report.scheduleTemplateNote}
            </p>
          </div>
          <Button type="button" disabled>
            Load Week {report.week} into ADP
          </Button>
        </CardContent>
      </Card>

      <details className="mb-5 rounded-xl border bg-card px-4 py-3 text-sm" open>
        <summary className="cursor-pointer font-medium">Data coverage and what was not in the capture</summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-muted-foreground">
          {report.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {breaksTotalsSentence(report.breaksSummary)} Those totals are not copied into the exception
          tables except where a named row was visible.
        </p>
      </details>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Exception type">
          {VIEWS.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={view === item.id ? "default" : "outline"}
              aria-pressed={view === item.id}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search associate, ADP name, ID…"
          className="max-w-xs"
          aria-label="Search exceptions"
        />
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          aria-label="Filter by date"
        >
          <option value="all">All dates</option>
          {report.dateLabels.map((option) => (
            <option key={option.date} value={option.date}>
              {option.label}
            </option>
          ))}
        </select>
        {view === "meals" ? (
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
            value={mealScope}
            onChange={(event) => setMealScope(event.target.value as "mismatches" | "all")}
            aria-label="Meal row scope"
          >
            <option value="mismatches">Mismatches only</option>
            <option value="all">All joined break rows</option>
          </select>
        ) : null}
        {view === "unmatched" ? (
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
            value={adpScope}
            onChange={(event) => setAdpScope(event.target.value as "punches" | "all")}
            aria-label="Unmatched ADP scope"
          >
            <option value="punches">ADP with punches</option>
            <option value="all">All unmatched ADP</option>
          </select>
        ) : null}
      </div>

      {view === "missing" ? (
        <ExceptionTable
          rows={filterRows(report.missingPunches, query, date)}
          empty="No missing ADP punches for this filter. Flags are limited to days the Group Timecard captured."
        />
      ) : null}
      {view === "over12" ? (
        <ExceptionTable
          rows={filterRows(report.over12, query, date)}
          empty="No calendar day over 12 hours for this filter."
        />
      ) : null}
      {view === "over60" ? (
        <Over60Section report={report} query={query} date={date} />
      ) : null}
      {view === "meals" ? (
        <MealTable
          rows={filterRows(report.mealRows, query, date).filter((row) =>
            mealScope === "all" ? true : row.mismatch
          )}
          empty={
            report.mealRows.length === 0
              ? "No per-DA Amazon break rows were captured for this week, so meal mismatches are not scored."
              : mealScope === "mismatches"
                ? "No meal mismatches for this filter."
                : "No joined Amazon break rows for this filter."
          }
        />
      ) : null}
      {view === "unmatched" ? (
        <UnmatchedSection
          amazon={filterUnmatched(report.unmatchedAmazon, query, date)}
          adp={filterUnmatched(report.unmatchedAdp, query, date).filter((row) =>
            adpScope === "all" ? true : row.dateKeys.length > 0
          )}
        />
      ) : null}
    </div>
  );
}

function breaksTotalsSentence(summary: BreaksSummary) {
  const yesterday =
    summary.dasWithViolationsYesterday == null
      ? "yesterday was not in the capture"
      : `${summary.dasWithViolationsYesterday} yesterday`;
  return `Amazon Breaks dashboard totals for this week: ${summary.dasWithViolations} DAs with violations (${yesterday}), missing breaks ${summary.missingBreaks}, delayed ${summary.delayedBreaks}, shorter than required ${summary.shorterBreakThanRequired}, package delivered during break ${summary.packageDeliveredDuringBreak}, missing punches ${summary.missingPunches}/${summary.breaksBoardAssociates} DAs.`;
}

function StatButton({
  label,
  value,
  hint,
  pressed,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={cn("rounded-xl text-left", pressed && "ring-2 ring-ring")}
    >
      <Card size="sm" className="h-full min-w-0">
        <CardContent className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="font-heading text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      </Card>
    </button>
  );
}

function filterRows<T extends ExceptionRow>(rows: T[], query: string, date: string) {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (date !== "all" && row.date !== date) return false;
    if (!q) return true;
    return row.searchText.includes(q);
  });
}

function filterUnmatched(rows: UnmatchedRow[], query: string, date: string) {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (date !== "all" && !row.dateKeys.includes(date)) return false;
    if (!q) return true;
    return row.searchText.includes(q);
  });
}

function ExceptionTable({ rows, empty }: { rows: ExceptionRow[]; empty: string }) {
  if (rows.length === 0) return <EmptyState title="No rows" description={empty} />;
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Associate</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amazon times</TableHead>
            <TableHead>ADP times</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Rule</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <AssociateCell row={row} />
              </TableCell>
              <TableCell className="whitespace-nowrap">{row.dateLabel}</TableCell>
              <TableCell className="min-w-52">
                <Lines text={row.amazonTimes} />
              </TableCell>
              <TableCell className="min-w-48">
                <Lines text={row.adpTimes} />
              </TableCell>
              <TableCell className="whitespace-nowrap tabular-nums">{row.hoursLabel}</TableCell>
              <TableCell className="min-w-64 text-xs leading-relaxed text-muted-foreground">
                {row.rule}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="border-t px-3 py-2 text-xs text-muted-foreground tabular-nums">{rows.length} rows</p>
    </div>
  );
}

function MealTable({ rows, empty }: { rows: MealRow[]; empty: string }) {
  if (rows.length === 0) return <EmptyState title="No rows" description={empty} />;
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Associate</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amazon breaks</TableHead>
            <TableHead>ADP meal</TableHead>
            <TableHead>ADP times</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Rule</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <AssociateCell row={row} />
              </TableCell>
              <TableCell className="whitespace-nowrap">{row.dateLabel}</TableCell>
              <TableCell>
                <Badge variant={row.amazonStatus === "Non-compliant" ? "destructive" : "outline"}>
                  {row.amazonStatus}
                </Badge>
                <p className="mt-1 max-w-56 text-xs text-muted-foreground">
                  <Lines text={row.amazonTimes} />
                </p>
              </TableCell>
              <TableCell>
                <Badge variant={row.adpMeal === "Meal Punch" ? "secondary" : "outline"}>{row.adpMeal}</Badge>
              </TableCell>
              <TableCell className="min-w-48">
                <Lines text={row.adpTimes} />
              </TableCell>
              <TableCell className="whitespace-nowrap tabular-nums">{row.hoursLabel}</TableCell>
              <TableCell className="min-w-64 text-xs leading-relaxed text-muted-foreground">
                {row.rule}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="border-t px-3 py-2 text-xs text-muted-foreground tabular-nums">{rows.length} rows</p>
    </div>
  );
}

function Over60Section({
  report,
  query,
  date,
}: {
  report: ComplianceReport;
  query: string;
  date: string;
}) {
  const rows = filterRows(report.over60, query, date);
  const peak = report.over60Peak;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card px-4 py-3 text-sm">
        <p className="font-medium">Rolling 7-day windows ending in Week {report.week}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Each window is scored from Group Timecard hours on captured days only. Days the capture
          does not include are left unknown. They are not filled with zeros or with Amazon block
          duration.
        </p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          {report.over60Windows.map((window) => (
            <li key={window.label}>
              <span className="font-medium text-foreground">{window.label}.</span> {window.coverageLabel}.
            </li>
          ))}
        </ul>
        {peak ? (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Highest captured total is {peak.hoursLabel}h for {peak.associate} ({peak.adpName}) in{" "}
            {peak.windowLabel}. {peak.coverageLabel}.
          </p>
        ) : null}
      </div>
      <ExceptionTable
        rows={rows}
        empty={`No associate exceeded 60 hours on the ADP days captured inside any Week ${report.week} window.`}
      />
    </div>
  );
}

function UnmatchedSection({ amazon, adp }: { amazon: UnmatchedRow[]; adp: UnmatchedRow[] }) {
  return (
    <div className="space-y-6">
      <NameTable
        title="Unmatched Amazon roster"
        rows={amazon}
        secondaryLabel="Transporter ID"
        empty="Every Amazon associate with this filter matched an ADP name."
      />
      <NameTable
        title="Unmatched ADP timecard"
        rows={adp}
        secondaryLabel="Position ID"
        empty="Every ADP name with this filter matched the Amazon roster."
      />
    </div>
  );
}

function NameTable({
  title,
  rows,
  secondaryLabel,
  empty,
}: {
  title: string;
  rows: UnmatchedRow[];
  secondaryLabel: string;
  empty: string;
}) {
  return (
      <section aria-labelledby={title.replace(/\s+/g, "-").toLowerCase()}>
      <h2 id={title.replace(/\s+/g, "-").toLowerCase()} className="mb-2 text-sm font-semibold">
        {title}
      </h2>
      {rows.length === 0 ? (
        <EmptyState title="No rows" description={empty} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>{secondaryLabel}</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Why unmatched</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="font-mono text-xs">{row.secondary || "—"}</TableCell>
                  <TableCell>{row.detail}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="border-t px-3 py-2 text-xs text-muted-foreground tabular-nums">{rows.length} rows</p>
        </div>
      )}
    </section>
  );
}

function AssociateCell({ row }: { row: ExceptionRow }) {
  return (
    <div className="min-w-40">
      <p className="font-medium">{row.associate}</p>
      {row.adpName !== row.associate ? (
        <p className="text-xs text-muted-foreground">{row.adpName}</p>
      ) : null}
      {row.transporterId ? (
        <p className="font-mono text-[11px] text-muted-foreground">{row.transporterId}</p>
      ) : null}
      {row.matchMethod && row.matchMethod !== "exact" ? (
        <Badge variant="outline" className="mt-1">
          {matchMethodLabel(row.matchMethod)}
        </Badge>
      ) : null}
    </div>
  );
}

function Lines({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-xs leading-relaxed">
      {lines.map((line, index) => (
        <p key={`${index}-${line}`}>{line}</p>
      ))}
    </div>
  );
}
