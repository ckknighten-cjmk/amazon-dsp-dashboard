import { TODAY, WEEK_START, MONTH_START } from "../data/seed";
import type { Insight, Kpi, ScoreStanding, SeedDatabase, SessionUser } from "../types/database";
import { addDays, average, dateRange, formatNumber, formatPct, formatUsd, formatUsdCompact, round2, sum, weekdayShort } from "./format";

export const STANDING_LABEL: Record<ScoreStanding, string> = {
  fantastic: "Fantastic",
  great: "Great",
  fair: "Fair",
  poor: "Poor",
};

function costsOf(row: { labor_cost: number; overtime_cost: number; fuel_cost: number; vehicle_cost: number; other_cost: number }): number {
  return row.labor_cost + row.overtime_cost + row.fuel_cost + row.vehicle_cost + row.other_cost;
}

function priorPeriod(from: string, to: string): { from: string; to: string } {
  const days = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000) + 1;
  return { from: addDays(from, -days), to: addDays(from, -1) };
}

function deltaPct(current: number, previous: number): { delta: string; trend: "up" | "down" | "flat" } {
  if (previous === 0) return { delta: "n/a", trend: "flat" };
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 0.15) return { delta: "0.0%", trend: "flat" };
  const trend = change > 0 ? "up" : "down";
  const sign = change > 0 ? "+" : "";
  return { delta: `${sign}${change.toFixed(1)}%`, trend };
}

function deltaPts(current: number, previous: number): { delta: string; trend: "up" | "down" | "flat" } {
  const change = current - previous;
  if (Math.abs(change) < 0.05) return { delta: "0.0pp", trend: "flat" };
  const trend = change > 0 ? "up" : "down";
  const sign = change > 0 ? "+" : "";
  return { delta: `${sign}${change.toFixed(1)}pp`, trend };
}

export function filterDatabase(db: SeedDatabase, stationId: string | "all", user?: SessionUser | null): SeedDatabase {
  let next = db;
  if (stationId !== "all") {
    const stationDrivers = new Set(db.drivers.filter((d) => d.station_id === stationId).map((d) => d.id));
    const stationRoutes = new Set(db.routes.filter((r) => r.station_id === stationId).map((r) => r.id));
    const stationVehicles = new Set(db.vehicles.filter((v) => v.station_id === stationId).map((v) => v.id));
    next = {
      ...db,
      stations: db.stations.filter((s) => s.id === stationId),
      drivers: db.drivers.filter((d) => d.station_id === stationId),
      vehicles: db.vehicles.filter((v) => v.station_id === stationId),
      routes: db.routes.filter((r) => r.station_id === stationId),
      rescues: db.rescues.filter((r) => stationRoutes.has(r.distressed_route_id)),
      failedDeliveries: db.failedDeliveries.filter((f) => stationRoutes.has(f.route_id)),
      attendance: db.attendance.filter((a) => stationDrivers.has(a.driver_id)),
      safetyEvents: db.safetyEvents.filter((e) => stationDrivers.has(e.driver_id)),
      inspections: db.inspections.filter((i) => stationVehicles.has(i.vehicle_id)),
      incidents: db.incidents.filter((i) => i.station_id === stationId),
      coaching: db.coaching.filter((c) => stationDrivers.has(c.driver_id)),
      financialDaily: db.financialDaily.filter((f) => f.station_id === stationId),
      scorecards: db.scorecards.filter((s) => s.station_id === stationId),
      forecasts: db.forecasts.filter((f) => f.station_id === stationId),
      hourlyProgress: scaleHourly(db, stationId),
      maintenance: db.maintenance.filter((m) => m.station_id === stationId),
      payroll: db.payroll.filter((p) => p.station_id === stationId),
      expenses: db.expenses.filter((e) => e.station_id === stationId),
      pto: db.pto.filter((p) => stationDrivers.has(p.driver_id)),
      discipline: db.discipline.filter((d) => stationDrivers.has(d.driver_id)),
      downtime: db.downtime.filter((d) => d.station_id === stationId),
      importJobs: db.importJobs,
    };
  }
  if (user?.role === "driver" && user.driverId) {
    next = {
      ...next,
      drivers: next.drivers.filter((d) => d.id === user.driverId),
      routes: next.routes.filter((r) => r.driver_id === user.driverId),
      attendance: next.attendance.filter((a) => a.driver_id === user.driverId),
      safetyEvents: next.safetyEvents.filter((e) => e.driver_id === user.driverId),
      coaching: next.coaching.filter((c) => c.driver_id === user.driverId),
      pto: next.pto.filter((p) => p.driver_id === user.driverId),
      discipline: next.discipline.filter((d) => d.driver_id === user.driverId),
      payroll: next.payroll.filter((p) => p.driver_id === user.driverId),
    };
  }
  return next;
}

function scaleHourly(db: SeedDatabase, stationId: string) {
  const network = sum(db.routes.map((r) => r.packages_planned)) || 1;
  const station = sum(db.routes.filter((r) => r.station_id === stationId).map((r) => r.packages_planned));
  const share = station / network;
  return db.hourlyProgress.map((row) => ({
    hour: row.hour,
    planned: Math.round(row.planned * share),
    delivered: Math.round(row.delivered * share),
  }));
}

function latestScorecards(db: SeedDatabase) {
  return db.scorecards.filter((s) => s.week_start === WEEK_START);
}

function previousScorecards(db: SeedDatabase) {
  return db.scorecards.filter((s) => s.week_start === addDays(WEEK_START, -7));
}

