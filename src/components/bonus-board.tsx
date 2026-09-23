"use client";

import { useMemo, useState } from "react";
import { ExportCsvButton } from "@/components/export-csv-button";
import { ExportExcelButton } from "@/components/export-excel-button";
import { useDateRange } from "@/components/layout/date-range-context";
import { EmptyState, PageHeader } from "@/components/page-header";
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
import { bonusDriverLabel, type BonusList } from "@/lib/data/bonus";
import { bonusCsv, bonusExcel } from "@/lib/export/bonus";
import { formatDate, formatRangeLabel, formatZonedDateTime } from "@/lib/format";
import { datesInRange } from "@/lib/period";

export function BonusBoard({ list }: { list: BonusList }) {
  const { range } = useDateRange();
  const [query, setQuery] = useState("");
  const weekDates = useMemo(() => list.dayCounts.map((day) => day.date), [list.dayCounts]);
  const allowedDates = useMemo(() => datesInRange(weekDates, range), [weekDates, range]);
  const allowed = useMemo(() => new Set(allowedDates), [allowedDates]);
  const fullWeek = weekDates.length > 0 && allowedDates.length === weekDates.length;
  const needle = query.trim().toLowerCase();
  const inPeriod = list.routes.filter((route) => allowed.has(route.date));
  const visible = inPeriod.filter((route) => {
    if (!needle) return true;
    const haystack = `${route.route} ${bonusDriverLabel(route.drivers)}`.toLowerCase();
    return haystack.includes(needle);
  });
  const visibleCounts = list.dayCounts.filter((day) => allowed.has(day.date));
  const csv = bonusCsv(list);
  const excel = bonusExcel(list);

  return (
    <div data-bonus-total={list.routes.length} data-bonus-visible={inPeriod.length}>
      <PageHeader
        title="10 Hour Bonus"
        description={`${list.station} · Week ${list.week} · ${list.period}. Routes with ${list.thresholdStopsCompleted}+ completed stops.`}
        actions={
          <>
            <ExportCsvButton filename={csv.filename} csv={csv.csv} label="Export CSV" />
            <ExportExcelButton filename={excel.filename} xml={excel.xml} label="Export Excel" />
          </>
        }
      />

      <p className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:text-amber-100">
        {list.disclaimer} Source: {list.source}. Captured {formatZonedDateTime(list.capturedAt)}.{" "}
        {allowedDates.length === 0
          ? `No Week ${list.week} days fall in ${formatRangeLabel(range)}. Routes are not copied onto empty days.`
          : fullWeek
            ? `Week ${list.week} is fully inside ${formatRangeLabel(range)}. ${list.routes.length} routes.`
            : `Showing Week ${list.week} days inside ${formatRangeLabel(range)}. ${inPeriod.length} of ${list.routes.length} routes.`}{" "}
        Export is the full Week {list.week} list ({list.routes.length} routes). Search does not change the file.
      </p>

      {allowedDates.length === 0 ? (
        <EmptyState
          title="No 10-hour bonus routes in this period"
          description={`${list.period}. Choose Sep 13–19, 2026 to see the ${list.routes.length} routes with ${list.thresholdStopsCompleted}+ completed stops.`}
        />
      ) : (
        <>
          <section aria-labelledby="bonus-days" className="mb-5">
            <h2 id="bonus-days" className="sr-only">
              Routes by day
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardContent className="pt-1">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    In this period
                  </p>
                  <p className="font-heading text-3xl font-semibold tabular-nums">{inPeriod.length}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {fullWeek
                      ? `${list.thresholdStopsCompleted}+ completed stops`
                      : `${list.routes.length} in the full Week ${list.week} seed`}
                  </p>
                </CardContent>
              </Card>
              {visibleCounts.map((day) => (
                <Card key={day.date}>
                  <CardContent className="pt-1">
                    <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                      {formatDate(day.date)}
                    </p>
                    <p className="font-heading text-3xl font-semibold tabular-nums">{day.count}</p>
                    <p className="mt-1 text-xs text-muted-foreground">routes</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <div className="mb-3 max-w-sm">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a route or driver"
              aria-label="Find a route or driver"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Drivers</TableHead>
                  <TableHead className="text-right">Stops completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No routes match that search in this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  visible.map((route) => (
                    <TableRow key={`${route.date}-${route.route}-${bonusDriverLabel(route.drivers)}`}>
                      <TableCell className="whitespace-nowrap">{formatDate(route.date)}</TableCell>
                      <TableCell className="font-medium">{route.route}</TableCell>
                      <TableCell>{bonusDriverLabel(route.drivers)}</TableCell>
                      <TableCell className="text-right tabular-nums">{route.stopsCompleted}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
