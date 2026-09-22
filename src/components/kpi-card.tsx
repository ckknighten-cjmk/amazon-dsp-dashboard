import { Card, CardContent } from "@/components/ui/card";
import { Sparkline } from "@/components/sparkline";
import { formatDelta, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Kpi } from "@/lib/types";

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const display =
    kpi.unit === "percent" ? formatPercent(kpi.value) : formatNumber(kpi.value);

  return (
    <Card size="sm" className="min-w-0">
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
          <Sparkline values={kpi.sparkline} />
        </div>
        <p className="font-heading text-2xl font-semibold tabular-nums tracking-tight">
          {display}
        </p>
        {kpi.delta === null ? (
          <p className="text-xs text-muted-foreground">{kpi.hint}</p>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={cn(
                "font-medium tabular-nums",
                deltaIsGood(kpi)
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {formatDelta(kpi.delta, kpi.unit)}
            </span>
            <span>vs prior</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function deltaIsGood(kpi: Kpi) {
  if (kpi.delta === null) return true;
  const invert = kpi.id === "rescues" || kpi.id === "dvrs";
  const positive = kpi.delta >= 0;
  return invert ? kpi.delta <= 0 : positive;
}