export function buildExecutive(db: SeedDatabase) {
  const mtd = db.financialDaily.filter((r) => r.service_date >= MONTH_START && r.service_date <= TODAY);
  const prior = priorPeriod(MONTH_START, TODAY);
  const priorMtd = db.financialDaily.filter((r) => r.service_date >= prior.from && r.service_date <= prior.to);
  const revenue = sum(mtd.map((r) => r.revenue));
  const profit = sum(mtd.map((r) => r.revenue - costsOf(r)));
  const prevRevenue = sum(priorMtd.map((r) => r.revenue));
  const prevProfit = sum(priorMtd.map((r) => r.revenue - costsOf(r)));

  const currentSc = latestScorecards(db);
  const previousSc = previousScorecards(db);
  const dcr = average(currentSc.map((s) => s.dcr));
  const attendance = average(currentSc.map((s) => s.attendance_pct));
  const safety = average(currentSc.map((s) => s.safety_score));
  const prevDcr = average(previousSc.map((s) => s.dcr));
  const prevAttendance = average(previousSc.map((s) => s.attendance_pct));
  const prevSafety = average(previousSc.map((s) => s.safety_score));

  const standingCounts = currentSc.reduce<Record<string, number>>((acc, row) => {
    acc[row.standing] = (acc[row.standing] ?? 0) + 1;
    return acc;
  }, {});
  const standing = (["fantastic", "great", "fair", "poor"] as ScoreStanding[]).find((key) => (standingCounts[key] ?? 0) > 0) ?? "great";

  const kpis: Kpi[] = [
    { label: "Revenue (MTD)", value: formatUsdCompact(revenue), ...deltaPct(revenue, prevRevenue), hint: "vs. prior 20 days", favorable: "up" },
    { label: "Profit (MTD)", value: formatUsdCompact(profit), ...deltaPct(profit, prevProfit), hint: `${formatPct((profit / Math.max(revenue, 1)) * 100)} margin`, favorable: "up" },
    { label: "DCR", value: formatPct(dcr), ...deltaPts(dcr, prevDcr), hint: "Delivery completion rate", favorable: "up" },
    { label: "Attendance", value: formatPct(attendance), ...deltaPts(attendance, prevAttendance), hint: "Network reliability", favorable: "up" },
    { label: "Safety Score", value: formatNumber(safety, 0), ...deltaPct(safety, prevSafety), hint: "Mentor / FICO composite", favorable: "up" },
    { label: "Scorecard", value: STANDING_LABEL[standing], delta: `${currentSc.filter((s) => s.standing === "fantastic").length}/${currentSc.length} Fantastic`, trend: standing === "fantastic" || standing === "great" ? "up" : "down", hint: "Amazon weekly standing", favorable: "up" },
  ];

  const scorecardMetrics = [
    { label: "DCR", value: formatPct(dcr), target: "≥ 99.0%", status: standingFromValue(dcr, 99, 98.2, 97) },
    { label: "CDF", value: average(currentSc.map((s) => s.cdf)).toFixed(2), target: "≥ 4.80", status: standingFromValue(average(currentSc.map((s) => s.cdf)), 4.86, 4.7, 4.5) },
    { label: "POD", value: formatPct(average(currentSc.map((s) => s.pod_compliance))), target: "≥ 98.0%", status: standingFromValue(average(currentSc.map((s) => s.pod_compliance)), 98, 97, 95) },
    { label: "Contact Compliance", value: formatPct(average(currentSc.map((s) => s.contact_compliance))), target: "≥ 97.5%", status: standingFromValue(average(currentSc.map((s) => s.contact_compliance)), 97.5, 96.5, 95) },
    { label: "Photo on Delivery", value: formatPct(average(currentSc.map((s) => s.photo_on_delivery))), target: "≥ 98.0%", status: standingFromValue(average(currentSc.map((s) => s.photo_on_delivery)), 98, 97, 95) },
    { label: "Safety Score", value: formatNumber(safety, 0), target: "≥ 850", status: standingFromValue(safety, 850, 800, 750) },
    { label: "Attendance", value: formatPct(attendance), target: "≥ 98.0%", status: standingFromValue(attendance, 98, 96.5, 94) },
    { label: "Seatbelt", value: formatPct(average(db.drivers.map((d) => d.seatbelt_pct))), target: "≥ 99.0%", status: standingFromValue(average(db.drivers.map((d) => d.seatbelt_pct)), 99, 98, 96) },
    { label: "DNR", value: formatPct(average(currentSc.map((s) => s.dnr)), 2), target: "≤ 0.30%", status: standingFromValue(0.45 - average(currentSc.map((s) => s.dnr)), 0.15, 0.08, 0) },
    { label: "DSC", value: formatPct(average(currentSc.map((s) => s.dsc))), target: "≥ 99.2%", status: standingFromValue(average(currentSc.map((s) => s.dsc)), 99.2, 98.8, 98.2) },
    { label: "CE", value: formatNumber(sum(currentSc.map((s) => s.customer_escalations)), 0), target: "≤ 8 / wk", status: standingFromValue(12 - sum(currentSc.map((s) => s.customer_escalations)), 4, 0, -6) },
  ];

  const volumeDays = dateRange(addDays(TODAY, -6), TODAY).map((date) => {
    const rows = db.forecasts.filter((f) => f.forecast_date === date);
    return {
      day: weekdayShort(date),
      date,
      delivered: sum(rows.map((r) => r.volume_actual ?? r.volume_forecast)),
      planned: sum(rows.map((r) => r.volume_forecast)),
    };
  });

  const stationMix = db.stations.map((station) => {
    const todayRoutes = db.routes.filter((r) => r.station_id === station.id);
    const sc = currentSc.find((s) => s.station_id === station.id);
    return {
      id: station.id,
      name: `${station.code} – ${station.name}`,
      code: station.code,
      value: sum(todayRoutes.map((r) => r.packages_delivered)) || stationVolumeFallback(db, station.id),
      dcr: sc?.dcr ?? 0,
      standing: sc?.standing ?? "great",
      safety: sc?.safety_score ?? 0,
      attendance: sc?.attendance_pct ?? 0,
    };
  });

  const revenueTrend = dateRange(addDays(TODAY, -13), TODAY).map((date) => {
    const rows = db.financialDaily.filter((r) => r.service_date === date);
    return {
      day: weekdayShort(date),
      date,
      revenue: round0(sum(rows.map((r) => r.revenue))),
      profit: round0(sum(rows.map((r) => r.revenue - costsOf(r)))),
    };
  });

  return { kpis, standing, scorecardMetrics, volumeDays, stationMix, revenueTrend, currentSc };
}

function stationVolumeFallback(db: SeedDatabase, stationId: string): number {
  const row = db.forecasts.find((f) => f.station_id === stationId && f.forecast_date === TODAY);
  return row?.volume_actual ?? row?.volume_forecast ?? 0;
}

function standingFromValue(value: number, fantastic: number, great: number, fair: number): ScoreStanding {
  if (value >= fantastic) return "fantastic";
  if (value >= great) return "great";
  if (value >= fair) return "fair";
  return "poor";
}

function round0(value: number): number {
  return Math.round(value);
}

