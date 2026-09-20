import { TODAY, WEEK_START, MONTH_START } from "../data/seed";
import type { SeedDatabase, Kpi, ScoreStanding, SessionUser } from "../types/database";
import { addDays, average, dateRange, formatNumber, formatPct, formatUsdCompact, round2, sum, weekdayShort } from "./format";

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

  return {
    ranked,
    coaching: db.coaching,
    safetyEvents: [...db.safetyEvents].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)),
    attendanceSummary,
    weekDates: dateRange(WEEK_START, TODAY),
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

  return { kpis, monthly, costBreakdown, stationProfit, daily, totals, routeProfit };
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

  return {
    kpis: [
      { label: "Active vans", value: String(db.vehicles.filter((v) => v.status === "active").length), delta: `${db.vehicles.length} in fleet`, trend: "up" as const, hint: "Ready for wave", favorable: "up" as const },
      { label: "Maintenance / OOS", value: String(db.vehicles.filter((v) => v.status !== "active").length), delta: dueSoon.length ? `${dueSoon.length} service due` : "On cadence", trend: dueSoon.length ? "down" as const : "up" as const, hint: "Hold or shop", favorable: "down" as const },
      { label: "Utilization", value: formatPct(average(db.vehicles.filter((v) => v.status === "active").map((v) => v.utilization_pct))), delta: "Today's wave", trend: "flat" as const, hint: "Assigned vs. parked", favorable: "up" as const },
      { label: "Pre-trips passed", value: `${db.inspections.filter((i) => i.status === "pass").length}/${db.inspections.length}`, delta: `${db.inspections.filter((i) => i.status === "fail").length} fail`, trend: db.inspections.some((i) => i.status === "fail") ? "down" as const : "up" as const, hint: "This morning", favorable: "up" as const },
    ],
    rows,
    dueSoon,
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

