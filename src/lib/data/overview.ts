import type { Alert, DateRange, Kpi, OverviewSnapshot, Route, RouteStatus } from "@/lib/types";
import { deliveryBoard, routes } from "@/lib/data/delivery-execution";
import { consoleDrivers } from "@/lib/data/delivery-execution";
import { formatConsoleCapture, formatConsoleDay } from "@/lib/format";

const t = deliveryBoard.totals;
const deliveredToday = t.packagesDelivered;
const assignedToday = t.packagesPlanned;
const completionToday = t.executionGaugesPct.packages;
const activeRoutes = t.inProgress;
const driversOnShift = consoleDrivers.filter((d) => d.status === "on_route").length;

function statusCounts(): { status: RouteStatus; count: number }[] {
  const counts: Record<RouteStatus, number> = {
    not_started: 0,
    no_progress: 0,
    incomplete: 0,
    in_progress: 0,
    completed: 0,
    rescued: 0,
  };
  for (const route of routes) counts[route.status] += 1;
  return (Object.keys(counts) as RouteStatus[]).map((status) => ({
    status,
    count: counts[status],
  }));
}

function associateNames(route: Route) {
  return route.associateIds
    .map((id) => consoleDrivers.find((driver) => driver.id === id)?.name)
    .filter((name): name is string => Boolean(name))
    .join("/");
}

const captureLabel = formatConsoleCapture(deliveryBoard.capturedAt);
const inProgressRoutes = routes.filter((route) => route.status === "in_progress");
const incompleteRoutes = routes.filter((route) => route.status === "incomplete");
const completedCount = routes.filter((route) => route.status === "completed").length;

export const alerts: Alert[] = [
  {
    id: "al-scorecard",
    severity: "info",
    title: "Scorecard Week 37 · Fantastic 85.8",
    detail:
      "DSP Console Performance Summary for Sep 6–12. CDF DPMO is Great; remaining published metrics Fantastic.",
    href: "/scorecard",
  },
  {
    id: "al-inprogress",
    severity: inProgressRoutes.length > 0 ? "warning" : "info",
    title:
      inProgressRoutes.length > 0
        ? `${inProgressRoutes.length} routes still in progress`
        : "End of day · 0 routes in progress",
    detail:
      inProgressRoutes.length > 0
        ? `${inProgressRoutes.map((route) => `${route.code} (${associateNames(route)})`).join(" and ")} open at the ${captureLabel} Console capture.`
        : `${completedCount} routes complete. Incomplete: ${
            incompleteRoutes
              .map((route) => `${route.code} (${associateNames(route) || "unassigned"})`)
              .join(", ") || "none"
          }.`,
    href: "/routes",
  },
  {
    id: "al-whr",
    severity: "warning",
    title: `${t.workHourRisk} work-hour risk`,
    detail: `${t.multiTransporter} multi-transporter routes, ${t.onBreak} on break, ${t.inactive} inactive. Vehicle and on-time % were not on the board.`,
    href: "/routes",
  },
  {
    id: "al-exceptions",
    severity: "info",
    title: `${t.packageStatusCounts.reattemptable} reattemptable · ${t.packageStatusCounts.undeliverable} undeliverable`,
    detail: `${t.packageStatusCounts.remaining} remaining, ${t.packageStatusCounts.missing} missing, ${t.packageStatusCounts.returnedToStation} RTS, ${t.packageStatusCounts.pickupFailed} pickup failed.`,
    href: "/routes",
  },
];

const todayKpis: Kpi[] = [
  {
    id: "pkg",
    label: "Packages delivered",
    value: deliveredToday,
    unit: "number",
    delta: null,
    sparkline: [],
    hint: `Sum of Console route rows · ${assignedToday.toLocaleString()} planned · ${captureLabel}. Board package gauge is ${completionToday}%. No prior-day delta.`,
  },
  {
    id: "dcr",
    label: "Package completion",
    value: completionToday,
    unit: "percent",
    delta: null,
    sparkline: [],
    hint: "DSP Console execution gauge (packages).",
  },
  {
    id: "remaining",
    label: "Remaining pkgs",
    value: t.packageStatusCounts.remaining,
    unit: "number",
    delta: null,
    sparkline: [],
    hint: "Still out on the board at capture.",
  },
  {
    id: "reattempt",
    label: "Reattemptable",
    value: t.packageStatusCounts.reattemptable,
    unit: "number",
    delta: null,
    sparkline: [],
    hint: "Console board chip. CSV export row count can differ.",
  },
  {
    id: "undeliverable",
    label: "Undeliverable",
    value: t.packageStatusCounts.undeliverable,
    unit: "number",
    delta: null,
    sparkline: [],
    hint: "Console board chip. CSV export row count can differ.",
  },
  {
    id: "active",
    label: "In progress",
    value: activeRoutes,
    unit: "number",
    delta: null,
    sparkline: [],
    hint: `Routes still in progress at ${captureLabel}.`,
  },
  {
    id: "shift",
    label: "DAs still on road",
    value: driversOnShift,
    unit: "number",
    delta: null,
    sparkline: [],
    hint: "Associates on in-progress routes.",
  },
];

export function getOverview(range: DateRange): OverviewSnapshot {
  return {
    range,
    asOfLabel:
      range === "today"
        ? `Delivery Execution · ${formatConsoleDay(deliveryBoard.capturedAt)}, ${captureLabel}`
        : "Live Sep 21 only — no other days in this Console pull",
    kpis: todayKpis,
    packagesByDay: [
      { label: "Mon 21", delivered: deliveredToday, assigned: assignedToday },
    ],
    routeStatusCounts: statusCounts(),
    alerts,
  };
}
