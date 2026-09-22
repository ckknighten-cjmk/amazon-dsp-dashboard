"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/page-header";
import {
  IncidentStatusBadge,
  IncidentTypeBadge,
  SeverityBadge,
} from "@/components/ops-badges";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDriver, getIncidents, getRoute, getVehicle } from "@/lib/data";
import {
  formatDateTime,
  incidentStatusLabel,
  incidentTypeLabel,
} from "@/lib/format";
import type { IncidentStatus, IncidentType } from "@/lib/types";

export default function IncidentsPage() {
  const incidents = getIncidents();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<IncidentType | "all">("all");
  const [status, setStatus] = useState<IncidentStatus | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return incidents.filter((i) => {
      if (type !== "all" && i.type !== type) return false;
      if (status !== "all" && i.status !== status) return false;
      if (!q) return true;
      const driver = getDriver(i.driverId);
      const route = i.routeId ? getRoute(i.routeId) : undefined;
      const vehicle = getVehicle(i.vehicleId);
      return [i.title, i.notes, driver?.name, route?.code, vehicle?.unitId]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [incidents, query, type, status]);

  const openCount = incidents.filter((i) => i.status === "open").length;

  return (
    <div>
      <PageHeader
        title="Incidents & notes"
        description={`${openCount} open. DVRs, customer complaints, vehicle issues, and safety events.`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes, DA, route…"
          className="max-w-xs"
          aria-label="Search incidents"
        />
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
          value={type}
          onChange={(e) => setType(e.target.value as IncidentType | "all")}
          aria-label="Filter by type"
        >
          <option value="all">All types</option>
          {(Object.keys(incidentTypeLabel) as IncidentType[]).map((t) => (
            <option key={t} value={t}>
              {incidentTypeLabel[t]}
            </option>
          ))}
        </select>
        <select
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm dark:bg-input/30"
          value={status}
          onChange={(e) => setStatus(e.target.value as IncidentStatus | "all")}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {(Object.keys(incidentStatusLabel) as IncidentStatus[]).map((s) => (
            <option key={s} value={s}>
              {incidentStatusLabel[s]}
            </option>
          ))}
        </select>
        <p className="ml-auto text-xs text-muted-foreground tabular-nums">
          {filtered.length} of {incidents.length}
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No incidents match"
          description="Clear search or filters to see the full log."
        />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Linked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((incident) => {
                const driver = getDriver(incident.driverId);
                const route = incident.routeId
                  ? getRoute(incident.routeId)
                  : undefined;
                const vehicle = getVehicle(incident.vehicleId);
                return (
                  <TableRow key={incident.id}>
                    <TableCell className="whitespace-nowrap text-xs tabular-nums">
                      {formatDateTime(incident.occurredAt)}
                    </TableCell>
                    <TableCell>
                      <IncidentTypeBadge type={incident.type} />
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={incident.severity} />
                    </TableCell>
                    <TableCell>
                      <IncidentStatusBadge status={incident.status} />
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="font-medium">{incident.title}</p>
                      <p className="text-xs text-muted-foreground">{incident.notes}</p>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex flex-col gap-0.5">
                        {route ? (
                          <Link
                            href={`/routes/${route.id}`}
                            className="font-medium hover:underline"
                          >
                            {route.code}
                          </Link>
                        ) : null}
                        {driver ? <span>{driver.name}</span> : null}
                        {vehicle ? (
                          <span className="font-mono">{vehicle.unitId}</span>
                        ) : null}
                        {!route && !driver && !vehicle ? "—" : null}
                      </div>
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
