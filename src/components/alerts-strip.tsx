import Link from "next/link";
import { AlertTriangle, Info, Siren } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Alert } from "@/lib/types";

const icon = {
  critical: Siren,
  warning: AlertTriangle,
  info: Info,
};

const tone = {
  critical: "border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-200",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  info: "border-sky-500/40 bg-sky-500/10 text-sky-900 dark:text-sky-200",
};

export function AlertsStrip({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
        No open alerts.
      </p>
    );
  }

  return (
    <ul className="grid gap-2 lg:grid-cols-2">
      {alerts.map((alert) => {
        const Icon = icon[alert.severity];
        const body = (
          <span className="flex items-start gap-2.5">
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <span className="block text-sm font-medium">{alert.title}</span>
              <span className="block text-xs opacity-80">{alert.detail}</span>
            </span>
          </span>
        );
        return (
          <li key={alert.id}>
            {alert.href ? (
              <Link
                href={alert.href}
                className={cn(
                  "block rounded-lg border px-3 py-2 transition-colors hover:bg-background/40",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  tone[alert.severity]
                )}
              >
                {body}
              </Link>
            ) : (
              <div className={cn("rounded-lg border px-3 py-2", tone[alert.severity])}>
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