export function buildLiveOperations(db: SeedDatabase) {
  const todayRoutes = db.routes.filter((r) => r.service_date === TODAY);
  const completed = todayRoutes.filter((r) => r.status === "completed").length;
  const delayedDrivers = new Set(db.drivers.filter((d) => d.status === "delayed" || d.status === "rescued").map((d) => d.id));
  const delayed = todayRoutes.filter((r) => delayedDrivers.has(r.driver_id) || r.status === "rescue").length;
  const active = todayRoutes.filter((r) => r.status === "in_progress" || r.status === "rescue" || r.status === "loading").length;
  const packagesDelivered = sum(todayRoutes.map((r) => r.packages_delivered));
  const packagesPlanned = sum(todayRoutes.map((r) => r.packages_planned)) || 1;
  const stopsCompleted = sum(todayRoutes.map((r) => r.stops_completed));
  const stopsPlanned = sum(todayRoutes.map((r) => r.stops_planned)) || 1;

  const routeRows = todayRoutes.map((route) => {
    const driver = db.drivers.find((d) => d.id === route.driver_id);
    const station = db.stations.find((s) => s.id === route.station_id);
    const vehicle = db.vehicles.find((v) => v.id === route.vehicle_id);
    return {
      ...route,
      driverName: driver?.full_name ?? "Unassigned",
      driverStatus: driver?.status ?? "off_duty",
      stationCode: station?.code ?? "",
      vanId: vehicle?.van_id ?? "",
      completion: route.stops_planned ? route.stops_completed / route.stops_planned : 0,
    };
  });

  const rescueRows = db.rescues.map((rescue) => {
    const distressed = db.routes.find((r) => r.id === rescue.distressed_route_id);
    const helper = db.routes.find((r) => r.id === rescue.rescue_route_id);
    const distressedDriver = db.drivers.find((d) => d.id === distressed?.driver_id);
    const helperDriver = db.drivers.find((d) => d.id === helper?.driver_id);
    return {
      ...rescue,
      distressedRoute: distressed?.route_code ?? "—",
      distressedDriver: distressedDriver?.full_name ?? "—",
      rescueRoute: helper?.route_code ?? "Unassigned",
      rescueDriver: helperDriver?.full_name ?? "Pending",
      stationCode: db.stations.find((s) => s.id === distressed?.station_id)?.code ?? "",
    };
  });

  const failedRows = db.failedDeliveries.map((fail) => {
    const route = db.routes.find((r) => r.id === fail.route_id);
    const driver = db.drivers.find((d) => d.id === route?.driver_id);
    return {
      ...fail,
      routeCode: route?.route_code ?? "—",
      driverName: driver?.full_name ?? "—",
      stationCode: db.stations.find((s) => s.id === route?.station_id)?.code ?? "",
    };
  });

  const stationPerf = db.stations.map((station) => {
    const stationRoutes = todayRoutes.filter((r) => r.station_id === station.id);
    const planned = sum(stationRoutes.map((r) => r.packages_planned));
    const delivered = sum(stationRoutes.map((r) => r.packages_delivered));
    const failed = sum(stationRoutes.map((r) => r.failed_count));
    return {
      id: station.id,
      code: station.code,
      name: station.name,
      routes: stationRoutes.length,
      completion: planned ? delivered / planned : 0,
      delivered,
      failed,
      delayed: stationRoutes.filter((r) => r.status === "rescue" || delayedDrivers.has(r.driver_id)).length,
      onTime: average(stationRoutes.map((r) => db.drivers.find((d) => d.id === r.driver_id)?.on_time_pct ?? 0)),
    };
  });

  return {
    active,
    completed,
    delayed,
    rescueActive: db.rescues.filter((r) => r.status !== "completed").length,
    failedCount: db.failedDeliveries.length,
    networkOnTime: average(db.drivers.filter((d) => d.status !== "off_duty").map((d) => d.on_time_pct)),
    completionPct: stopsCompleted / stopsPlanned,
    packagePct: packagesDelivered / packagesPlanned,
    hourlyProgress: db.hourlyProgress,
    routeRows,
    rescueRows,
    failedRows,
    stationPerf,
  };
}

export function compositeScore(driver: { dcr: number; safety_score: number; attendance_pct: number; on_time_pct: number }): number {
  return 0.35 * driver.dcr + 0.25 * (driver.safety_score / 10) + 0.2 * driver.attendance_pct + 0.2 * driver.on_time_pct;
}

export function buildDriverPerformance(db: SeedDatabase) {
  const ranked = [...db.drivers]
    .map((driver) => ({
      ...driver,
      composite: compositeScore(driver),
      events: db.safetyEvents.filter((e) => e.driver_id === driver.id).length,
      openCoaching: db.coaching.filter((c) => c.driver_id === driver.id && !c.completed_at).length,
      openDiscipline: db.discipline.filter((d) => d.driver_id === driver.id && d.status === "open").length,
      ptoHours: sum(db.pto.filter((p) => p.driver_id === driver.id && (p.status === "approved" || p.status === "taken")).map((p) => p.hours)),
    }))
    .sort((a, b) => b.composite - a.composite);

  const weekAttendance = db.attendance.filter((a) => a.service_date >= WEEK_START);
  const attendanceSummary = db.drivers.map((driver) => {
    const rows = weekAttendance.filter((a) => a.driver_id === driver.id);
    return {
      id: driver.id,
      name: driver.full_name,
      present: rows.filter((r) => r.status === "present").length,
      late: rows.filter((r) => r.status === "late").length,
      missed: rows.filter((r) => r.status === "absent" || r.status === "call_out").length,
      pto: rows.filter((r) => r.status === "pto").length,
      pct: driver.attendance_pct,
      days: rows,
    };
  });

  const currentPayroll = db.payroll.filter((row) => row.period_start === WEEK_START);

  return {
    ranked,
    coaching: db.coaching,
    safetyEvents: [...db.safetyEvents].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)),
    attendanceSummary,
    weekDates: dateRange(WEEK_START, TODAY),
    pto: db.pto,
    discipline: [...db.discipline].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)),
    payroll: currentPayroll,
  };
}

