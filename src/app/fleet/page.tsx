"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { getRoute, getVehicles } from "@/lib/data";
import {
  formatDate,
  formatMileage,
  vehicleStatusLabel,
  vehicleTypeLabel,
} from "@/lib/format";
import type { VehicleStatus, VehicleType } from "@/lib/types";

export default function FleetPage() {
  const vehicles = getVehicles();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<VehicleStatus | "all">("all");
  const [type, setType] = useState<VehicleType | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (status !== "all" && v.status !== status) return false;
      if (type !== "all" && v.type !== type) return false;
      if (!q) return true;
      return [v.unitId, v.plate, v.notes, vehicleTypeLabel[v.type]]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [vehicles, query, status, type]);

  return (
    <div>
      <PageHeader
        title="Fleet"
        description="Yard roster is still mock. Console Delivery Execution for Sep 22 did not include vehicle IDs, so vans are not linked to live routes."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search unit ID or plate…"
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
        <p className="ml-auto text-xs text-muted-foreground tabular-nums">
          {filtered.length} of {vehicles.length}
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
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Mileage</TableHead>
                <TableHead>Last inspection</TableHead>
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
                      <p className="font-medium font-mono text-sm">{van.unitId}</p>
                      <p className="text-xs text-muted-foreground">
                        {van.year} · {van.plate}
                      </p>
                    </TableCell>
                    <TableCell>{vehicleTypeLabel[van.type]}</TableCell>
                    <TableCell>
                      <VehicleStatusBadge status={van.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMileage(van.mileage)}
                    </TableCell>
                    <TableCell>{formatDate(van.lastInspection)}</TableCell>
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
                    <TableCell className="max-w-56 truncate text-muted-foreground">
                      {van.notes ?? "—"}
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
