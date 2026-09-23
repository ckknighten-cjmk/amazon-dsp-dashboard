"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  driverStatusLabel,
  incidentSeverityLabel,
  incidentStatusLabel,
  incidentTypeLabel,
  exceptionStatusLabel,
  routeStatusLabel,
  scorecardTierLabel,
  stopStatusLabel,
  vehicleStatusLabel,
} from "@/lib/format";
import type {
  DriverStatus,
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
  InvoiceStatus,
  PackageExceptionStatus,
  RouteStatus,
  ScorecardTier,
  StopStatus,
  VehicleStatus,
} from "@/lib/types";

const pill = "rounded-md border px-1.5 font-medium tracking-wide";

export function RouteStatusBadge({ status }: { status: RouteStatus }) {
  const styles: Record<RouteStatus, string> = {
    not_started:
      "border-zinc-400/60 bg-zinc-500/10 text-zinc-700 dark:border-zinc-500/40 dark:text-zinc-300",
    no_progress:
      "border-orange-400/50 bg-orange-500/10 text-orange-800 dark:border-orange-500/40 dark:text-orange-300",
    incomplete:
      "border-orange-400/50 bg-orange-500/10 text-orange-800 dark:border-orange-500/40 dark:text-orange-300",
    in_progress:
      "border-sky-400/50 bg-sky-500/10 text-sky-800 dark:border-sky-500/40 dark:text-sky-300",
    completed:
      "border-emerald-400/50 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/40 dark:text-emerald-300",
    rescued:
      "border-amber-400/50 bg-amber-500/10 text-amber-900 dark:border-amber-500/40 dark:text-amber-300",
  };
  return (
    <Badge variant="outline" className={cn(pill, styles[status])}>
      {routeStatusLabel[status]}
    </Badge>
  );
}

export function RescueBadge({ received }: { received: boolean }) {
  if (!received) {
    return <span className="text-xs text-muted-foreground">Rescue: No</span>;
  }
  return (
    <Badge
      variant="outline"
      className={cn(
        pill,
        "border-amber-400/50 bg-amber-500/10 text-amber-900 dark:border-amber-500/40 dark:text-amber-300"
      )}
    >
      Rescue: Yes
    </Badge>
  );
}

export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  const styles: Record<DriverStatus, string> = {
    available:
      "border-emerald-400/50 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/40 dark:text-emerald-300",
    on_route:
      "border-sky-400/50 bg-sky-500/10 text-sky-800 dark:border-sky-500/40 dark:text-sky-300",
    off: "border-zinc-400/60 bg-zinc-500/10 text-zinc-700 dark:border-zinc-500/40 dark:text-zinc-300",
    pto: "border-violet-400/50 bg-violet-500/10 text-violet-800 dark:border-violet-500/40 dark:text-violet-300",
  };
  return (
    <Badge variant="outline" className={cn(pill, styles[status])}>
      {driverStatusLabel[status]}
    </Badge>
  );
}

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const styles: Record<VehicleStatus, string> = {
    ready:
      "border-emerald-400/50 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/40 dark:text-emerald-300",
    on_route:
      "border-sky-400/50 bg-sky-500/10 text-sky-800 dark:border-sky-500/40 dark:text-sky-300",
    maintenance:
      "border-amber-400/50 bg-amber-500/10 text-amber-900 dark:border-amber-500/40 dark:text-amber-300",
    oos: "border-red-400/50 bg-red-500/10 text-red-800 dark:border-red-500/40 dark:text-red-300",
  };
  return (
    <Badge variant="outline" className={cn(pill, styles[status])}>
      {vehicleStatusLabel[status]}
    </Badge>
  );
}

export function StopStatusBadge({ status }: { status: StopStatus }) {
  const styles: Record<StopStatus, string> = {
    pending:
      "border-zinc-400/60 bg-zinc-500/10 text-zinc-700 dark:border-zinc-500/40 dark:text-zinc-300",
    delivered:
      "border-emerald-400/50 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/40 dark:text-emerald-300",
    attempted:
      "border-amber-400/50 bg-amber-500/10 text-amber-900 dark:border-amber-500/40 dark:text-amber-300",
    rescued:
      "border-sky-400/50 bg-sky-500/10 text-sky-800 dark:border-sky-500/40 dark:text-sky-300",
    business_closed:
      "border-violet-400/50 bg-violet-500/10 text-violet-800 dark:border-violet-500/40 dark:text-violet-300",
  };
  return (
    <Badge variant="outline" className={cn(pill, styles[status])}>
      {stopStatusLabel[status]}
    </Badge>
  );
}

export function IncidentTypeBadge({ type }: { type: IncidentType }) {
  return (
    <Badge variant="outline" className={cn(pill, "border-border text-foreground")}>
      {incidentTypeLabel[type]}
    </Badge>
  );
}