export function buildFinancial(db: SeedDatabase) {
  const mtd = db.financialDaily.filter((r) => r.service_date >= MONTH_START && r.service_date <= TODAY);
  const prior = priorPeriod(MONTH_START, TODAY);
  const priorMtd = db.financialDaily.filter((r) => r.service_date >= prior.from && r.service_date <= prior.to);

  const totals = rollup(mtd);
  const previous = rollup(priorMtd);

  const kpis: Kpi[] = [
    { label: "Revenue", value: formatUsdCompact(totals.revenue), ...deltaPct(totals.revenue, previous.revenue), hint: "MTD", favorable: "up" },
    { label: "Labor", value: formatUsdCompact(totals.labor), ...deltaPct(totals.labor, previous.labor), hint: "Regular wages", favorable: "down" },
    { label: "Overtime", value: formatUsdCompact(totals.overtime), ...deltaPct(totals.overtime, previous.overtime), hint: "Premium labor", favorable: "down" },
    { label: "Fuel", value: formatUsdCompact(totals.fuel), ...deltaPct(totals.fuel, previous.fuel), hint: "Energy + ICE", favorable: "down" },
    { label: "Vehicle costs", value: formatUsdCompact(totals.vehicle), ...deltaPct(totals.vehicle, previous.vehicle), hint: "Lease, maint., insurance", favorable: "down" },
    { label: "Profitability", value: formatPct((totals.profit / Math.max(totals.revenue, 1)) * 100), ...deltaPts((totals.profit / Math.max(totals.revenue, 1)) * 100, (previous.profit / Math.max(previous.revenue, 1)) * 100), hint: formatUsdCompact(totals.profit), favorable: "up" },
  ];

  const monthly = monthBuckets(db);
  const costBreakdown = [
    { name: "Labor", value: roundShare(totals.labor, totals.costs) },
    { name: "Overtime", value: roundShare(totals.overtime, totals.costs) },
    { name: "Fuel", value: roundShare(totals.fuel, totals.costs) },
    { name: "Vehicle", value: roundShare(totals.vehicle, totals.costs) },
    { name: "Other", value: roundShare(totals.other, totals.costs) },
  ];

  const stationProfit = db.stations.map((station) => {
    const rows = mtd.filter((r) => r.station_id === station.id);
    const t = rollup(rows);
    return {
      id: station.id,
      code: station.code,
      name: station.name,
      ...t,
      margin: t.revenue ? t.profit / t.revenue : 0,
    };
  });

  const daily = dateRange(addDays(TODAY, -13), TODAY).map((date) => {
    const t = rollup(db.financialDaily.filter((r) => r.service_date === date));
    return { date, day: weekdayShort(date), ...t };
  });

  const routeProfit = db.routes
    .map((route) => {
      const econ = routeEconomics(route, db.rescues);
      const driver = db.drivers.find((d) => d.id === route.driver_id);
      const station = db.stations.find((s) => s.id === route.station_id);
      return {
        id: route.id,
        routeCode: route.route_code,
        driverName: driver?.full_name ?? "Unassigned",
        stationCode: station?.code ?? "",
        packages: route.packages_delivered,
        stops: route.stops_completed,
        failed: route.failed_count,
        ...econ,
      };
    })
    .sort((a, b) => b.profit - a.profit);

  const currentPayroll = db.payroll.filter((row) => row.period_start === WEEK_START);
  const priorPayroll = db.payroll.filter((row) => row.period_start < WEEK_START);
  const driverRevenue = db.drivers
    .map((driver) => {
      const route = db.routes.find((row) => row.driver_id === driver.id);
      const econ = route ? routeEconomics(route, db.rescues) : null;
      const pay = currentPayroll.find((row) => row.driver_id === driver.id);
      return {
        id: driver.id,
        name: driver.full_name,
        stationCode: db.stations.find((s) => s.id === driver.station_id)?.code ?? "",
        revenue: econ?.revenue ?? 0,
        labor: (pay?.regular_pay ?? 0) + (pay?.overtime_pay ?? 0),
        overtime: pay?.overtime_pay ?? 0,
        overtimeHours: pay?.overtime_hours ?? 0,
        profit: econ ? round2(econ.revenue - ((pay?.regular_pay ?? 0) + (pay?.overtime_pay ?? 0) + econ.fuel + econ.vehicle)) : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const expenseMtd = db.expenses.filter((row) => row.service_date >= MONTH_START && row.service_date <= TODAY);
  const fuelExpenses = sum(expenseMtd.filter((row) => row.category === "fuel").map((row) => row.amount));
  const maintenanceExpenses = sum(expenseMtd.filter((row) => row.category === "maintenance").map((row) => row.amount));
  const overtimePayroll = sum(currentPayroll.map((row) => row.overtime_pay));
  const netProfit = totals.profit;

  return {
    kpis,
    monthly,
    costBreakdown,
    stationProfit,
    daily,
    totals,
    routeProfit,
    driverRevenue,
    expenseMtd,
    fuelExpenses,
    maintenanceExpenses,
    overtimePayroll,
    payroll: currentPayroll,
    priorPayroll,
    netProfit,
  };
}

export function routeEconomics(route: SeedDatabase["routes"][number], rescues: SeedDatabase["rescues"]) {
  const distressed = rescues.some((row) => row.distressed_route_id === route.id && row.status !== "completed");
  const helper = rescues.some((row) => row.rescue_route_id === route.id && row.status !== "completed");
  const revenue = round2(92 + route.packages_delivered * 0.148 + route.stops_completed * 0.58);
  const baseHours = route.status === "completed" ? 9.1 : 9.7;
  const otHours = distressed || route.status === "rescue" || route.failed_count >= 4 ? 2.3 : helper ? 1.2 : 0.4;
  const labor = round2(baseHours * 21.75);
  const overtime = round2(otHours * 32.63);
  const fuel = round2(11.5 + route.stops_planned * 0.045);
  const vehicle = 41.5;
  const other = round2(route.failed_count * 3.75 + (distressed ? 18 : 0));
  const costs = round2(labor + overtime + fuel + vehicle + other);
  const profit = round2(revenue - costs);
  return { revenue, labor, overtime, fuel, vehicle, other, costs, profit, margin: revenue ? profit / revenue : 0 };
}

export function buildFleet(db: SeedDatabase) {
  const dueSoon = db.vehicles.filter((v) => v.odometer_miles >= v.next_service_miles - 750);
  const latestInspection = (vehicleId: string) => db.inspections.find((row) => row.vehicle_id === vehicleId);
  const rows = db.vehicles.map((vehicle) => {
    const driver = db.drivers.find((d) => d.id === vehicle.assigned_driver_id);
    const station = db.stations.find((s) => s.id === vehicle.station_id);
    const inspection = latestInspection(vehicle.id);
    const route = db.routes.find((r) => r.vehicle_id === vehicle.id);
    return {
      ...vehicle,
      driverName: driver?.full_name ?? "Spare / unassigned",
      stationCode: station?.code ?? "",
      inspectionStatus: inspection?.status ?? "pending",
      defects: inspection?.defects ?? [],
      routeCode: route?.route_code ?? "—",
      serviceDue: vehicle.odometer_miles >= vehicle.next_service_miles - 750,
    };
  });

  const dvicPass = db.inspections.filter((i) => i.status === "pass").length;
  const openDowntime = db.downtime.filter((row) => !row.ended_at);
  const openMaintenance = db.maintenance.filter((row) => row.status !== "completed");
  const downtimeHours = sum(db.downtime.map((row) => row.hours));

  return {
    kpis: [
      { label: "Active vans", value: String(db.vehicles.filter((v) => v.status === "active").length), delta: `${db.vehicles.length} in fleet`, trend: "up" as const, hint: "Ready for wave", favorable: "up" as const },
      { label: "Maintenance / OOS", value: String(db.vehicles.filter((v) => v.status !== "active").length), delta: dueSoon.length ? `${dueSoon.length} service due` : "On cadence", trend: dueSoon.length ? "down" as const : "up" as const, hint: "Hold or shop", favorable: "down" as const },
      { label: "DVIC compliance", value: formatPct((dvicPass / Math.max(db.inspections.length, 1)) * 100), delta: `${db.inspections.filter((i) => i.status === "fail").length} fail`, trend: db.inspections.some((i) => i.status === "fail") ? "down" as const : "up" as const, hint: "Daily vehicle inspection", favorable: "up" as const },
      { label: "Open downtime", value: `${formatNumber(downtimeHours, 1)}h`, delta: `${openDowntime.length} vans held`, trend: openDowntime.length ? "down" as const : "up" as const, hint: "Accident / shop / parts", favorable: "down" as const },
    ],
    rows,
    dueSoon,
    maintenance: db.maintenance,
    downtime: db.downtime,
    openMaintenance,
    openDowntime,
  };
}

function rollup(rows: SeedDatabase["financialDaily"]) {
  const revenue = sum(rows.map((r) => r.revenue));
  const labor = sum(rows.map((r) => r.labor_cost));
  const overtime = sum(rows.map((r) => r.overtime_cost));
  const fuel = sum(rows.map((r) => r.fuel_cost));
  const vehicle = sum(rows.map((r) => r.vehicle_cost));
  const other = sum(rows.map((r) => r.other_cost));
  const costs = labor + overtime + fuel + vehicle + other;
  return { revenue, labor, overtime, fuel, vehicle, other, costs, profit: revenue - costs };
}

function roundShare(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function monthBuckets(db: SeedDatabase) {
  const mtd = rollup(db.financialDaily.filter((r) => r.service_date >= MONTH_START && r.service_date <= TODAY));
  const fullMonth = {
    revenue: mtd.revenue * (30 / 20),
    cost: mtd.costs * (30 / 20),
  };
  const factors = [
    { month: "Apr", rev: 0.76, cost: 0.8 },
    { month: "May", rev: 0.82, cost: 0.84 },
    { month: "Jun", rev: 0.88, cost: 0.87 },
    { month: "Jul", rev: 0.93, cost: 0.91 },
    { month: "Aug", rev: 0.97, cost: 0.95 },
    { month: "Sep", rev: 1, cost: 1 },
  ];
  return factors.map((factor) =>
    factor.month === "Sep"
      ? { month: factor.month, revenue: mtd.revenue, cost: mtd.costs }
      : { month: factor.month, revenue: fullMonth.revenue * factor.rev, cost: fullMonth.cost * factor.cost },
  );
}

export function buildSafety(db: SeedDatabase) {
  const speeding = db.safetyEvents.filter((e) => e.event_type === "speeding");
  const seatbelt = db.safetyEvents.filter((e) => e.event_type === "seatbelt");
  const inspectionsToday = db.inspections;
  const passed = inspectionsToday.filter((i) => i.status === "pass").length;
  const failed = inspectionsToday.filter((i) => i.status === "fail").length;
  const pending = inspectionsToday.filter((i) => i.status === "pending").length;
  const seatbeltPct = average(db.drivers.map((d) => d.seatbelt_pct));

  const byType = [
    "speeding",
    "seatbelt",
    "following_distance",
    "sign_signal",
    "distraction",
    "harsh_braking",
  ].map((type) => ({
    type: type.replace(/_/g, " "),
    count: db.safetyEvents.filter((e) => e.event_type === type).length,
  }));

  const weekly = dateRange(addDays(TODAY, -35), TODAY)
    .reduce<{ week: string; incidents: number; events: number }[]>((acc, date, index) => {
      if (index % 7 !== 0) return acc;
      const end = addDays(date, 6);
      const weekIncidents = db.incidents.filter((i) => i.occurred_at.slice(0, 10) >= date && i.occurred_at.slice(0, 10) <= end).length;
      const weekEvents = db.safetyEvents.filter((e) => e.occurred_at.slice(0, 10) >= date && e.occurred_at.slice(0, 10) <= end).length;
      acc.push({ week: `W${acc.length + 1}`, incidents: weekIncidents, events: weekEvents });
      return acc;
    }, []);

  return {
    kpis: [
      { label: "Inspections passed", value: `${passed}/${inspectionsToday.length}`, delta: failed ? `${failed} fail` : "All clear", trend: failed ? "down" : "up", hint: pending ? `${pending} pending` : "Pre-trip today", favorable: "up" as const },
      { label: "Speeding events", value: String(speeding.length), delta: `${speeding.filter((e) => e.severity === "high").length} high`, trend: speeding.length > 3 ? "down" : "up", hint: "Trailing 7 days", favorable: "down" as const },
      { label: "Seatbelt compliance", value: formatPct(seatbeltPct), delta: `${seatbelt.length} events`, trend: seatbeltPct >= 99 ? "up" : "down", hint: "Network average", favorable: "up" as const },
      { label: "Open incidents", value: String(db.incidents.filter((i) => i.status !== "closed").length), delta: `${db.incidents.length} total`, trend: db.incidents.some((i) => i.status === "open") ? "down" : "up", hint: "Accident / property / injury", favorable: "down" as const },
    ] satisfies Kpi[],
    inspections: inspectionsToday,
    speeding,
    seatbeltEvents: seatbelt,
    incidents: [...db.incidents].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)),
    events: [...db.safetyEvents].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)),
    byType,
    weekly,
    seatbeltPct,
  };
}

