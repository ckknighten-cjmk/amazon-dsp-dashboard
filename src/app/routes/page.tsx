"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DeliveryBoardSummary } from "@/components/delivery-board";
import { PageHeader, EmptyState } from "@/components/page-header";
import { RouteDetail } from "@/components/route-detail";
import { ExceptionStatusBadge, RescueBadge, RouteStatusBadge } from "@/components/ops-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeliveryDayPicker } from "@/components/delivery-day-picker";
import { getDeliveryBoard, getDriver } from "@/lib/data";
import {
  deliveryDayExceptionsCsv,
  deliveryDayRoutesCsv,
  deliveryDaysInRange,
  describeDeliveryDay,
  detailDeliveryDay,
} from "@/lib/data/delivery-catalog";
import {
  exceptionExportNoteFor,
  rescueBoardNoteFor,
  type DeliveryDay,
} from "@/lib/data/delivery-execution";
import { useDateRange } from "@/components/layout/date-range-context";
import { useStation } from "@/components/layout/station-context";
import { StationEmptyPage } from "@/components/station-empty";
import { hasStationDataset } from "@/lib/data/station-seeds";
import { DELIVERY_COVERAGE, STATION_TODAY } from "@/lib/period";
import { ExportCsvButton } from "@/components/export-csv-button";
import { exceptionsCsv, routesCsv } from "@/lib/export/datasets";
import {
  CONSOLE_UNAVAILABLE,
  exceptionStatusLabel,
  formatCompletionPct,
  formatDateTime,
  formatNumber,
  routeStatusLabel,
  seedCapturedLabel,
} from "@/lib/format";
import type { PackageExceptionStatus, Route, RouteStatus } from "@/lib/types";

const STATUSES: Array<RouteStatus | "all"> = [
  "all",
  "in_progress",
  "incomplete",
  "no_progress",
  "completed",
  "not_started",
  "rescued",
];

const EXCEPTION_STATUSES: Array<PackageExceptionStatus | "all"> = [
  "all",
  "Reattemptable",
  "Undeliverable",
  "Missing",
  "Returned to station",
  "Pickup failed",
];

function associateNames(route: Route, day: DeliveryDay, live: boolean) {
  return route.associateIds
    .map((id) => (live ? getDriver(id)?.name : day.drivers.find((driver) => driver.id === id)?.name))
    .filter((name): name is string => Boolean(name));
}

const LIVE_DESCRIPTION =
  "Amazon DSP Console evening wrap for DNA4 Memphis / CJMK Inc., service day Oct 26, 2026, captured at 8:05 p.m. CT. Vehicle and on-time % were not on the Console — shown as unavailable. Execution gauges are the board graphics (locations 99%, stops 99%, packages 99%, attempt success 100%). 36 routes: 3 in progress (CX270, CX276, CX278); the other 33 are complete. CX276 is in progress at 173/181 stops and 7 ahead; CX278 is in progress at 128/129 stops and 25 ahead. The board ahead chip is 2.";

