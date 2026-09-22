"use client";

import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDateRange } from "@/components/layout/date-range-context";
import { formatClock } from "@/lib/format";
import { getStation } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { DateRange } from "@/lib/types";

export function TopBar({
  onOpenNav,
}: {
  onOpenNav?: () => void;
}) {
  const { range, setRange } = useDateRange();
  const station = getStation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = (resolvedTheme ?? theme) === "dark";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-md md:px-6">
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={onOpenNav}
        aria-label="Open navigation"
      >
        <Menu className="size-4" />
      </Button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{station.stationCode} operations</p>
        <p className="truncate text-xs text-muted-foreground">{formatClock()} CT</p>
      </div>

      <div
        role="group"
        aria-label="Date range"
        className="flex rounded-lg border bg-muted/40 p-0.5"
      >
        {(["today", "week"] as DateRange[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setRange(option)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              range === option
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option === "today" ? "Today" : "This week"}
          </button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        onClick={() => setTheme(isDark ? "light" : "dark")}
      >
        {mounted && isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
    </header>
  );
}
