import type { Alert, DateRange, Kpi, OverviewSnapshot, RouteStatus } from "@/lib/types";
import { deliveryBoard, routes } from "@/lib/data/delivery-execution";
import { consoleDrivers } from "@/lib/data/delivery-execution";

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
    severity: "warning",
    title: "2 routes still in progress",
    detail: "CX253 (Lewis/Cathey) and CX260 (Clark) open at the 8:42 p.m. Console capture.",
    href: "/routes",
  },
  {
    id: "al-whr",
    severity: "warning",
    title: `${t.workHourRisk} work-hour risk`,
    detail: `${t.multiTransporter} multi-transporter routes. Vehicle and on-time % were not on the board.`,
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
    hint: `Console DE ${assignedToday.toLocaleString()} planned · 8:42 p.m. CT. No prior-day delta.`,
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
    hint: "Routes still open at 8:42 p.m. CT.",
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
        ? "Delivery Execution · Mon Sep 21, 8:42 p.m. CT"
        : "Live Sep 21 only — no other days in this Console pull",
    kpis: todayKpis,
    packagesByDay: [
      { label: "Mon 21", delivered: deliveredToday, assigned: assignedToday },
    ],
    routeStatusCounts: statusCounts(),
    alerts,
  };
}