export default function RoutesPage() {
  const { code } = useStation();
  const { range } = useDateRange();
  const ready = hasStationDataset(code, "routes");
  const days = ready ? deliveryDaysInRange(range) : [];
  const detail = ready ? detailDeliveryDay(range) : null;
  const covered = detail != null;
  const liveBoard = detail?.serviceDate === STATION_TODAY;
  const routes = detail?.routes ?? [];
  const board = detail?.board ?? (ready ? getDeliveryBoard() : null);
  const exceptions = detail?.exceptions ?? [];
  const [tab, setTab] = useState<"routes" | "exceptions">("routes");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<RouteStatus | "all">("all");
  const [exStatus, setExStatus] = useState<PackageExceptionStatus | "all">("all");
  const [rescue, setRescue] = useState<"all" | "yes" | "no">("all");
  const [selected, setSelected] = useState<Route | null>(null);
  const rescuedCount = routes.filter((route) => route.receivedRescue).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return routes.filter((route) => {
      if (status !== "all" && route.status !== status) return false;
      if (rescue === "yes" && !route.receivedRescue) return false;
      if (rescue === "no" && route.receivedRescue) return false;
      if (!q) return true;
      const rescueText = route.receivedRescue ? "rescue yes" : "rescue no";
      const names = detail ? associateNames(route, detail, liveBoard) : [];
      return [route.code, route.notes, rescueText, ...names]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [routes, query, status, rescue, detail, liveBoard]);

  const filteredExceptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exceptions.filter((row) => {
      if (exStatus !== "all" && row.status !== exStatus) return false;
      if (!q) return true;
      return [row.scannableId, row.routeCode, row.transporterName, row.address, row.reasonCode]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [exceptions, query, exStatus]);

  if (!ready || !board) {
    return <StationEmptyPage title="Delivery Execution" station={code} />;
  }
  const routesExport = detail && !liveBoard ? deliveryDayRoutesCsv(detail) : routesCsv(code);
  const exceptionsExport = detail && !liveBoard ? deliveryDayExceptionsCsv(detail) : exceptionsCsv(code);

  return (
    <div>
      <PageHeader
        title="Delivery Execution"
        description={detail && !liveBoard ? describeDeliveryDay(detail) : LIVE_DESCRIPTION}
        updatedLabel={seedCapturedLabel(board.capturedAt)}
        seedAsOf={board.capturedAt}
        date={board.serviceDate}
      />

      {!covered || !detail ? (
        <EmptyState
          title="No Delivery Execution capture in this period"
          description={`${DELIVERY_COVERAGE.label}. Routes and package exceptions are not estimated for other days.`}
        />
      ) : (
        <>
      <DeliveryDayPicker days={days} selected={detail.serviceDate} />
      <p className="mb-4 text-xs text-muted-foreground">
        {liveBoard && days.length === 1
          ? `${DELIVERY_COVERAGE.label}.`
          : liveBoard
            ? `${DELIVERY_COVERAGE.label}. Other seeded days in this period are listed above.`
            : `Showing ${detail.serviceDate}. Pick another seeded day above when this period has more than one capture.`}
      </p>
      <DeliveryBoardSummary board={detail.board} routes={detail.routes} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Routes or exceptions"
          className="flex rounded-lg border bg-muted/40 p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "routes"}
            className={tabButton(tab === "routes")}
            onClick={() => setTab("routes")}
          >
            Routes · {routes.length}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "exceptions"}
            className={tabButton(tab === "exceptions")}
            onClick={() => setTab("exceptions")}
          >
            Exceptions · {exceptions.length}
          </button>
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            tab === "routes"
              ? "Search route, associate, notes…"
              : "Search tracking, route, DA, reason…"
          }
          className="max-w-xs"
          aria-label="Search"
        />
        {tab === "routes" ? (
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
            value={status}
            onChange={(e) => setStatus(e.target.value as RouteStatus | "all")}
            aria-label="Filter by status"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All statuses" : routeStatusLabel[s]}
              </option>
            ))}
          </select>
        ) : null}
        {tab === "routes" ? (
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
            value={rescue}
            onChange={(e) => setRescue(e.target.value as "all" | "yes" | "no")}
            aria-label="Filter by rescue"
          >
            <option value="all">Rescue: all</option>
            <option value="yes">Rescue: yes</option>
            <option value="no">Rescue: no</option>
          </select>
        ) : (
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
            value={exStatus}
            onChange={(e) => setExStatus(e.target.value as PackageExceptionStatus | "all")}
            aria-label="Filter by exception status"
          >
            {EXCEPTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All exception statuses" : exceptionStatusLabel[s]}
              </option>
            ))}
          </select>
        )}
        {tab === "routes" ? (
          <ExportCsvButton filename={routesExport.filename} csv={routesExport.csv} label="Export routes" />
        ) : (
          <ExportCsvButton
            filename={exceptionsExport.filename}
            csv={exceptionsExport.csv}
            label="Export exceptions"
          />
        )}
        <p className="ml-auto text-xs text-muted-foreground tabular-nums">
          {tab === "routes"
            ? `${filtered.length} of ${routes.length} routes`
            : `${filteredExceptions.length} of ${exceptions.length} packages`}
        </p>
      </div>

      {tab === "routes" ? (
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground" data-rescued={rescuedCount}>
          {rescueBoardNoteFor(detail)}
        </p>
      ) : (
        <p className="mb-3 text-xs text-muted-foreground">{exceptionExportNoteFor(detail)}</p>
      )}

      {tab === "routes" ? (
        filtered.length === 0 ? (
          <EmptyState
            title="No routes match"
            description="Clear search or status filter to see the full Console board."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Associates</TableHead>
                  <TableHead className="text-right">Stops</TableHead>
                  <TableHead className="text-right">Packages</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rescue</TableHead>
                  <TableHead className="min-w-32">Completion</TableHead>
                  <TableHead>Van / on-time</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((route) => {
                  const names = associateNames(route, detail, liveBoard);
                  const rescuerLabels = route.rescueDriverIds
                    .map((id) =>
                      liveBoard
                        ? getDriver(id)?.name
                        : detail.drivers.find((driver) => driver.id === id)?.name
                    )
                    .filter((name): name is string => Boolean(name));
                  const exCount = exceptions.filter((row) => row.routeId === route.id).length;
                  return (
                    <TableRow
                      key={route.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(route)}
                    >
                      <TableCell className="font-medium">
                        {liveBoard ? (
                          <Link
                            href={`/routes/${route.id}`}
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {route.code}
                          </Link>
                        ) : (
                          <span>{route.code}</span>
                        )}
                        {exCount > 0 ? (
                          <p className="text-xs font-normal text-muted-foreground">
                            {exCount} exception{exCount === 1 ? "" : "s"}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <p className="max-w-52 text-sm leading-snug">{names.join(", ") || "—"}</p>
                        {names.length > 1 ? (
                          <p className="text-[11px] text-muted-foreground">
                            {names.length} transporters
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(route.completedStops)}/{formatNumber(route.stopCount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(route.packagesDelivered)}/{formatNumber(route.packageCount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(route.packagesRemaining)}
                      </TableCell>
                      <TableCell>
                        <RouteStatusBadge status={route.status} />
                      </TableCell>
                      <TableCell>
                        <RescueBadge received={route.receivedRescue} />
                        {route.receivedRescue ? (
                          <p className="mt-1 max-w-40 text-[11px] leading-snug text-muted-foreground">
                            {rescuerLabels.join(", ")}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={Math.min(route.progressPct, 100)} className="min-w-20 flex-1" />
                          <span className="w-12 text-right text-xs tabular-nums">
                            {formatCompletionPct(route.progressPct)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {CONSOLE_UNAVAILABLE}
                      </TableCell>
                      <TableCell className="max-w-40 text-xs text-muted-foreground">
                        {route.notes ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )
      ) : filteredExceptions.length === 0 ? (
        <EmptyState
          title="No exception packages match"
          description="Clear search or status filter to see the Console exception export."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scannable</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Transporter</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Last scan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExceptions.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.scannableId}</TableCell>
                  <TableCell>
                    {liveBoard ? (
                      <Link href={`/routes/${row.routeId}`} className="font-medium hover:underline">
                        {row.routeCode}
                      </Link>
                    ) : (
                      <span className="font-medium">{row.routeCode}</span>
                    )}
                  </TableCell>
                  <TableCell>{row.transporterName || "—"}</TableCell>
                  <TableCell className="max-w-64 truncate" title={row.address}>
                    {row.address}
                  </TableCell>
                  <TableCell>
                    <ExceptionStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-xs">{row.reasonCode || "—"}</TableCell>
                  <TableCell className="tabular-nums text-xs">
                    {row.lastScan ? formatDateTime(row.lastScan) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Route detail</SheetTitle>
            <SheetDescription>
              Console Delivery Execution for the selected route, plus exception packages.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            {selected ? (
              <>
                <RouteDetail
                  route={selected}
                  exceptions={
                    liveBoard
                      ? undefined
                      : exceptions.filter((row) => row.routeId === selected.id)
                  }
                  serviceDate={liveBoard ? undefined : detail.serviceDate}
                />
                {liveBoard ? (
                  <Button
                    variant="outline"
                    className="mt-4"
                    nativeButton={false}
                    render={<Link href={`/routes/${selected.id}`} />}
                  >
                    Open full page
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
        </>
      )}
    </div>
  );
}

function tabButton(active: boolean) {
  return [
    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
  ].join(" ");
}
