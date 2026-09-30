import type { ReactNode } from "react";
import { RefreshDataButton } from "@/components/refresh-data";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  refresh = true,
  updatedLabel,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Re-read this page's seeded data. Off for loading and not-found shells. */
  refresh?: boolean;
  /** Existing seed capture label. Omit when the page has no single timestamp. */
  updatedLabel?: string;
}) {
  const toolbar = Boolean(refresh || actions || updatedLabel);

  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {toolbar ? (
        <div className="flex flex-wrap items-center gap-2" data-page-toolbar>
          {updatedLabel ? (
            <p className="text-xs whitespace-nowrap text-muted-foreground">{updatedLabel}</p>
          ) : null}
          {refresh ? <RefreshDataButton /> : null}
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
