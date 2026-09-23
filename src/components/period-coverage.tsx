"use client";

import { EmptyState } from "@/components/page-header";
import { useDateRange } from "@/components/layout/date-range-context";
import { DELIVERY_COVERAGE, rangesOverlap } from "@/lib/period";

export function PeriodCoverage({
  start,
  end,
  coveredNote,
  emptyTitle,
  emptyDescription,
  children,
}: {
  start: string;
  end: string;
  coveredNote: string;
  emptyTitle: string;
  emptyDescription: string;
  children: React.ReactNode;
}) {
  const { range } = useDateRange();
  if (!rangesOverlap(start, end, range)) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <>
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{coveredNote}</p>
      {children}
    </>
  );
}

export function DeliveryPeriodNote() {
  const { range } = useDateRange();
  if (rangesOverlap(DELIVERY_COVERAGE.start, DELIVERY_COVERAGE.end, range)) return null;
  return (
    <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:text-amber-100">
      This route is from the Sep 21 Delivery Execution capture, which is outside the selected
      period. {DELIVERY_COVERAGE.label}. Stops are not filled in for other days.
    </p>
  );
}

export function CoverageNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:text-amber-100">
      {children}
    </p>
  );
}
