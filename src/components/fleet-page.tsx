"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DvicBoard } from "@/components/dvic-board";
import { ExportCsvButton } from "@/components/export-csv-button";
import { NewDamagePanel } from "@/components/new-damage-panel";
import { PageHeader, EmptyState } from "@/components/page-header";
import { VehicleStatusBadge } from "@/components/ops-badges";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getFleetYard, getRoute, getVehicles } from "@/lib/data";
import { getDvicReport } from "@/lib/data/dvic";
import { vehiclesCsv } from "@/lib/export/datasets";
import { CoverageNote } from "@/components/period-coverage";
import { buildFleetIssueDayReport, vehicleHasNewDamage } from "@/lib/fleet-issues/detect";
import type { FleetIssueCatalog } from "@/lib/fleet-issues/types";
import { formatMileage, seedCapturedLabel, vehicleStatusLabel, vehicleTypeLabel } from "@/lib/format";
import { DVIC_COVERAGE, STATION_TODAY } from "@/lib/period";
import { cn } from "@/lib/utils";
import type { VehicleStatus, VehicleType } from "@/lib/types";

export function FleetPageClient({ catalog }: { catalog: FleetIssueCatalog }) {
  const vehicles = getVehicles();
  const yard = getFleetYard();
  const fleetExport = vehiclesCsv();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<VehicleStatus | "all">("all");
  const [type, setType] = useState<VehicleType | "all">("all");
  const [newDamageOnly, setNewDamageOnly] = useState(false);
  const [selectedDay, setSelectedDay] = useState(catalog.newest?.captureDay ?? STATION_TODAY);

  const report = useMemo(() => {
    if (!catalog.newest) return null;
    return buildFleetIssueDayReport({
      current: catalog.newest.issues,
      previous: catalog.previous?.issues ?? null,
      previousDate: catalog.previous?.date ?? null,
      day: selectedDay,
    });
  }, [catalog.newest, catalog.previous, selectedDay]);

  const newDamage = useMemo(() => report?.created.damage ?? [], [report]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (status !== "all" && v.status !== status) return false;
      if (type !== "all" && v.type !== type) return false;
      if (newDamageOnly && !vehicleHasNewDamage(v, newDamage)) return false;
      if (!q) return true;
      return [
        v.unitId,
        v.plate,
        v.vin,
        v.makeModel,
        v.ownership,
        v.consoleStatus,
        v.consoleType,
        v.notes,
        vehicleTypeLabel[v.type],
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [vehicles, query, status, type, newDamageOnly, newDamage]);

  return (
    <div>
      <PageHeader
        title="Fleet"
        description={
          yard.origin === "console"
            ? `DNA4 My vehicles from ${yard.nav}${yard.capturedAt ? `, captured ${yard.capturedAt}` : ""}. ${vehicles.length} vehicles. Year and mileage were blank in that export, so those cells stay empty. A blank unit is shown as an em dash; the plate is the identifier Console published.`
            : "This table is the mock yard. It is used only when amazon-fleet-dna4.json has no vehicles."
        }
        actions={<ExportCsvButton filename={fleetExport.filename} csv={fleetExport.csv} label="Export fleet" />}
        updatedLabel={seedCapturedLabel(yard.capturedAt)}
        seedAsOf={yard.capturedAt}
        date={getDvicReport().serviceDate}
      />

      <NewDamagePanel
        newest={catalog.newest}
        previous={catalog.previous}
        snapshotCount={catalog.dates.length}
        report={report}
        selectedDay={selectedDay}
        onSelectedDayChange={setSelectedDay}
      />

      <CoverageNote>
        Vehicle status is the My vehicles snapshot, not a day-by-day history. Last route is a
        relative Console phrase, so it is not filtered by the period. Inspections use the DVIC
        capture. {DVIC_COVERAGE.label}. New damage uses the open-issues snapshot and its own day
        selector.
      </CoverageNote>

      <DvicBoard />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search unit, plate, or VIN…"
          className="max-w-xs"
          aria-label="Search vehicles"
        />
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
          value={status}
          onChange={(e) => setStatus(e.target.value as VehicleStatus | "all")}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {(Object.keys(vehicleStatusLabel) as VehicleStatus[]).map((s) => (
            <option key={s} value={s}>
              {vehicleStatusLabel[s]}
            </option>
          ))}
        </select>
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
          value={type}
          onChange={(e) => setType(e.target.value as VehicleType | "all")}
          aria-label="Filter by type"
        >
          <option value="all">All types</option>
          {(Object.keys(vehicleTypeLabel) as VehicleType[]).map((t) => (
            <option key={t} value={t}>
              {vehicleTypeLabel[t]}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-pressed={newDamageOnly}
          onClick={() => setNewDamageOnly((current) => !current)}
          className={cn(
            "h-8 rounded-lg border px-2.5 text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            newDamageOnly
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-input bg-transparent text-foreground dark:bg-input/30"
          )}
        >
          New damage only
        </button>
        <p
          className="ml-auto text-xs text-muted-foreground tabular-nums"
          data-fleet-filtered={filtered.length}
          data-fleet-total={vehicles.length}
          data-new-damage-only={newDamageOnly ? "yes" : "no"}
        >
          {filtered.length} of {vehicles.length} vehicles
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No vans match" description="Clear filters to see the full yard." />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Make/model</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Mileage</TableHead>
                <TableHead>Last route</TableHead>
                <TableHead>Assigned today</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((van) => {
                const route = van.assignedRouteId ? getRoute(van.assignedRouteId) : undefined;
                const isNew = vehicleHasNewDamage(van, newDamage);
                return (
                  <TableRow key={van.id} data-new-damage={isNew ? "yes" : "no"}>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium font-mono text-sm">{van.unitId || "—"}</p>
                        {isNew ? (
                          <span data-new-damage-badge="true">
                            <Badge variant="destructive">NEW</Badge>
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {van.year ?? "—"} · {van.plate}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p>{van.makeModel ?? "—"}</p>
                      {van.vin ? (
                        <p className="font-mono text-xs text-muted-foreground">{van.vin}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>{vehicleTypeLabel[van.type]}</TableCell>
                    <TableCell>
                      <VehicleStatusBadge status={van.status} />
                      {van.consoleStatus ? (
                        <p className="mt-1 text-xs text-muted-foreground">{van.consoleStatus}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {van.mileage == null ? "—" : formatMileage(van.mileage)}
                    </TableCell>
                    <TableCell>{van.lastRouteCompleted ?? "—"}</TableCell>
                    <TableCell>
                      {route ? (
                        <Link href={`/routes/${route.id}`} className="font-medium hover:underline">
                          {route.code}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="max-w-56 text-muted-foreground">
                      <p className="truncate">{van.notes ?? "—"}</p>
                      {van.expiration ? <p className="text-xs">Expires {van.expiration}</p> : null}
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
