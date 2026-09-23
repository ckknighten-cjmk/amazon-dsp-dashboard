"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DvicBoard } from "@/components/dvic-board";
import { ExportCsvButton } from "@/components/export-csv-button";
import { PageHeader, EmptyState } from "@/components/page-header";
import { VehicleStatusBadge } from "@/components/ops-badges";
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
import { vehiclesCsv } from "@/lib/export/datasets";
import { formatMileage, vehicleStatusLabel, vehicleTypeLabel } from "@/lib/format";
import type { VehicleStatus, VehicleType } from "@/lib/types";

export default function FleetPage() {
  const vehicles = getVehicles();
  const yard = getFleetYard();
  const fleetExport = vehiclesCsv();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<VehicleStatus | "all">("all");
  const [type, setType] = useState<VehicleType | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (status !== "all" && v.status !== status) return false;
      if (type !== "all" && v.type !== type) return false;
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
  }, [vehicles, query, status, type]);

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
      />

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
        <p
          className="ml-auto text-xs text-muted-foreground tabular-nums"
          data-fleet-filtered={filtered.length}
          data-fleet-total={vehicles.length}
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
                const route = van.assignedRouteId
                  ? getRoute(van.assignedRouteId)
                  : undefined;
                return (
                  <TableRow key={van.id}>
                    <TableCell>
                      <p className="font-medium font-mono text-sm">{van.unitId || "—"}</p>
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
                        <Link
                          href={`/routes/${route.id}`}
                          className="font-medium hover:underline"
                        >
                          {route.code}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="max-w-56 text-muted-foreground">
                      <p className="truncate">{van.notes ?? "—"}</p>
                      {van.expiration ? (
                        <p className="text-xs">Expires {van.expiration}</p>
                      ) : null}
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