export function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  const styles: Record<IncidentSeverity, string> = {
    low: "border-zinc-400/60 bg-zinc-500/10 text-zinc-700 dark:border-zinc-500/40 dark:text-zinc-300",
    medium:
      "border-amber-400/50 bg-amber-500/10 text-amber-900 dark:border-amber-500/40 dark:text-amber-300",
    high: "border-orange-400/50 bg-orange-500/10 text-orange-800 dark:border-orange-500/40 dark:text-orange-300",
    critical:
      "border-red-400/50 bg-red-500/10 text-red-800 dark:border-red-500/40 dark:text-red-300",
  };
  return (
    <Badge variant="outline" className={cn(pill, styles[severity])}>
      {incidentSeverityLabel[severity]}
    </Badge>
  );
}

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  const styles: Record<IncidentStatus, string> = {
    open: "border-amber-400/50 bg-amber-500/10 text-amber-900 dark:border-amber-500/40 dark:text-amber-300",
    closed:
      "border-zinc-400/60 bg-zinc-500/10 text-zinc-700 dark:border-zinc-500/40 dark:text-zinc-300",
  };
  return (
    <Badge variant="outline" className={cn(pill, styles[status])}>
      {incidentStatusLabel[status]}
    </Badge>
  );
}

export function ExceptionStatusBadge({
  status,
}: {
  status: PackageExceptionStatus;
}) {
  const styles: Record<PackageExceptionStatus, string> = {
    Reattemptable:
      "border-amber-400/50 bg-amber-500/10 text-amber-900 dark:border-amber-500/40 dark:text-amber-300",
    Undeliverable:
      "border-red-400/50 bg-red-500/10 text-red-800 dark:border-red-500/40 dark:text-red-300",
    Missing:
      "border-violet-400/50 bg-violet-500/10 text-violet-800 dark:border-violet-500/40 dark:text-violet-300",
    "Returned to station":
      "border-zinc-400/60 bg-zinc-500/10 text-zinc-700 dark:border-zinc-500/40 dark:text-zinc-300",
    "Pickup failed":
      "border-orange-400/50 bg-orange-500/10 text-orange-800 dark:border-orange-500/40 dark:text-orange-300",
  };
  return (
    <Badge variant="outline" className={cn(pill, styles[status])}>
      {exceptionStatusLabel[status]}
    </Badge>
  );
}

export function ScoreStatusBadge({
  status,
  size = "md",
}: {
  status: ScorecardTier | "compliant" | "noncompliant" | "unavailable";
  size?: "sm" | "md";
}) {
  if (status === "unavailable") {
    return (
      <Badge
        variant="outline"
        className={cn(
          pill,
          "border-zinc-400/60 bg-zinc-500/10 text-zinc-700 dark:border-zinc-500/40 dark:text-zinc-300",
          size === "sm" ? "h-5 text-[10px]" : "h-6 text-xs uppercase"
        )}
      >
        No data
      </Badge>
    );
  }
  if (status === "compliant" || status === "noncompliant") {
    return (
      <Badge
        variant="outline"
        className={cn(
          pill,
          status === "compliant"
            ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-800 dark:border-emerald-500/50 dark:text-emerald-300"
            : "border-red-400/60 bg-red-500/15 text-red-800 dark:border-red-500/50 dark:text-red-300",
          size === "sm" ? "h-5 text-[10px]" : "h-6 text-xs uppercase"
        )}
      >
        {status === "compliant" ? "Compliant" : "Noncompliant"}
      </Badge>
    );
  }
  return <ScoreTierBadge tier={status} size={size} />;
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const styles: Record<InvoiceStatus, string> = {
    New: "border-sky-400/50 bg-sky-500/10 text-sky-800 dark:border-sky-500/40 dark:text-sky-300",
    Paid: "border-emerald-400/50 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/40 dark:text-emerald-300",
  };
  return (
    <Badge variant="outline" className={cn(pill, styles[status])}>
      {status}
    </Badge>
  );
}

export function ScoreTierBadge({
  tier,
  size = "md",
}: {
  tier: ScorecardTier;
  size?: "sm" | "md";
}) {
  const styles: Record<ScorecardTier, string> = {
    fantastic:
      "border-emerald-400/60 bg-emerald-500/15 text-emerald-800 dark:border-emerald-500/50 dark:text-emerald-300",
    great:
      "border-sky-400/60 bg-sky-500/15 text-sky-800 dark:border-sky-500/50 dark:text-sky-300",
    fair: "border-amber-400/60 bg-amber-500/15 text-amber-900 dark:border-amber-500/50 dark:text-amber-300",
    poor: "border-red-400/60 bg-red-500/15 text-red-800 dark:border-red-500/50 dark:text-red-300",
  };
  return (
    <Badge
      variant="outline"
      className={cn(
        pill,
        styles[tier],
        size === "sm" ? "h-5 text-[10px]" : "h-6 text-xs uppercase"
      )}
    >
      {scorecardTierLabel[tier]}
    </Badge>
  );
}