export function buildForecasting(db: SeedDatabase) {
  const horizon = dateRange(addDays(TODAY, -3), addDays(TODAY, 7));
  const series = horizon.map((date) => {
    const rows = db.forecasts.filter((f) => f.forecast_date === date);
    return {
      date,
      day: weekdayShort(date),
      actual: sum(rows.map((r) => r.volume_actual ?? 0)) || null,
      forecast: sum(rows.map((r) => r.volume_forecast)),
      lower: sum(rows.map((r) => r.volume_lower)),
      upper: sum(rows.map((r) => r.volume_upper)),
      routes: sum(rows.map((r) => r.routes_forecast)),
      staffing: sum(rows.map((r) => r.staffing_forecast)),
      overtime: sum(rows.map((r) => r.overtime_hours_forecast)),
    };
  });

  const future = series.filter((row) => row.date > TODAY);
  const peak = [...future].sort((a, b) => b.forecast - a.forecast)[0];
  const next7Volume = sum(future.map((r) => r.forecast));
  const next7Routes = sum(future.map((r) => r.routes));
  const next7Staff = average(future.map((r) => r.staffing));
  const next7Ot = sum(future.map((r) => r.overtime));

  return {
    series: series.map((row) => ({ ...row, range: [row.lower, row.upper] as [number, number], actual: row.date <= TODAY ? row.actual : null })),
    table: series,
    kpis: [
      { label: "Volume forecast", value: formatNumber(next7Volume), delta: peak ? `Peak ${peak.day}` : "", trend: "up" as const, hint: "Next 7 days packages", favorable: "up" as const },
      { label: "Route forecast", value: formatNumber(next7Routes), delta: `${formatNumber(average(future.map((r) => r.routes)), 0)} / day`, trend: "up" as const, hint: "Wave plan", favorable: "up" as const },
      { label: "Staffing forecast", value: formatNumber(next7Staff, 0), delta: "DA / extra needed", trend: "flat" as const, hint: "Average daily headcount", favorable: "up" as const },
      { label: "Overtime forecast", value: `${formatNumber(next7Ot, 0)}h`, delta: formatUsdCompact(next7Ot * 32.5), hint: "Premium hours", trend: next7Ot > 200 ? "down" : "up", favorable: "down" as const },
    ] satisfies Kpi[],
    peak,
  };
}

