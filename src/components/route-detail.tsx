import Link from "next/link";
import { ExceptionStatusBadge, RescueBadge, RouteStatusBadge } from "@/components/ops-badges";
import { EmptyState } from "@/components/page-header";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getDriver, getExceptionsForRoute } from "@/lib/data";
import {
  CONSOLE_UNAVAILABLE,
  formatCompletionPct,
  formatDateTime,
  formatNumber,
} from "@/lib/format";
import type { Route } from "@/lib/types";

export function RouteDetail({ route }: { route: Route }) {
  const associates = route.associateIds
    .map((id) => getDriver(id))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));
  const rescuers = route.rescueDriverIds
    .map((id) => getDriver(id))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));
  const remainingStops = Math.max(route.stopCount - route.completedStops, 0);
  const exceptions = getExceptionsForRoute(route.id);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            {route.code}
          </h2>
          <p className="text-sm text-muted-foreground">
            {route.stationCode} Memphis · DSP Console Delivery Execution · Sep 25, 2026
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RouteStatusBadge status={route.status} />
          <RescueBadge received={route.receivedRescue} />
        </div>
      </div>

      {route.receivedRescue ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
          Rescue: Yes. {rescuers.map((driver) => driver.name).join(", ") || "Rescuers not named"} listed
          after the primary associate. Inferred because this route has more than one associate.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Rescue: No. Only routes with more than one associate are marked rescued.
        </p>
      )}

      {route.notes ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
          {route.notes}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Stat
          label={associates.length > 1 ? "Associates" : "Associate"}
          value={associates.map((d) => d.name).join(", ") || "Unassigned"}
        />
        <Stat label="Van" value={CONSOLE_UNAVAILABLE} />
        <Stat
          label="Packages"
          value={`${formatNumber(route.packagesDelivered)} / ${formatNumber(route.packageCount)}`}
        />
        <Stat label="On-time %" value={CONSOLE_UNAVAILABLE} />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {route.completedStops} / {route.stopCount} stops · {route.packagesRemaining} pkg remaining
          </span>
          <span className="tabular-nums">{formatCompletionPct(route.progressPct)}</span>
        </div>
        <Progress value={Math.min(route.progressPct, 100)} />
        <p className="mt-1.5 text-xs text-muted-foreground">
          {remainingStops === 0 && route.packagesRemaining === 0
            ? "Board shows this route complete."
            : `${remainingStops} stop${remainingStops === 1 ? "" : "s"} still open on the board.`}
        </p>
      </div>

      <Separator />

      <div>
        <h3 className="mb-2 text-sm font-medium">
          Exception packages
          <span className="ml-1.5 font-normal text-muted-foreground">
            {exceptions.length} from the Console export
          </span>
        </h3>
        {exceptions.length === 0 ? (
          <EmptyState
            title="No exception packages"
            description="This route had no rows in the Sep 25 exception Packages CSV."
            className="py-8"
          />
        ) : (
          <ol className="max-h-[28rem] space-y-0 overflow-auto rounded-lg border">
            {exceptions.map((row) => (
              <li
                key={row.id}
                className="flex items-start gap-3 border-b px-3 py-2 text-sm last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs">{row.scannableId}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.address}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.transporterName}
                    {row.lastScan ? ` · ${formatDateTime(row.lastScan)}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs">{row.reasonCode || "—"}</p>
                </div>
                <ExceptionStatusBadge status={row.status} />
              </li>
            ))}
          </ol>
        )}
      </div>

      {associates.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          DA roster:{" "}
          {associates.map((driver, i) => (
            <span key={driver.id}>
              {i > 0 ? ", " : ""}
              <Link href="/drivers" className="text-foreground underline-offset-2 hover:underline">
                {driver.name}
              </Link>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="truncate font-medium" title={value}>
        {value}
      </p>
    </div>
  );
}
