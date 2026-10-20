"use client";

import { useDateRange } from "@/components/layout/date-range-context";
import { deliveryDayLabel } from "@/lib/data/delivery-catalog";
import type { DeliveryDay } from "@/lib/data/delivery-execution";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Opens one seeded service day. Hidden when the period has a single capture. */
export function DeliveryDayPicker({
  days,
  selected,
}: {
  days: readonly DeliveryDay[];
  selected: string;
}) {
  const { setRange } = useDateRange();
  if (days.length < 2) return null;
  return (
    <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Seeded days in this period">
      {days.map((day) => {
        const pressed = day.serviceDate === selected;
        return (
          <button
            key={day.serviceDate}
            type="button"
            aria-pressed={pressed}
            onClick={() =>
              setRange({ kind: "custom", start: day.serviceDate, end: day.serviceDate })
            }
            className={cn(
              "rounded-md border px-2 py-1 text-left text-xs transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              pressed
                ? "border-foreground/30 bg-background text-foreground shadow-sm"
                : "border-transparent bg-muted/40 text-muted-foreground hover:text-foreground"
            )}
          >
            {deliveryDayLabel(day.serviceDate)} · {formatNumber(day.board.totals.routes)} routes ·{" "}
            {formatNumber(day.board.totals.packagesDelivered)} pkgs
          </button>
        );
      })}
    </div>
  );
}