export function buildScorecard(db: SeedDatabase) {
  const currentSc = latestScorecards(db);
  const previousSc = previousScorecards(db);
  const dcr = average(currentSc.map((s) => s.dcr));
  const cdf = average(currentSc.map((s) => s.cdf));
  const pod = average(currentSc.map((s) => s.pod_compliance));
  const safety = average(currentSc.map((s) => s.safety_score));
  const fico = average(currentSc.map((s) => s.fico_score));
  const prevDcr = average(previousSc.map((s) => s.dcr));
  const prevCdf = average(previousSc.map((s) => s.cdf));
  const prevPod = average(previousSc.map((s) => s.pod_compliance));
  const prevSafety = average(previousSc.map((s) => s.safety_score));
  const prevFico = average(previousSc.map((s) => s.fico_score));

  const standingCounts = currentSc.reduce<Record<string, number>>((acc, row) => {
    acc[row.standing] = (acc[row.standing] ?? 0) + 1;
    return acc;
  }, {});
  const standing = (["fantastic", "great", "fair", "poor"] as ScoreStanding[]).find((key) => (standingCounts[key] ?? 0) > 0) ?? "great";

  const kpis: Kpi[] = [
    { label: "DCR", value: formatPct(dcr), ...deltaPts(dcr, prevDcr), hint: "Delivery completion rate", favorable: "up" },
    { label: "POD", value: formatPct(pod), ...deltaPts(pod, prevPod), hint: "Photo-on-delivery compliance", favorable: "up" },
    { label: "CDF", value: cdf.toFixed(2), ...deltaPts(cdf, prevCdf), hint: "Customer delivery feedback", favorable: "up" },
    { label: "Safety Score", value: formatNumber(safety, 0), ...deltaPct(safety, prevSafety), hint: "Mentor composite", favorable: "up" },
    { label: "FICO", value: formatNumber(fico, 0), ...deltaPct(fico, prevFico), hint: "Network Mentor / FICO", favorable: "up" },
    { label: "Standing", value: STANDING_LABEL[standing], delta: `${currentSc.filter((s) => s.standing === "fantastic").length}/${currentSc.length} Fantastic`, trend: standing === "fantastic" || standing === "great" ? "up" : "down", hint: "Amazon weekly scorecard", favorable: "up" },
  ];

  const metricDefs = [
    { key: "dcr" as const, label: "DCR", format: (v: number) => formatPct(v), target: "≥ 99.0%", fantastic: 99, great: 98.2, fair: 97 },
    { key: "pod_compliance" as const, label: "POD", format: (v: number) => formatPct(v), target: "≥ 98.0%", fantastic: 98, great: 97, fair: 95 },
    { key: "cdf" as const, label: "CDF", format: (v: number) => v.toFixed(2), target: "≥ 4.80", fantastic: 4.86, great: 4.7, fair: 4.5 },
    { key: "safety_score" as const, label: "Safety", format: (v: number) => formatNumber(v, 0), target: "≥ 850", fantastic: 850, great: 800, fair: 750 },
    { key: "fico_score" as const, label: "FICO", format: (v: number) => formatNumber(v, 0), target: "≥ 850", fantastic: 850, great: 800, fair: 750 },
    { key: "photo_on_delivery" as const, label: "Photo on Delivery", format: (v: number) => formatPct(v), target: "≥ 98.0%", fantastic: 98, great: 97, fair: 95 },
    { key: "contact_compliance" as const, label: "Contact", format: (v: number) => formatPct(v), target: "≥ 97.5%", fantastic: 97.5, great: 96.5, fair: 95 },
    { key: "attendance_pct" as const, label: "Attendance", format: (v: number) => formatPct(v), target: "≥ 98.0%", fantastic: 98, great: 96.5, fair: 94 },
    { key: "dsc" as const, label: "DSC", format: (v: number) => formatPct(v), target: "≥ 99.2%", fantastic: 99.2, great: 98.8, fair: 98.2 },
    { key: "dnr" as const, label: "DNR", format: (v: number) => formatPct(v, 2), target: "≤ 0.30%", invert: true, fantastic: 0.15, great: 0.08, fair: 0 },
  ];

  const tiles = metricDefs.map((def) => {
    const value = average(currentSc.map((row) => row[def.key]));
    const prev = average(previousSc.map((row) => row[def.key]));
    if (def.invert) {
      return {
        label: def.label,
        value: def.format(value),
        target: def.target,
        status: standingFromValue(0.45 - value, def.fantastic, def.great, def.fair),
        ...deltaPts(prev, value),
      };
    }
    return {
      label: def.label,
      value: def.format(value),
      target: def.target,
      status: standingFromValue(value, def.fantastic, def.great, def.fair),
      ...deltaPts(value, prev),
    };
  });

  const weeks = [...new Set(db.scorecards.map((row) => row.week_start))].sort();
  const weeklyTrend = weeks.map((week) => {
    const rows = db.scorecards.filter((row) => row.week_start === week);
    return {
      week: week.slice(5),
      weekStart: week,
      dcr: round2(average(rows.map((r) => r.dcr))),
      pod: round2(average(rows.map((r) => r.pod_compliance))),
      cdf: round2(average(rows.map((r) => r.cdf))),
      safety: Math.round(average(rows.map((r) => r.safety_score))),
      fico: Math.round(average(rows.map((r) => r.fico_score))),
      attendance: round2(average(rows.map((r) => r.attendance_pct))),
    };
  });

  const stationRows = db.stations.map((station) => {
    const sc = currentSc.find((row) => row.station_id === station.id);
    const prev = previousSc.find((row) => row.station_id === station.id);
    return {
      id: station.id,
      code: station.code,
      name: station.name,
      standing: sc?.standing ?? "great",
      dcr: sc?.dcr ?? 0,
      pod: sc?.pod_compliance ?? 0,
      cdf: sc?.cdf ?? 0,
      safety: sc?.safety_score ?? 0,
      fico: sc?.fico_score ?? 0,
      dnr: sc?.dnr ?? 0,
      dsc: sc?.dsc ?? 0,
      ce: sc?.customer_escalations ?? 0,
      dcrDelta: (sc?.dcr ?? 0) - (prev?.dcr ?? 0),
    };
  });

  const driverFico = [...db.drivers]
    .map((driver) => ({
      id: driver.id,
      name: driver.full_name,
      stationCode: db.stations.find((s) => s.id === driver.station_id)?.code ?? "",
      fico: driver.fico_score,
      safety: driver.safety_score,
      dcr: driver.dcr,
      seatbelt: driver.seatbelt_pct,
    }))
    .sort((a, b) => a.fico - b.fico);

  return { kpis, tiles, weeklyTrend, stationRows, driverFico, standing, currentSc };
}

