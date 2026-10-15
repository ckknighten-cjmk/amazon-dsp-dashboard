"use client";

import { ExportCsvButton } from "@/components/export-csv-button";
import { ExportExcelButton } from "@/components/export-excel-button";
import { EmptyState } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
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
import { newDamageCsv, newDamageExcel } from "@/lib/export/fleet-issues";
import { formatZonedDateTime, seedCapturedLabel } from "@/lib/format";
import {
  DRIVER_CHECKS_PASSED_FLAG,
  defectText,
  type FleetIssueDayReport,
} from "@/lib/fleet-issues/detect";
import { OTHER_ISSUE_TYPES, type FleetIssue, type FleetIssueSnapshot } from "@/lib/fleet-issues/types";
import { shiftIsoDate } from "@/lib/fleet-issues/time";
import { STATION_TODAY } from "@/lib/period";
import { cn } from "@/lib/utils";

const YESTERDAY = shiftIsoDate(STATION_TODAY, -1);

export function NewDamagePanel({
  newest,
  previous,
  snapshotCount,
  report,
  selectedDay,
  onSelectedDayChange,
}: {
  newest: FleetIssueSnapshot | null;
  previous: FleetIssueSnapshot | null;
  snapshotCount: number;
  report: FleetIssueDayReport | null;
  selectedDay: string;
  onSelectedDayChange: (day: string) => void;
}) {
  return (
    <section aria-labelledby="new-damage-heading" className="mb-6" data-new-damage-day={selectedDay}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="new-damage-heading" className="text-sm font-semibold">
            New damage
          </h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Inspection defects created on the selected day. Self-reported maintenance, preventative
            maintenance, safety signals, and odometer defects stay in their own counts.
          </p>
        </div>
        {report ? <DamageExports report={report} /> : null}
      </div>

      <DaySelector selectedDay={selectedDay} onSelectedDayChange={onSelectedDayChange} />

      {!newest || !report ? (
        <EmptyState
          title="No issues snapshot"
          description="Add a dated file under src/lib/data/seed/fleet-issues. The newest file is used automatically."
          className="py-8"
        />
      ) : (
        <DamageBody newest={newest} previous={previous} snapshotCount={snapshotCount} report={report} />
      )}
    </section>
  );
}

