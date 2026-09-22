import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRoutes } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import type { DeliveryExecutionBoard } from "@/lib/types";

export function DeliveryBoardSummary({ board }: { board: DeliveryExecutionBoard }) {
  const t = board.totals;
  const pkg = t.packageStatusCounts;
  const pickup = t.onRoadPickups;
  const routes = getRoutes();
  const complete = routes.filter((r) => r.status === "completed").length;
  const noProgress = routes.filter((r) => r.status === "no_progress").length;

  return (
    <div className="mb-5 space-y-3">
      <p className="text-xs text-muted-foreground">
        {board.source} · {board.serviceDate} · captured 8:42 p.m. CT. {board.disclaimer}
      </p>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Routes</CardTitle>
            <CardDescription>DNA4 Memphis · CJMK Inc.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Stat value={formatNumber(t.routes)} label="Total" />
            <Stat value={formatNumber(t.inProgress)} label="In progress" />
            <Stat value={formatNumber(complete)} label="Complete" />
            <Stat value={formatNumber(noProgress)} label="No progress" />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Risk & helpers</CardTitle>
            <CardDescription>Board chips — vehicle / on-time not shown</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Stat value={formatNumber(t.workHourRisk)} label="Work-hour risk" />
            <Stat value={formatNumber(t.multiTransporter)} label="Multi-transporter" />
            <Stat value={formatNumber(t.unknownStops)} label="Unknown stops" />
            <Stat
              value={`${pickup.total}`}
              label={`${pickup.remaining} remaining · ${pickup.complete} complete pickups`}
            />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Execution progress</CardTitle>
            <CardDescription>
              {formatNumber(t.packagesDelivered)} / {formatNumber(t.packagesPlanned)} packages
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap justify-around gap-3 py-1">
            <Gauge label="Locations" value={t.executionGaugesPct.locations} />
            <Gauge label="Stops" value={t.executionGaugesPct.stops} />
            <Gauge label="Packages" value={t.executionGaugesPct.packages} />
            <Gauge label="Attempt success" value={t.executionGaugesPct.attemptSuccess} />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Package status</CardTitle>
            <CardDescription>Console board counts, not the export row count</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2">
            <Chip value={pkg.remaining} label="Remaining" />
            <Chip value={pkg.reattemptable} label="Reattemptable" />
            <Chip value={pkg.undeliverable} label="Undeliverable" />
            <Chip value={pkg.missing} label="Missing" />
            <Chip value={pkg.returnedToStation} label="RTS" />
            <Chip value={pkg.pickupFailed} label="Pickup failed" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-heading text-xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Chip({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-2 py-1.5">
      <p className="font-heading text-lg font-semibold tabular-nums">{formatNumber(value)}</p>
      <p className="text-[10px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

function Gauge({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="flex size-[4.25rem] items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(var(--fantastic) ${value}%, color-mix(in oklch, var(--muted) 80%, transparent) 0)`,
        }}
        aria-label={`${label} ${value} percent`}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-card text-sm font-semibold tabular-nums">
          {value}%
        </div>
      </div>
      <p className="max-w-16 text-center text-[10px] leading-tight text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
