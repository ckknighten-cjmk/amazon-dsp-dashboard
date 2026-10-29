import type { Alert, DateRange, Kpi, OverviewSnapshot, Route, RouteStatus } from "@/lib/types";
import { deliveryBoard, routes } from "@/lib/data/delivery-execution";
import { consoleDrivers } from "@/lib/data/delivery-execution";
import type { DeliveryDay } from "@/lib/data/delivery-execution";
import { deliveryDayLabel, deliveryDaysInRange } from "@/lib/data/delivery-catalog";
import { formatConsoleCapture, formatConsoleDay } from "@/lib/format";
import { DELIVERY_COVERAGE, STATION_TODAY } from "@/lib/period";

const t = deliveryBoard.totals;
const deliveredToday = t.packagesDelivered;
const assignedToday = t.packagesPlanned;
const completionToday = t.executionGaugesPct.packages;
const activeRoutes = t.inProgress;
const driversOnShift = consoleDrivers.filter((d) => d.status === "on_route").length;

function statusCounts(source: readonly Route[] = routes): { status: RouteStatus; count: number }[] {
  const counts: Record<RouteStatus, number> = {
    not_started: 0,
    no_progress: 0,
    incomplete: 0,
    in_progress: 0,
    completed: 0,
    rescued: 0,
  };
  for (const route of source) counts[route.status] += 1;
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
const packageGaugeHint =
  completionToday == null
    ? `Sum of Console route rows · ${assignedToday.toLocaleString()} planned · ${captureLabel}. The board did not publish a package gauge. No prior-day delta.`
    : `Sum of Console route rows · ${assignedToday.toLocaleString()} planned · ${captureLabel}. Board package gauge is ${completionToday}%. No prior-day delta.`;
const inProgressRoutes = routes.filter((route) => route.status === "in_progress");
const incompleteRoutes = routes.filter((route) => route.status === "incomplete");
const completedCount = routes.filter((route) => route.status === "completed").length;

export const alerts: Alert[] = [
  {
    id: "al-scorecard",
    severity: "info",
    title: "Scorecard Week 38 · Fantastic 84",
    detail:
      "DSP Console Performance Summary for Sep 13–19. Overall 84 Fantastic. Delivery Completion DPMO and CDF DPMO are Great. Safe Driving and Working Device are No Data.",
    href: "/scorecard?week=38",
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
    hint: packageGaugeHint,
  },
  {
    id: "dcr",
    label: "Package completion",
    value: completionToday,
    unit: "percent",
    delta: null,
    sparkline: [],
    hint:
      completionToday == null
        ? "DSP Console did not expose an execution gauge for packages in this capture."
        : "DSP Console execution gauge (packages).",
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

function kpisFor(day: DeliveryDay): Kpi[] {
  const totals = day.board.totals;
  const captured = formatConsoleCapture(day.board.capturedAt);
  const gauge = totals.executionGaugesPct.packages;
  const onRoad = day.drivers.filter((driver) => driver.status === "on_route").length;
  return [
    {
      id: "pkg",
      label: "Packages delivered",
      value: totals.packagesDelivered,
      unit: "number",
      delta: null,
      sparkline: [],
      hint:
        gauge == null
          ? `Sum of Console route rows · ${totals.packagesPlanned.toLocaleString()} planned · ${captured}. The board did not publish a package gauge. No prior-day delta.`
          : `Sum of Console route rows · ${totals.packagesPlanned.toLocaleString()} planned · ${captured}. Board package gauge is ${gauge}%. No prior-day delta.`,
    },
    {
      id: "dcr",
      label: "Package completion",
      value: gauge,
      unit: "percent",
      delta: null,
      sparkline: [],
      hint:
        gauge == null
          ? "DSP Console did not expose an execution gauge for packages in this capture."
          : "DSP Console execution gauge (packages).",
    },
    {
      id: "remaining",
      label: "Remaining pkgs",
      value: totals.packageStatusCounts.remaining,
      unit: "number",
      delta: null,
      sparkline: [],
      hint: "Still out on the board at capture.",
    },
    {
      id: "reattempt",
      label: "Reattemptable",
      value: totals.packageStatusCounts.reattemptable,
      unit: "number",
      delta: null,
      sparkline: [],
      hint: "Console board chip. CSV export row count can differ.",
    },
    {
      id: "undeliverable",
      label: "Undeliverable",
      value: totals.packageStatusCounts.undeliverable,
      unit: "number",
      delta: null,
      sparkline: [],
      hint: "Console board chip. CSV export row count can differ.",
    },
    {
      id: "active",
      label: "In progress",
      value: totals.inProgress,
      unit: "number",
      delta: null,
      sparkline: [],
      hint: `Routes still in progress at ${captured}.`,
    },
    {
      id: "shift",
      label: "DAs still on road",
      value: onRoad,
      unit: "number",
      delta: null,
      sparkline: [],
      hint: "Associates on in-progress routes.",
    },
  ];
}

function alertsFor(day: DeliveryDay): Alert[] {
  const names = (route: Route) =>
    route.associateIds
      .map((id) => day.drivers.find((driver) => driver.id === id)?.name)
      .filter((name): name is string => Boolean(name))
      .join("/");
  const open = day.routes.filter((route) => route.status === "in_progress");
  const incomplete = day.routes.filter((route) => route.status === "incomplete");
  const complete = day.routes.filter((route) => route.status === "completed").length;
  const captured = formatConsoleCapture(day.board.capturedAt);
  const chips = day.board.totals.packageStatusCounts;
  return [
    alerts[0]!,
    {
      id: "al-inprogress",
      severity: open.length > 0 ? "warning" : "info",
      title: open.length > 0 ? `${open.length} routes still in progress` : "End of day · 0 routes in progress",
      detail:
        open.length > 0
          ? `${open.map((route) => `${route.code} (${names(route)})`).join(" and ")} open at the ${captured} Console capture.`
          : `${complete} routes complete. Incomplete: ${
              incomplete.map((route) => `${route.code} (${names(route) || "unassigned"})`).join(", ") || "none"
            }.`,
      href: "/routes",
    },
    {
      id: "al-whr",
      severity: "warning",
      title: `${day.board.totals.workHourRisk} work-hour risk`,
      detail: `${day.board.totals.multiTransporter} multi-transporter routes, ${day.board.totals.onBreak} on break, ${day.board.totals.inactive} inactive. Vehicle and on-time % were not on the board.`,
      href: "/routes",
    },
    {
      id: "al-exceptions",
      severity: "info",
      title: `${chips.reattemptable} reattemptable · ${chips.undeliverable} undeliverable`,
      detail: `${chips.remaining} remaining, ${chips.missing} missing, ${chips.returnedToStation} RTS, ${chips.pickupFailed} pickup failed.`,
      href: "/routes",
    },
  ];
}

const liveOverview = {
  asOfLabel: `Delivery Execution · ${formatConsoleDay(deliveryBoard.capturedAt)}, ${captureLabel}. ${DELIVERY_COVERAGE.label}.`,
  kpis: todayKpis,
  packagesByDay: [{ label: "Wed 28", delivered: deliveredToday, assigned: assignedToday }],
  routeStatusCounts: statusCounts(),
  alerts,
};

export function getOverview(range: DateRange): OverviewSnapshot {
  const days = deliveryDaysInRange(range);
  if (days.length === 0) {
    return {
      range,
      asOfLabel: `No Delivery Execution capture in this period. ${DELIVERY_COVERAGE.label}.`,
      kpis: [],
      packagesByDay: [],
      routeStatusCounts: [],
      alerts: [],
    };
  }
  const includesLive = days.some((day) => day.serviceDate === STATION_TODAY);
  if (includesLive && days.length === 1) {
    return { range, ...liveOverview };
  }
  if (includesLive) {
    const labels = days.map((day) => deliveryDayLabel(day.serviceDate)).join(", ");
    return {
      range,
      asOfLabel: `Delivery Execution · ${formatConsoleDay(deliveryBoard.capturedAt)}, ${captureLabel}. Seeded days in this period: ${labels}. ${DELIVERY_COVERAGE.label}.`,
      kpis: todayKpis,
      packagesByDay: days.map((day) => ({
        label: deliveryDayLabel(day.serviceDate),
        delivered: day.board.totals.packagesDelivered,
        assigned: day.board.totals.packagesPlanned,
      })),
      routeStatusCounts: statusCounts(),
      alerts,
    };
  }
  const detail = days[days.length - 1]!;
  const labels = days.map((day) => deliveryDayLabel(day.serviceDate)).join(", ");
  return {
    range,
    asOfLabel: `Delivery Execution · ${labels}. Showing ${deliveryDayLabel(detail.serviceDate)} (${detail.serviceDate}), captured ${formatConsoleCapture(detail.board.capturedAt)}.`,
    kpis: kpisFor(detail),
    packagesByDay: days.map((day) => ({
      label: deliveryDayLabel(day.serviceDate),
      delivered: day.board.totals.packagesDelivered,
      assigned: day.board.totals.packagesPlanned,
    })),
    routeStatusCounts: statusCounts(detail.routes),
    alerts: alertsFor(detail),
  };
}
