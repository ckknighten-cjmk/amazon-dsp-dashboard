"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useDateRange } from "@/components/layout/date-range-context";
import { formatRangeLabel, isIsoDate, STATION_WEEK_END, STATION_WEEK_START } from "@/lib/period";
import type { DateRange } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{ kind: DateRange["kind"]; label: string }> = [
  { kind: "today", label: "Today" },
  { kind: "week", label: "This Week" },
  { kind: "custom", label: "Custom" },
];

export function PeriodSwitcher() {
  const { range, setRange } = useDateRange();
  const [draftStart, setDraftStart] = useState(STATION_WEEK_START);
  const [draftEnd, setDraftEnd] = useState(STATION_WEEK_END);
  const start = range.kind === "custom" ? range.start : draftStart;
  const end = range.kind === "custom" ? range.end : draftEnd;

  function select(kind: DateRange["kind"]) {
    if (kind === "today") {
      setRange({ kind: "today" });
      return;
    }
    if (kind === "week") {
      setRange({ kind: "week" });
      return;
    }
    const nextStart = isIsoDate(start) ? start : STATION_WEEK_START;
    const nextEnd = isIsoDate(end) ? end : STATION_WEEK_END;
    setRange(
      nextStart <= nextEnd
        ? { kind: "custom", start: nextStart, end: nextEnd }
        : { kind: "custom", start: nextEnd, end: nextStart }
    );
  }

  function commitCustom(nextStart: string, nextEnd: string) {
    if (!isIsoDate(nextStart) || !isIsoDate(nextEnd)) return;
    setRange(
      nextStart <= nextEnd
        ? { kind: "custom", start: nextStart, end: nextEnd }
        : { kind: "custom", start: nextEnd, end: nextStart }
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2" data-period={range.kind}>
      <div role="group" aria-label="Period" className="flex rounded-lg border bg-muted/40 p-0.5">
        {OPTIONS.map((option) => {
          const selected = range.kind === option.kind;
          return (
            <button
              key={option.kind}
              type="button"
              aria-pressed={selected}
              onClick={() => select(option.kind)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {range.kind === "custom" ? (
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Start
            <Input
              type="date"
              value={start}
              aria-label="Custom period start"
              className="w-auto"
              onChange={(event) => {
                const value = event.target.value;
                setDraftStart(value);
                commitCustom(value, end);
              }}
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            End
            <Input
              type="date"
              value={end}
              aria-label="Custom period end"
              className="w-auto"
              onChange={(event) => {
                const value = event.target.value;
                setDraftEnd(value);
                commitCustom(start, value);
              }}
            />
          </label>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">{formatRangeLabel(range)}</p>
    </div>
  );
}