function expectedStopPace(route: SeedDatabase["routes"][number], asOfHour = 16.5): number {
  if (route.status === "completed") return 1;
  if (!route.started_at) return 0;
  const startHour = Number(route.started_at.slice(11, 13)) + Number(route.started_at.slice(14, 16)) / 60;
  const elapsed = Math.max(0, asOfHour - startHour);
  return Math.min(1, elapsed / 10.5);
}

export function buildRouteManagement(db: SeedDatabase) {
  const live = buildLiveOperations(db);
  const finance = buildFinancial(db);
  const completed = db.routes.filter((r) => r.status === "completed").length;
  const completionRate = completed / Math.max(db.routes.length, 1);

  const variance = db.routes.map((route) => {
    const expected = expectedStopPace(route);
    const actual = route.stops_planned ? route.stops_completed / route.stops_planned : 0;
    const packageActual = route.packages_planned ? route.packages_delivered / route.packages_planned : 0;
    const driver = db.drivers.find((d) => d.id === route.driver_id);
    const station = db.stations.find((s) => s.id === route.station_id);
    const econ = finance.routeProfit.find((row) => row.id === route.id);
    const rescue = db.rescues.find((row) => row.distressed_route_id === route.id);
    return {
      ...route,
      driverName: driver?.full_name ?? "Unassigned",
      stationCode: station?.code ?? "",
      expected,
      actual,
      packageActual,
      stopVariance: round2((actual - expected) * 100),
      remaining: route.stops_planned - route.stops_completed,
      revenue: econ?.revenue ?? 0,
      profit: econ?.profit ?? 0,
      margin: econ?.margin ?? 0,
      rescueStatus: rescue?.status ?? null,
    };
  });

  const underperforming = variance.filter((row) => row.stopVariance < -8 || row.profit < 0 || row.status === "rescue");

  return {
    kpis: [
      { label: "Completion rate", value: formatPct(completionRate * 100), delta: `${completed}/${db.routes.length} done`, trend: completionRate > 0.2 ? "up" as const : "down" as const, hint: "Routes closed today", favorable: "up" as const },
      { label: "Avg stop pace", value: formatPct(average(variance.map((r) => r.actual)) * 100), delta: `${formatNumber(average(variance.map((r) => r.stopVariance)), 1)}pp vs plan`, trend: average(variance.map((r) => r.stopVariance)) >= 0 ? "up" as const : "down" as const, hint: "Vs. expected by 16:30", favorable: "up" as const },
      { label: "Revenue / route", value: formatUsd(average(variance.map((r) => r.revenue))), delta: "Today's wave", trend: "flat" as const, hint: "Package + stop rate", favorable: "up" as const },
      { label: "Open rescues", value: String(db.rescues.filter((r) => r.status !== "completed").length), delta: `${db.rescues.length} total`, trend: db.rescues.some((r) => r.status !== "completed") ? "down" as const : "up" as const, hint: "Assignment workflow", favorable: "down" as const },
    ] satisfies Kpi[],
    variance,
    underperforming,
    rescueRows: live.rescueRows,
    routeRows: live.routeRows,
    routeProfit: finance.routeProfit,
  };
}

