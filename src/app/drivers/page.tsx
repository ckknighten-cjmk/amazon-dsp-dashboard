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
import { getDrivers, getRoute } from "@/lib/data";
import { driverStatusLabel, formatNumber, formatTenure } from "@/lib/format";
import type { DriverRole, DriverStatus } from "@/lib/types";

export default function DriversPage() {
  const drivers = getDrivers();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<DriverStatus | "all">("all");
  const [role, setRole] = useState<DriverRole | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drivers.filter((d) => {
      if (status !== "all" && d.status !== status) return false;
      if (role !== "all" && d.role !== role) return false;
      if (!q) return true;
      const codes = d.routeIds.map((id) => getRoute(id)?.code ?? "").join(" ");
      return [d.name, d.role, d.phone, d.transporterId, codes].join(" ").toLowerCase().includes(q);
    });
  }, [drivers, query, status, role]);

  return (
    <div>
      <PageHeader
        title="Associates"
        description="Names from the DNA4 Delivery Execution board for Sep 21, 2026. Multi-transporter routes list every associate. Tenure, phone, and scorecard contribution were not on the Console."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, route, or transporter ID…"
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
        <p className="ml-auto text-xs text-muted-foreground tabular-nums">
          {filtered.length} of {drivers.length}
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
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tenure</TableHead>
                <TableHead className="text-right">Today pkgs</TableHead>
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
                            {driver.transporterId ?? driver.phone ?? "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{driver.role}</TableCell>
                    <TableCell>
                      <DriverStatusBadge status={driver.status} />
                    </TableCell>
                    <TableCell>{formatTenure(driver.hiredAt)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(driver.todayPackages)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {driver.scorecardContribution ?? "—"}
                    </TableCell>
                    <TableCell>
                      {assigned.length === 0 ? (
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