function DaySelector({
  selectedDay,
  onSelectedDayChange,
}: {
  selectedDay: string;
  onSelectedDayChange: (day: string) => void;
}) {
  const options = [
    { day: STATION_TODAY, label: "Today" },
    { day: YESTERDAY, label: "Yesterday" },
  ];
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="New damage day">
      <div className="flex rounded-lg border bg-muted/40 p-0.5">
        {options.map((option) => {
          const selected = selectedDay === option.day;
          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelectedDayChange(option.day)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Date
        <Input
          type="date"
          value={selectedDay}
          aria-label="New damage date"
          className="w-auto"
          onChange={(event) => {
            if (event.target.value) onSelectedDayChange(event.target.value);
          }}
        />
      </label>
    </div>
  );
}

function DamageBody({
  newest,
  previous,
  snapshotCount,
  report,
}: {
  newest: FleetIssueSnapshot;
  previous: FleetIssueSnapshot | null;
  snapshotCount: number;
  report: FleetIssueDayReport;
}) {
  const captured = seedCapturedLabel(newest.capturedAt) ?? newest.capturedAt;
  const otherCount = OTHER_ISSUE_TYPES.reduce((sum, issueType) => sum + report.created.other[issueType].length, 0);

  return (
    <div data-new-damage-count={report.created.damage.length} data-compare={report.comparable ? "ready" : "unavailable"}>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        {newest.station}. {captured}. {newest.totalResultsShown}. Source {newest.source}.
      </p>
      {snapshotCount < 2 || !previous ? (
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground" data-snapshot-compare="single">
          Only the {newest.date} snapshot is loaded, so nothing can be compared with a previous capture yet.
          The table lists defects created on the selected day.
        </p>
      ) : (
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground" data-snapshot-compare="previous">
          Compared with the {previous.date} snapshot. {report.diffDamage.length} inspection defects in the{" "}
          {newest.date} capture were not in that snapshot.
        </p>
      )}

      <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Count label="New damage" value={report.created.damage.length} emphasize />
        {OTHER_ISSUE_TYPES.map((issueType) => (
          <Count key={issueType} label={otherLabel(issueType)} value={report.created.other[issueType].length} />
        ))}
      </div>

      {report.created.damage.length === 0 ? (
        <EmptyState
          title="No new inspection damage"
          description={`No inspection defects were created on ${selectedLabel(report.day)}.`}
          className="py-8"
        />
      ) : (
        <DamageTable issues={report.created.damage} />
      )}

      {otherCount > 0 ? (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium">Other issues created this day</h3>
          <p className="mb-2 text-xs text-muted-foreground">
            These rows are open issues from the same day. They are separate from the new-damage count.
          </p>
          <OtherTable report={report} />
        </div>
      ) : null}
    </div>
  );
}

function DamageTable({ issues }: { issues: FleetIssue[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle</TableHead>
            <TableHead>Plate</TableHead>
            <TableHead>Defect</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Repair status</TableHead>
            <TableHead>Operational status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Driver checks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <TableRow key={issue.rowId} data-vehicle={issue.vehicleName || issue.plate} data-plate={issue.plate}>
              <TableCell>
                <p className="font-medium">{issue.vehicleName || "—"}</p>
                <p className="font-mono text-xs text-muted-foreground">{issue.vin}</p>
              </TableCell>
              <TableCell className="font-mono text-sm">{issue.plate}</TableCell>
              <TableCell className="max-w-xs text-sm">{defectText(issue)}</TableCell>
              <TableCell>
                <SeverityBadge severity={issue.severity} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">{formatZonedDateTime(issue.createdAt)}</TableCell>
              <TableCell className="text-sm">
                <p>{issue.repairStatus}</p>
                {issue.repairNote ? <p className="text-xs text-muted-foreground">{issue.repairNote}</p> : null}
              </TableCell>
              <TableCell className="text-sm">{issue.operationalStatus}</TableCell>
              <TableCell className="text-sm">
                {issue.detail ? (
                  <>
                    <p>{issue.detail.sourceInspection}</p>
                    {issue.detail.inspector ? <p className="text-xs text-muted-foreground">{issue.detail.inspector}</p> : null}
                    <p className="text-xs text-muted-foreground">Found {formatZonedDateTime(issue.detail.foundAt)}</p>
                  </>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="max-w-xs text-sm">
                <DriverCheckCell issue={issue} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function OtherTable({ report }: { report: FleetIssueDayReport }) {
  const rows = OTHER_ISSUE_TYPES.flatMap((issueType) =>
    report.created.other[issueType].map((issue) => ({ issueType, issue }))
  );
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Issue type</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Plate</TableHead>
            <TableHead>Defect</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Repair status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ issueType, issue }) => (
            <TableRow key={`${issueType}-${issue.rowId}`} data-other-issue={issueType}>
              <TableCell className="text-sm">{issueType}</TableCell>
              <TableCell className="text-sm">{issue.vehicleName || "—"}</TableCell>
              <TableCell className="font-mono text-sm">{issue.plate}</TableCell>
              <TableCell className="max-w-xs text-sm">{defectText(issue)}</TableCell>
              <TableCell>
                <SeverityBadge severity={issue.severity} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">{formatZonedDateTime(issue.createdAt)}</TableCell>
              <TableCell className="text-sm">{issue.repairStatus}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DriverCheckCell({ issue }: { issue: FleetIssue }) {
  const detail = issue.detail;
  if (!detail) return "—";
  return (
    <div>
      <p>
        {checkPhrase("Pre-trip", detail.preTripPassed)} · {checkPhrase("Post-trip", detail.postTripPassed)}
      </p>
      {detail.otherInspectionsToday ? (
        <p className="mt-1 text-xs text-muted-foreground">{detail.otherInspectionsToday}</p>
      ) : null}
      {detail.damageFoundAfterDriverChecksPassed ? (
        <Badge variant="destructive" className="mt-1">
          {DRIVER_CHECKS_PASSED_FLAG}
        </Badge>
      ) : null}
    </div>
  );
}

function checkPhrase(label: string, passed: boolean | null) {
  if (passed == null) return `${label} not listed`;
  return passed ? `${label} passed` : `${label} failed`;
}

function DamageExports({ report }: { report: FleetIssueDayReport }) {
  const csv = newDamageCsv(report);
  const excel = newDamageExcel(report);
  return (
    <div className="flex flex-wrap gap-2">
      <ExportCsvButton filename={csv.filename} csv={csv.csv} label="Export new damage" />
      <ExportExcelButton filename={excel.filename} xml={excel.xml} label="Export Excel" />
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const high = severity === "High";
  return <Badge variant={high ? "destructive" : "outline"}>{severity}</Badge>;
}

function Count({ label, value, emphasize = false }: { label: string; value: number; emphasize?: boolean }) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p
          className={cn(
            "font-heading text-2xl font-semibold tabular-nums tracking-tight",
            emphasize && value > 0 && "text-destructive"
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function otherLabel(issueType: (typeof OTHER_ISSUE_TYPES)[number]) {
  if (issueType === "Self reported maintenance") return "Self-reported";
  if (issueType === "Preventative maintenance") return "Preventative";
  if (issueType === "Vehicle safety signals") return "Safety signals";
  return "Odometer";
}

function selectedLabel(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(year, month - 1, date)
  );
}