export function buildInsights(db: SeedDatabase): { insights: Insight[]; counts: Record<string, number> } {
  const routes = buildRouteManagement(db);
  const forecast = buildForecasting(db);
  const todayForecast = db.forecasts.filter((row) => row.forecast_date === TODAY);
  const staffingNeed = sum(todayForecast.map((row) => row.staffing_forecast));
  const available = db.drivers.filter((d) => d.status !== "off_duty").length;
  const ptoToday = db.pto.filter((row) => row.start_date <= TODAY && row.end_date >= TODAY && (row.status === "approved" || row.status === "taken"));
  const insights: Insight[] = [];

  if (available < staffingNeed || ptoToday.length > 0) {
    insights.push({
      id: "ins-staff",
      category: "staffing",
      severity: available + 2 < staffingNeed ? "critical" : "warning",
      title: "Staffing short of today's wave plan",
      recommendation: `Only ${available} drivers are on the board versus ${formatNumber(staffingNeed, 0)} forecast headcount. Cover ${ptoToday.length} PTO/call-out gaps with extras or flex DAs before launch.`,
      metric: `${available} available / ${formatNumber(staffingNeed, 0)} planned`,
    });
  }

  const otHours = sum(db.payroll.filter((row) => row.period_start === WEEK_START).map((row) => row.overtime_hours));
  const otForecast = forecast.kpis.find((k) => k.label === "Overtime forecast");
  if (otHours > 25 || routes.variance.some((row) => row.status === "rescue" || row.stopVariance < -12)) {
    insights.push({
      id: "ins-ot",
      category: "overtime",
      severity: otHours > 40 ? "critical" : "warning",
      title: "Overtime risk on distressed routes",
      recommendation: "Close open rescues before 17:00 and cap extra DA hours. Petrova and Brooks are already accruing premium time on CX-31 and CX-27.",
      metric: `${formatNumber(otHours, 1)} OT hours this week${otForecast ? ` · ${otForecast.value} forecast` : ""}`,
    });
  }

  routes.underperforming.forEach((row) => {
    insights.push({
      id: `ins-route-${row.id}`,
      category: "routes",
      severity: row.profit < 0 || row.status === "rescue" ? "critical" : "warning",
      title: `${row.route_code} is underperforming`,
      recommendation:
        row.status === "rescue"
          ? `Assign or complete the rescue on ${row.route_code}. ${row.remaining} stops remain and the route is ${Math.abs(row.stopVariance).toFixed(1)}pp behind expected pace.`
          : `${row.route_code} is ${Math.abs(row.stopVariance).toFixed(1)}pp off plan with ${formatUsd(row.profit)} contribution. Re-sequence remaining stops or transfer 15–20.`,
      metric: `${formatPct(row.actual * 100)} complete · ${formatUsd(row.profit)}`,
      stationCode: row.stationCode,
    });
  });

  db.drivers
    .filter((driver) => driver.fico_score < 800 || driver.safety_score < 780 || db.discipline.some((d) => d.driver_id === driver.id && d.status === "open"))
    .forEach((driver) => {
      const open = db.discipline.find((d) => d.driver_id === driver.id && d.status === "open");
      insights.push({
        id: `ins-risk-${driver.id}`,
        category: "safety",
        severity: driver.fico_score < 760 || open?.type === "final" ? "critical" : "warning",
        title: `${driver.full_name} is high-risk`,
        recommendation: open
          ? `Open ${open.type} notice (${open.category}). Complete coaching and restrict residential speed corridors until FICO recovers.`
          : `FICO ${driver.fico_score} / safety ${driver.safety_score}. Schedule a dual-ride and Mentor review this week.`,
        metric: `FICO ${driver.fico_score} · Safety ${driver.safety_score}`,
        stationCode: db.stations.find((s) => s.id === driver.station_id)?.code,
      });
    });

  const finance = buildFinancial(db);
  const weakStations = finance.stationProfit.filter((row) => row.margin < 0.22);
  const losingRoutes = finance.routeProfit.filter((row) => row.profit < 0);
  if (weakStations.length || losingRoutes.length || finance.maintenanceExpenses > 4000) {
    insights.push({
      id: "ins-pnl",
      category: "profitability",
      severity: losingRoutes.length > 1 ? "critical" : "warning",
      title: "Profitability pressure this wave",
      recommendation: `${losingRoutes.length} route(s) are below breakeven and MTD maintenance is ${formatUsdCompact(finance.maintenanceExpenses)}. Hold overtime on rescued routes and delay non-critical PMs past peak.`,
      metric: `MTD profit ${formatUsdCompact(finance.netProfit)} · maint ${formatUsdCompact(finance.maintenanceExpenses)}`,
    });
  }

  const saturday = forecast.table.find((row) => row.day === "Sat" && row.date > TODAY);
  if (saturday && saturday.overtime > 40) {
    insights.push({
      id: "ins-peak-ot",
      category: "overtime",
      severity: "watch",
      title: "Saturday peak overtime is building",
      recommendation: `Pre-stage ${formatNumber(saturday.staffing, 0)} DAs for ${saturday.day} and lock PTO denials already on the board.`,
      metric: `${formatNumber(saturday.overtime, 0)}h OT forecast`,
    });
  }

  const counts = insights.reduce<Record<string, number>>((acc, row) => {
    acc[row.severity] = (acc[row.severity] ?? 0) + 1;
    acc[row.category] = (acc[row.category] ?? 0) + 1;
    return acc;
  }, {});

  const rank: Record<Insight["severity"], number> = { critical: 0, warning: 1, watch: 2 };
  insights.sort((a, b) => rank[a.severity] - rank[b.severity] || a.category.localeCompare(b.category));

  return { insights, counts };
}

export function buildImports(db: SeedDatabase) {
  const labels: Record<SeedDatabase["importJobs"][number]["source"], string> = {
    amazon_scorecard: "Amazon scorecard",
    payroll: "Payroll register",
    fuel_card: "Fuel / charge card",
    fleet_maintenance: "Fleet maintenance",
  };
  return {
    jobs: db.importJobs.map((job) => ({
      ...job,
      label: labels[job.source],
    })),
    ready: db.importJobs.filter((job) => job.status === "ready" || job.status === "mapped").length,
    failed: sum(db.importJobs.map((job) => job.records_failed)),
    imported: sum(db.importJobs.map((job) => job.records_imported)),
  };
}

