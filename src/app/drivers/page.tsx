"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/page-header";
import { DriverStatusBadge } from "@/components/ops-badges";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExportCsvButton } from "@/components/export-csv-button";
import { associatesCsv } from "@/lib/export/datasets";
import { getDrivers, getRoute } from "@/lib/data";
import { employmentLabel } from "@/lib/data/census";
import { filterRoster, rosterSourceLabel } from "@/lib/data/roster";
import { driverStatusLabel, formatNumber, formatTenure } from "@/lib/format";
import { useDateRange } from "@/components/layout/date-range-context";
import { CoverageNote } from "@/components/period-coverage";
import { DELIVERY_COVERAGE, rangesOverlap } from "@/lib/period";
import type { Driver, DriverRole, DriverStatus, RosterSource } from "@/lib/types";

export default function DriversPage() {
  const { range } = useDateRange();
  const activity = rangesOverlap(DELIVERY_COVERAGE.start, DELIVERY_COVERAGE.end, range);
  const drivers = getDrivers();
  const rosterExport = associatesCsv();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<DriverStatus | "all">("all");
  const [role, setRole] = useState<DriverRole | "all">("all");
  const [source, setSource] = useState<RosterSource | "all">("all");
  const [employment, setEmployment] = useState<Driver["employmentStatus"] | "unlisted" | "all">("active");

  const filtered = useMemo(
    () =>
      filterRoster(drivers, { query, status, role, source, employment }, (driver) =>
        driver.routeIds.map((id) => getRoute(id)?.code ?? "")
      ),
    [drivers, query, status, role, source, employment]
  );

  return (
    <div>
      <PageHeader
        title="Associates"
        description="Full roster: Amazon schedule associates from Weeks 38 and 39, unioned by transporter ID, plus ADP-only timecard names. Today’s packages and routes come from the Sep 23 Delivery Execution board when the name matches. Phone and email come from the ADP Employee Census when the name matches. The list opens on Active, including associates the census did not list. Terminated and deceased stay on the employment filter. Tenure and scorecard contribution were not in these exports."
        actions={<ExportCsvButton filename={rosterExport.filename} csv={rosterExport.csv} label="Export roster" />}
      />

      <CoverageNote>
        {activity
          ? `${DELIVERY_COVERAGE.label}. Package counts, route links, and on-road status are that board. Schedule weeks 38 and 39 do not include daily package totals.`
          : `No associate activity in this period. ${DELIVERY_COVERAGE.label}. Package counts, routes, and on-road status are blank. The roster itself is not a daily metric.`}
      </CoverageNote>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, phone, email, or transporter ID…"
          className="max-w-xs"
          aria-label="Search associates"
        />
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
          value={status}
          onChange={(e) => setStatus(e.target.value as DriverStatus | "all")}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {(Object.keys(driverStatusLabel) as DriverStatus[]).map((s) => (
            <option key={s} value={s}>
              {driverStatusLabel[s]}
            </option>
          ))}
        </select>
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
          value={role}
          onChange={(e) => setRole(e.target.value as DriverRole | "all")}
          aria-label="Filter by role"
        >
          <option value="all">All roles</option>
          <option value="DA">DA</option>
          <option value="Dispatcher">Dispatcher</option>
          <option value="Station Manager">Station Manager</option>
        </select>
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
          value={source}
          onChange={(e) => setSource(e.target.value as RosterSource | "all")}
          aria-label="Filter by source"
        >
          <option value="all">All sources</option>
          <option value="amazon-schedule">Amazon schedule</option>
          <option value="adp-only">ADP only</option>
          <option value="delivery-board">Sep 23 board only</option>
        </select>
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
          value={employment}
          onChange={(e) =>
            setEmployment(e.target.value as Driver["employmentStatus"] | "unlisted" | "all")
          }
          aria-label="Filter by employment"
        >
          <option value="active">Active</option>
          <option value="terminated">Terminated</option>
          <option value="deceased">Deceased</option>
          <option value="unlisted">Not in census</option>
          <option value="all">All employment</option>
        </select>
        <p
          className="ml-auto text-xs text-muted-foreground tabular-nums"
          data-roster-filtered={filtered.length}
          data-roster-total={drivers.length}
        >
          {filtered.length} of {drivers.length} associates
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No associates match"
          description="Try a different name, status, or role."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Associate</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Employment</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tenure</TableHead>
                <TableHead className="text-right">Sep 23 pkgs</TableHead>
                <TableHead className="text-right">Scorecard</TableHead>
                <TableHead>Routes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((driver) => {
                const assigned = driver.routeIds
                  .map((id) => getRoute(id))
                  .filter((r): r is NonNullable<typeof r> => Boolean(r));
                return (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar size="sm">
                          <AvatarFallback>{driver.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{driver.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {driver.rosterSource === "adp-only"
                              ? `${driver.adpName ?? driver.name} · no transporter ID`
                              : (driver.transporterId ?? "—")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{driver.phone ?? "—"}</TableCell>
                    <TableCell className="text-xs">{driver.email ?? "—"}</TableCell>
                    <TableCell className="text-xs">{employmentLabel(driver.employmentStatus)}</TableCell>
                    <TableCell className="text-xs">{rosterSourceLabel(driver)}</TableCell>
                    <TableCell>{driver.role}</TableCell>
                    <TableCell>
                      {activity ? <DriverStatusBadge status={driver.status} /> : "—"}
                    </TableCell>
                    <TableCell>{formatTenure(driver.hiredAt)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {activity ? formatNumber(driver.todayPackages) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {driver.scorecardContribution ?? "—"}
                    </TableCell>
                    <TableCell>
                      {!activity || assigned.length === 0 ? (
                        "—"
                      ) : (
                        <span className="flex flex-wrap gap-x-2 gap-y-0.5">
                          {assigned.map((route) => (
                            <Link
                              key={route.id}
                              href={`/routes/${route.id}`}
                              className="font-medium hover:underline"
                            >
                              {route.code}
                            </Link>
                          ))}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
