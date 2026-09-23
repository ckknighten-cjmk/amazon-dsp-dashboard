"use client";

import { useMemo, useState } from "react";
import { ExportCsvButton } from "@/components/export-csv-button";
import { ExportExcelButton } from "@/components/export-excel-button";
import { useDateRange } from "@/components/layout/date-range-context";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { bonusCoDriverLabel, type BonusList } from "@/lib/data/bonus";
import { bonusCsv, bonusExcel } from "@/lib/export/bonus";
import { formatDate, formatRangeLabel, formatZonedDateTime } from "@/lib/format";
import { datesInRange } from "@/lib/period";
import { cn } from "@/lib/utils";

type AttributionFilter = "all" | "solo" | "multi";

const FILTERS: Array<{ id: AttributionFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "solo", label: "Solo" },
  { id: "multi", label: "Multi-transporter" },
];

export function BonusBoard({ list }: { list: BonusList }) {
  const { range } = useDateRange();
  const [query, setQuery] = useState("");
  const [attribution, setAttribution] = useState<AttributionFilter>("all");
  const weekDates = useMemo(() => list.dayCounts.map((day) => day.date), [list.dayCounts]);
  const allowedDates = useMemo(() => datesInRange(weekDates, range), [weekDates, range]);
  const allowed = useMemo(() => new Set(allowedDates), [allowedDates]);
  const fullWeek = weekDates.length > 0 && allowedDates.length === weekDates.length;
  const needle = query.trim().toLowerCase();
  const inPeriod = list.entries.filter((entry) => allowed.has(entry.date));
  const soloInPeriod = inPeriod.filter((entry) => !entry.multiTransporter).length;
  const multiInPeriod = inPeriod.length - soloInPeriod;
  const visible = inPeriod.filter((entry) => {
    if (attribution === "solo" && entry.multiTransporter) return false;
    if (attribution === "multi" && !entry.multiTransporter) return false;
    if (!needle) return true;
    const haystack = `${entry.deliveryAssociate} ${entry.route} ${bonusCoDriverLabel(entry.coDrivers)}`.toLowerCase();
    return haystack.includes(needle);
  });
  const visibleCounts = list.dayCounts.filter((day) => allowed.has(day.date));
  const csv = bonusCsv(list);
  const excel = bonusExcel(list);

  return (
    <div
      data-bonus-total={list.entries.length}
      data-bonus-visible={inPeriod.length}
      data-bonus-solo={list.soloCount}
      data-bonus-multi={list.multiTransporterCount}
    >
      <PageHeader
        title="10 Hour Bonus"
        description={`${list.station} · Week ${list.week} · ${list.period}. Delivery associates on routes with ${list.thresholdStopsCompleted}+ completed stops.`}
        actions={
          <>
            <ExportCsvButton filename={csv.filename} csv={csv.csv} label="Export CSV" />
            <ExportExcelButton filename={excel.filename} xml={excel.xml} label="Export Excel" />
          </>
        }
      />

      <p className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:text-amber-100">
        {list.disclaimer}{" "}
        {list.source ? `Source: ${list.source}. ` : null}
        {list.capturedAt ? `Captured ${formatZonedDateTime(list.capturedAt)}. ` : null}
        {allowedDates.length === 0
          ? `No Week ${list.week} days fall in ${formatRangeLabel(range)}. Associates are not copied onto empty days.`
          : fullWeek
            ? `Week ${list.week} is fully inside ${formatRangeLabel(range)}. ${list.soloCount} solo DAs and ${list.multiTransporterCount} multi-transporter DA rows.`
            : `Showing Week ${list.week} days inside ${formatRangeLabel(range)}. ${soloInPeriod} solo and ${multiInPeriod} multi-transporter rows in this period.`}{" "}
        Export is the full Week {list.week} associate list ({list.entries.length} rows). Search and the solo filter do not change the file.
      </p>

      {allowedDates.length === 0 ? (
        <EmptyState
          title="No 10-hour bonus associates in this period"
          description={`${list.period}. Choose Sep 13–19, 2026 to see the ${list.soloCount} solo DAs and ${list.multiTransporterCount} flagged multi-transporter rows.`}
        />
      ) : (
        <>
          <section aria-labelledby="bonus-days" className="mb-5">
            <h2 id="bonus-days" className="sr-only">
              Associates by day
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardContent className="pt-1">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Solo DAs
                  </p>
                  <p className="font-heading text-3xl font-semibold tabular-nums">{soloInPeriod}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Clear attribution in this period</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-1">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Multi-transporter
                  </p>
                  <p className="font-heading text-3xl font-semibold tabular-nums">{multiInPeriod}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Flagged. Route total is not split.</p>
                </CardContent>
              </Card>
              {visibleCounts.map((day) => (
                <Card key={day.date}>
                  <CardContent className="pt-1">
                    <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                      {formatDate(day.date)}
                    </p>
                    <p className="font-heading text-3xl font-semibold tabular-nums">{day.solo}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      solo · {day.multiTransporter} multi
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="flex gap-1" role="group" aria-label="Attribution">
              {FILTERS.map((filter) => (
                <Button
                  key={filter.id}
                  type="button"
                  size="sm"
                  variant={attribution === filter.id ? "default" : "outline"}
                  aria-pressed={attribution === filter.id}
                  onClick={() => setAttribution(filter.id)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a delivery associate"
              aria-label="Find a delivery associate"
              className="max-w-sm"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Delivery associate</TableHead>
                  <TableHead className="text-right">Stops completed</TableHead>
                  <TableHead>Route</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No delivery associates match that search in this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  visible.map((entry) => (
                    <TableRow
                      key={`${entry.date}-${entry.route}-${entry.deliveryAssociate}`}
                      data-multi={entry.multiTransporter ? "yes" : "no"}
                    >
                      <TableCell className="whitespace-nowrap">{formatDate(entry.date)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{entry.deliveryAssociate}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-md border px-1.5 font-medium tracking-wide",
                              entry.multiTransporter
                                ? "border-amber-400/50 bg-amber-500/10 text-amber-950 dark:border-amber-500/40 dark:text-amber-200"
                                : "border-emerald-400/50 bg-emerald-500/10 text-emerald-900 dark:border-emerald-500/40 dark:text-emerald-200"
                            )}
                          >
                            {entry.multiTransporter ? "Multi-transporter" : "Solo"}
                          </Badge>
                        </div>
                        {entry.multiTransporter ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            With {bonusCoDriverLabel(entry.coDrivers)}. Route total, not attributed to one DA.
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{entry.stopsCompleted}</TableCell>
                      <TableCell className="text-muted-foreground">{entry.route}</TableCell>
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
