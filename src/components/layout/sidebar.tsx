"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
  Waypoints,
} from "lucide-react";
import { useDateRange } from "@/components/layout/date-range-context";
import { cn } from "@/lib/utils";
import { getStation } from "@/lib/data";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/scorecard", label: "Scorecard", icon: Gauge },
  { href: "/routes", label: "Routes", icon: Waypoints },
  { href: "/drivers", label: "Drivers", icon: Users },
  { href: "/fleet", label: "Fleet", icon: Truck },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { hrefWithPeriod } = useDateRange();
  const station = getStation();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          CJ
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">
            {station.companyName}
          </p>
          <p className="truncate text-[11px] text-sidebar-foreground/60">
            {station.stationCode} · {station.ownership}
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Primary">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={hrefWithPeriod(item.href)}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4 text-[11px] leading-relaxed text-sidebar-foreground/50">
        <p className="flex items-center gap-1.5 font-medium text-sidebar-foreground/70">
          <ClipboardList className="size-3.5" aria-hidden />
          Ops HQ · Console seed
        </p>
        <p className="mt-1">{station.stationName}</p>
        <p>{station.city}</p>
      </div>
    </div>
  );
}
