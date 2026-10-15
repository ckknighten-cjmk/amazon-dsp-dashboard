import type { ReactNode } from "react";
import { RefreshDataButton } from "@/components/refresh-data";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  refresh = true,
  updatedLabel,
  seedAsOf,
  week,
  date,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Re-read this page's seeded data. Off for loading and not-found shells. */
  refresh?: boolean;
  /** Existing seed capture label. Omit when the page has no single timestamp. */
  updatedLabel?: string;
  /** Zoned seed instant used to notice when a fresh pull has landed. */
  seedAsOf?: string | null;
  week?: string | number | null;
  date?: string | null;
}) {
  const toolbar = Boolean(refresh || actions || updatedLabel);

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {toolbar ? (
        <div
          className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:max-w-xl sm:justify-end"
          data-page-toolbar
        >
          {updatedLabel ? (
            <p className="max-w-full text-xs text-muted-foreground sm:whitespace-nowrap">{updatedLabel}</p>
          ) : null}
          {refresh ? <RefreshDataButton seedAsOf={seedAsOf} week={week} date={date} /> : null}
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed px-6 py-12 text-center",
        className
      )}
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}
