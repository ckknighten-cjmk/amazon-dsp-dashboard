import { TODAY } from "../data/seed";
import { addDays, formatPct, round2 } from "./format";
import type {
  DailyReadinessSnapshot,
  DispatchStatus,
  DriverStatus,
  InsightSeverity,
  Kpi,
  LaunchGate,
  ReadinessRecommendation,
  Route,
  SeedDatabase,
  WeatherAlert,
} from "../types/database";

const HIGH_VOLUME_PACKAGES = 1200;
const DAMAGE_DEFECT_RE = /damage|scuff|panel|bumper|collision|dent|sensor/i;

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return round2(Math.min(100, Math.max(0, value)));
}

export function launchGateFor(score: number): LaunchGate {
  if (score >= 85) return "go";
  if (score >= 70) return "conditional";
  return "hold";
}

function weatherScore(alerts: WeatherAlert[]): number {
  if (!alerts.length) return 100;
  const penalty = alerts.reduce((acc, alert) => {
    if (alert.severity === "critical") return acc + (alert.high_risk ? 22 : 18);
    if (alert.severity === "warning") return acc + (alert.high_risk ? 12 : 8);
    return acc + (alert.high_risk ? 6 : 4);
  }, 0);
  return clampPct(100 - penalty);
}

function dispatchStatusFromRoute(route: Route, late: boolean): DispatchStatus {
  if (!route.driver_id) return "unassigned";
  if (route.status === "cancelled") return "cancelled";
  if (route.status === "rescue" || late) return "delayed";
  if (route.status === "planned") return "assigned";
  if (route.status === "loading") return "staged";
  return "dispatched";
}

export function buildMorningDispatch(db: SeedDatabase) {
  const todayRoutes = db.routes.filter((route) => route.service_date === TODAY && route.status !== "cancelled");
  const todayAttendance = db.attendance.filter((row) => row.service_date === TODAY);
  const todayEvents = db.dispatchEvents.filter((row) => row.service_date === TODAY);
  const assignments = db.routeAssignments.filter((row) => row.service_date === TODAY);
  const weatherToday = db.weatherAlerts.filter((row) => row.service_date === TODAY);
  const openDowntime = db.downtime.filter((row) => !row.ended_at);
  const groundedIds = new Set([
    ...db.vehicles.filter((van) => van.status === "oos" || van.status === "maintenance").map((van) => van.id),
    ...openDowntime.map((row) => row.vehicle_id),
  ]);

  const ptoIds = unique([
    ...todayAttendance.filter((row) => row.status === "pto").map((row) => row.driver_id),
    ...db.pto
      .filter((row) => row.start_date <= TODAY && row.end_date >= TODAY && (row.status === "approved" || row.status === "taken"))
      .map((row) => row.driver_id),
    ...todayEvents.filter((row) => row.event_type === "pto" && row.driver_id).map((row) => row.driver_id as string),
  ]);
  const callOutIds = unique([
    ...todayAttendance.filter((row) => row.status === "call_out").map((row) => row.driver_id),
    ...todayEvents.filter((row) => row.event_type === "call_out" && row.driver_id).map((row) => row.driver_id as string),
  ]);
  const namedNoShowIds = unique(
    [
      ...todayAttendance.filter((row) => row.status === "absent" || row.status === "no_show").map((row) => row.driver_id),
      ...todayEvents.filter((row) => row.event_type === "no_show" && row.driver_id).map((row) => row.driver_id as string),
    ].filter((id) => !ptoIds.includes(id) && !callOutIds.includes(id)),
  );
  const anonymousNoShows = todayEvents.filter((row) => row.event_type === "no_show" && !row.driver_id).length;
  const noShows = namedNoShowIds.length + anonymousNoShows;

  const checkedInIds = unique([
    ...todayAttendance.filter((row) => row.status === "present" || row.status === "late").map((row) => row.driver_id),
    ...todayEvents.filter((row) => row.event_type === "check_in" && row.driver_id).map((row) => row.driver_id as string),
  ]);
  const scheduledIds = unique([
    ...todayAttendance.filter((row) => row.status !== "pto").map((row) => row.driver_id),
    ...assignments.filter((row) => row.driver_id).map((row) => row.driver_id as string),
  ]);
  const driversScheduled = scheduledIds.length + anonymousNoShows;
  const driversCheckedIn = checkedInIds.length;

  const unassignedRoutes = todayRoutes.filter((route) => !route.driver_id);
  const openRoutes = assignments.length
    ? assignments.filter((row) => row.assignment_status === "unassigned" || !row.driver_id).length
    : unassignedRoutes.length;
  const routesAssigned = todayRoutes.length - openRoutes;
  const routeCoveragePct = clampPct((routesAssigned / Math.max(todayRoutes.length, 1)) * 100);
  const staffingDelta = driversCheckedIn - todayRoutes.length;
  const staffingReadinessPct = clampPct((driversCheckedIn / Math.max(todayRoutes.length, driversScheduled, 1)) * 100);

  const vansGrounded = db.vehicles.filter((van) => groundedIds.has(van.id));
  const vansAvailable = db.vehicles.filter((van) => !groundedIds.has(van.id) && van.status === "active");
  const inServiceIds = new Set(
    todayRoutes.filter((route) => route.vehicle_id && route.status !== "planned").map((route) => route.vehicle_id as string),
  );
  const vansInService = db.vehicles.filter((van) => inServiceIds.has(van.id));
  const todayInspections = db.inspections.filter((row) => row.inspected_at.slice(0, 10) === TODAY);
  const failedInspections = todayInspections.filter((row) => row.status === "fail");
  const newDvicDefects = failedInspections.reduce((acc, row) => acc + Math.max(row.defects.length, 1), 0);
  const damageFromInspections = failedInspections.filter((row) => row.defects.some((defect) => DAMAGE_DEFECT_RE.test(defect))).length;
  const damageFromIncidents = db.incidents.filter(
    (row) =>
      row.occurred_at.slice(0, 10) >= addDays(TODAY, -1) &&
      (row.category === "property" || row.category === "collision") &&
      row.status !== "closed",
  ).length;
  const newDamageAlerts =
    todayEvents.filter((row) => row.event_type === "damage_alert").length || damageFromInspections + damageFromIncidents;
  const fleetReadinessPct = clampPct((vansAvailable.length / Math.max(vansAvailable.length + vansGrounded.length, 1)) * 100);

  const highVolumeRoutes = todayRoutes.filter((route) => route.packages_planned >= HIGH_VOLUME_PACKAGES);
  const rescueOpen = db.rescues.filter((row) => row.service_date === TODAY && row.status !== "completed");
  const behindRoutes = todayRoutes.filter((route) => {
    if (route.status === "rescue") return true;
    if (!route.driver_id) return true;
    const remaining = route.stops_planned - route.stops_completed;
    return remaining >= 70 && route.status !== "completed";
  });
  const weatherRiskPct = clampPct(100 - weatherScore(weatherToday));
  const rescueRisk = clampPct(
    behindRoutes.length * 12 + rescueOpen.length * 14 + highVolumeRoutes.filter((route) => route.status !== "completed").length * 4 + weatherRiskPct * 0.25,
  );
  const rescueRiskLabel = rescueRisk >= 55 ? "High" : rescueRisk >= 30 ? "Elevated" : "Moderate";

  const weatherIndex = weatherScore(weatherToday);
  const launchReadinessScore = clampPct(
    0.3 * staffingReadinessPct + 0.3 * fleetReadinessPct + 0.25 * routeCoveragePct + 0.15 * weatherIndex,
  );
  const gate = launchGateFor(launchReadinessScore);

  const prior = priorSnapshot(db);
  const kpis: Kpi[] = [
    kpiFrom("Staffing Readiness", staffingReadinessPct, prior?.staffing_readiness_pct, "Checked-in DAs vs today's routes"),
    kpiFrom("Fleet Readiness", fleetReadinessPct, prior?.fleet_readiness_pct, "Available vans vs grounded"),
    kpiFrom("Route Coverage", routeCoveragePct, prior?.route_coverage_pct, "Assigned vs planned routes"),
    kpiFrom("Launch Readiness Score", launchReadinessScore, prior?.launch_readiness_score, gateLabel(gate), "up"),
  ];

  const recommendations = buildRecommendations({
    db,
    todayRoutes,
    unassignedRoutes,
    ptoIds,
    callOutIds,
    noShows,
    staffingDelta,
    vansGrounded,
    vansAvailable: vansAvailable.length,
    failedInspections,
    weatherToday,
    rescueOpen,
    highVolumeRoutes,
    behindRoutes,
  });

  const commandBoard = buildCommandBoard(db, todayRoutes, assignments, todayAttendance, todayEvents);

  const heatWarnings = weatherToday.filter((row) => row.alert_type === "heat");
  const stormWarnings = weatherToday.filter((row) => row.alert_type === "storm");
  const highRiskConditions = weatherToday.filter((row) => row.high_risk || row.severity === "critical");

  return {
    kpis,
    gate,
    launchReadinessScore,
    staffing: {
      driversScheduled,
      driversCheckedIn,
      ptoToday: ptoIds.length,
      callOuts: callOutIds.length,
      noShows,
      openRoutes,
      staffingDelta,
      readinessPct: staffingReadinessPct,
      ptoNames: ptoIds.map((id) => db.drivers.find((driver) => driver.id === id)?.full_name ?? id),
      callOutNames: callOutIds.map((id) => db.drivers.find((driver) => driver.id === id)?.full_name ?? id),
    },
    fleet: {
      vansAvailable: vansAvailable.length,
      vansGrounded: vansGrounded.length,
      vansInService: vansInService.length,
      newDvicDefects,
      newDamageAlerts,
      readinessPct: fleetReadinessPct,
      grounded: vansGrounded.map((van) => ({
        id: van.id,
        van_id: van.van_id,
        status: van.status,
        stationCode: db.stations.find((station) => station.id === van.station_id)?.code ?? "",
        reason: openDowntime.find((row) => row.vehicle_id === van.id)?.notes ?? van.status,
      })),
      defects: failedInspections.map((row) => ({
        ...row,
        vanId: db.vehicles.find((van) => van.id === row.vehicle_id)?.van_id ?? row.vehicle_id,
      })),
    },
    routes: {
      assigned: routesAssigned,
      unassigned: openRoutes,
      coveragePct: routeCoveragePct,
      rescueRisk,
      rescueRiskLabel,
      highVolume: highVolumeRoutes.length,
      unassignedRows: unassignedRoutes.map((route) => ({
        ...route,
        stationCode: db.stations.find((station) => station.id === route.station_id)?.code ?? "",
      })),
      highVolumeRows: highVolumeRoutes.map((route) => ({
        ...route,
        stationCode: db.stations.find((station) => station.id === route.station_id)?.code ?? "",
        driverName: db.drivers.find((driver) => driver.id === route.driver_id)?.full_name ?? "Unassigned",
      })),
    },
    weather: {
      alerts: weatherToday.map((alert) => ({
        ...alert,
        stationCode: db.stations.find((station) => station.id === alert.station_id)?.code ?? "",
        stationName: db.stations.find((station) => station.id === alert.station_id)?.name ?? "",
      })),
      heatWarnings: heatWarnings.length,
      stormWarnings: stormWarnings.length,
      highRisk: highRiskConditions.length,
      score: weatherIndex,
    },
    summary: {
      staffingShortages: summarizeStaffing(openRoutes, ptoIds, callOutIds, noShows, db),
      fleetShortages: summarizeFleet(vansGrounded, vansAvailable.length, todayRoutes.length, db),
      coverageIssues: summarizeCoverage(unassignedRoutes, routeCoveragePct, db),
      maintenanceConcerns: summarizeMaintenance(db, failedInspections),
    },
    recommendations,
    commandBoard,
    prior,
    capturedAt: `${TODAY}T07:20:00Z`,
  };
}

function kpiFrom(label: string, value: number, previous: number | undefined, hint: string, favorable: "up" | "down" = "up"): Kpi {
  const delta = previous == null ? "vs. yesterday" : `${value - previous >= 0 ? "+" : ""}${(value - previous).toFixed(1)}pp`;
  const trend = previous == null ? "flat" : value > previous + 0.15 ? "up" : value < previous - 0.15 ? "down" : "flat";
  return { label, value: formatPct(value), delta, trend, hint, favorable };
}

function gateLabel(gate: LaunchGate): string {
  if (gate === "go") return "Clear to launch";
  if (gate === "conditional") return "Launch with conditions";
  return "Hold launch";
}

function priorSnapshot(db: SeedDatabase): DailyReadinessSnapshot | undefined {
  const stationIds = new Set(db.stations.map((station) => station.id));
  const scoped = db.dailyReadinessSnapshots.filter((row) => {
    if (row.service_date >= TODAY) return false;
    if (row.station_id == null) return db.stations.length > 1 || stationIds.size === db.stations.length;
    return stationIds.has(row.station_id);
  });
  const network = scoped.filter((row) => row.station_id == null);
  const pool = db.stations.length > 1 ? network : scoped.filter((row) => row.station_id != null);
  return [...(pool.length ? pool : scoped)].sort((a, b) => b.service_date.localeCompare(a.service_date))[0];
}

function buildCommandBoard(
  db: SeedDatabase,
  todayRoutes: Route[],
  assignments: SeedDatabase["routeAssignments"],
  todayAttendance: SeedDatabase["attendance"],
  todayEvents: SeedDatabase["dispatchEvents"],
) {
  const assignmentByRoute = new Map(assignments.map((row) => [row.route_id, row]));
  const lateIds = new Set(todayAttendance.filter((row) => row.status === "late").map((row) => row.driver_id));

  return todayRoutes
    .map((route) => {
      const assignment = assignmentByRoute.get(route.id);
      const driverId = assignment?.driver_id ?? route.driver_id;
      const vehicleId = assignment?.vehicle_id ?? route.vehicle_id;
      const driver = db.drivers.find((row) => row.id === driverId);
      const vehicle = db.vehicles.find((row) => row.id === vehicleId);
      const station = db.stations.find((row) => row.id === route.station_id);
      const attendance = todayAttendance.find((row) => row.driver_id === driverId);
      const checkInEvent = todayEvents.find((row) => row.event_type === "check_in" && row.driver_id === driverId);
      const dispatchStatus = assignment?.assignment_status ?? dispatchStatusFromRoute(route, Boolean(driverId && lateIds.has(driverId)));
      return {
        id: route.id,
        driverName: driver?.full_name ?? "Unassigned",
        driverStatus: (driver?.status ?? "off_duty") as DriverStatus,
        routeCode: route.route_code,
        vanId: vehicle?.van_id ?? "—",
        stationCode: station?.code ?? "",
        status: route.status,
        checkInTime: assignment?.check_in_at ?? checkInEvent?.occurred_at ?? (attendance?.actual_start ? `${TODAY}T${attendance.actual_start}:00Z` : null),
        dispatchStatus,
        packagesPlanned: route.packages_planned,
        notes: assignment?.notes ?? "",
      };
    })
    .sort((a, b) => {
      const rank: Record<DispatchStatus, number> = {
        unassigned: 0,
        delayed: 1,
        planned: 2,
        assigned: 3,
        checked_in: 4,
        staged: 5,
        dispatched: 6,
        cancelled: 7,
      };
      return rank[a.dispatchStatus] - rank[b.dispatchStatus] || a.routeCode.localeCompare(b.routeCode);
    });
}

function summarizeStaffing(
  openRoutes: number,
  ptoIds: string[],
  callOutIds: string[],
  noShows: number,
  db: SeedDatabase,
): string {
  if (!openRoutes && !callOutIds.length && !noShows) {
    return "Staffing is covering the published wave.";
  }
  const pto = ptoIds.map((id) => db.drivers.find((driver) => driver.id === id)?.full_name).filter(Boolean);
  const callOuts = callOutIds.map((id) => db.drivers.find((driver) => driver.id === id)?.full_name).filter(Boolean);
  const parts = [
    openRoutes ? `${openRoutes} open route${openRoutes === 1 ? "" : "s"}` : null,
    pto.length ? `PTO: ${pto.join(", ")}` : null,
    callOuts.length ? `Call-out: ${callOuts.join(", ")}` : null,
    noShows ? `${noShows} no-show${noShows === 1 ? "" : "s"}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

function summarizeFleet(
  grounded: SeedDatabase["vehicles"],
  available: number,
  routesNeeded: number,
  db: SeedDatabase,
): string {
  if (!grounded.length && available >= routesNeeded) {
    return "Fleet covers every published route with spare capacity.";
  }
  const labels = grounded.map((van) => {
    const station = db.stations.find((row) => row.id === van.station_id)?.code;
    return `${van.van_id}${station ? ` (${station})` : ""}`;
  });
  const spare = available - routesNeeded;
  return `${grounded.length} van${grounded.length === 1 ? "" : "s"} grounded (${labels.join(", ")}). Spare vs wave: ${spare >= 0 ? "+" : ""}${spare}.`;
}

function summarizeCoverage(unassigned: Route[], coveragePct: number, db: SeedDatabase): string {
  if (!unassigned.length) return `All ${formatPct(coveragePct)} of today's routes have a DA assigned.`;
  const codes = unassigned.map((route) => {
    const station = db.stations.find((row) => row.id === route.station_id)?.code ?? "";
    return `${route.route_code} ${station}`.trim();
  });
  return `${formatPct(coveragePct)} coverage. Unassigned: ${codes.join(", ")}.`;
}

function openRouteAction(route: Route): string {
  if (route.id === "rte-cx33") {
    return "Assign an extra DA or split CX-33 onto CX-03. Patel is on approved PTO and DAT6 cannot absorb 1,118 packages on one route.";
  }
  if (route.id === "rte-cx40") {
    return "Call a flex/agency DA or move 20–30 stops from neighboring DLA7 routes. Agency no-show left CX-40 dark.";
  }
  if (route.id === "rte-cx41") {
    return "Staff the DAX5 extra before heat wave lock. CX-41 is still unassigned and Phoenix is under an excessive heat warning.";
  }
  if (route.id === "rte-cx42") {
    return "Romero no-showed and EV-223 failed DVIC. Cover CX-42 with a DCH1 extra or cancel with Amazon RTS. Do not put EV-223 back on the board.";
  }
  return `Assign a DA to ${route.route_code} before launch or split stops onto neighboring routes.`;
}

function summarizeMaintenance(db: SeedDatabase, failedInspections: SeedDatabase["inspections"]): string {
  const overdue = db.maintenance.filter((row) => row.status === "overdue" || (row.status === "in_progress" && row.scheduled_date <= TODAY));
  if (!failedInspections.length && !overdue.length) return "No critical DVIC or shop holds blocking launch.";
  const vans = failedInspections.map((row) => db.vehicles.find((van) => van.id === row.vehicle_id)?.van_id ?? row.vehicle_id);
  const work = overdue.map((row) => row.work_order);
  return [vans.length ? `DVIC fail: ${unique(vans).join(", ")}` : null, work.length ? `Shop: ${work.join(", ")}` : null]
    .filter(Boolean)
    .join(" · ");
}

function buildRecommendations(input: {
  db: SeedDatabase;
  todayRoutes: Route[];
  unassignedRoutes: Route[];
  ptoIds: string[];
  callOutIds: string[];
  noShows: number;
  staffingDelta: number;
  vansGrounded: SeedDatabase["vehicles"];
  vansAvailable: number;
  failedInspections: SeedDatabase["inspections"];
  weatherToday: WeatherAlert[];
  rescueOpen: SeedDatabase["rescues"];
  highVolumeRoutes: Route[];
  behindRoutes: Route[];
}): ReadinessRecommendation[] {
  const recs: ReadinessRecommendation[] = [];
  const { db } = input;

  input.unassignedRoutes.forEach((route) => {
    const station = db.stations.find((row) => row.id === route.station_id);
    recs.push({
      id: `rec-open-${route.id}`,
      category: "staffing",
      severity: "critical",
      title: `Cover ${route.route_code} before launch`,
      action: openRouteAction(route),
      metric: `${route.packages_planned} pkgs · ${route.stops_planned} stops`,
      stationCode: station?.code,
    });
  });

  if (input.callOutIds.length) {
    const names = input.callOutIds.map((id) => db.drivers.find((driver) => driver.id === id)?.full_name ?? id);
    recs.push({
      id: "rec-callouts",
      category: "staffing",
      severity: input.staffingDelta < 0 ? "warning" : "watch",
      title: `${names.join(", ")} called out`,
      action: "Cover the call-out with a flex DA. Do not put a grounded van back on the board if the DA's assigned vehicle failed DVIC.",
      metric: `${input.callOutIds.length} call-out`,
    });
  }

  if (input.noShows) {
    recs.push({
      id: "rec-noshow",
      category: "staffing",
      severity: "critical",
      title: input.noShows === 1 ? "No-show before launch" : `${input.noShows} no-shows before launch`,
      action: "Cover CX-40 (DLA7 agency) and CX-42 (Romero / DCH1) with on-call DAs by 07:30 or cancel with Amazon RTS before wave lock. Keep Romero's EV-223 in the shop.",
      metric: `${input.noShows} no-show${input.noShows === 1 ? "" : "s"}`,
    });
  }

  if (input.vansGrounded.length) {
    recs.push({
      id: "rec-fleet-grounded",
      category: "fleet",
      severity: input.vansGrounded.length >= 2 ? "warning" : "watch",
      title: `${input.vansGrounded.length} van${input.vansGrounded.length === 1 ? "" : "s"} grounded`,
      action: `${input.vansGrounded.map((van) => van.van_id).join(", ")} ${input.vansGrounded.length === 1 ? "is" : "are"} OOS or in shop. Confirm ${input.vansAvailable} active E-Transit${input.vansAvailable === 1 ? "" : "s"} before assigning any leftover route.`,
      metric: `${input.vansGrounded.length} grounded`,
    });
  }

  const rolledFailed = input.failedInspections.filter((row) =>
    input.todayRoutes.some((route) => route.vehicle_id === row.vehicle_id && route.status !== "planned"),
  );
  rolledFailed.forEach((row) => {
    const van = db.vehicles.find((item) => item.id === row.vehicle_id);
    const route = input.todayRoutes.find((item) => item.vehicle_id === row.vehicle_id);
    recs.push({
      id: `rec-dvic-${row.id}`,
      category: "maintenance",
      severity: "critical",
      title: `${van?.van_id ?? "Van"} rolled with a DVIC fail`,
      action: `Swap ${van?.van_id ?? "the van"} off ${route?.route_code ?? "the route"} before it leaves the yard. Defects: ${row.defects.join(", ") || row.notes}.`,
      metric: row.defects.join(", ") || "DVIC fail",
      stationCode: db.stations.find((station) => station.id === van?.station_id)?.code,
    });
  });

  const overdue = db.maintenance.filter((row) => row.status === "overdue");
  overdue.forEach((order) => {
    const van = db.vehicles.find((item) => item.id === order.vehicle_id);
    recs.push({
      id: `rec-wo-${order.id}`,
      category: "maintenance",
      severity: "warning",
      title: `${order.work_order} is overdue`,
      action: `${van?.van_id ?? "Van"} still has an overdue ${order.type} job: ${order.description}. Do not assign as a spare today.`,
      metric: order.work_order,
    });
  });

  input.weatherToday
    .filter((alert) => alert.high_risk || alert.severity !== "watch")
    .forEach((alert) => {
      recs.push({
        id: `rec-wx-${alert.id}`,
        category: "weather",
        severity: alert.severity === "critical" ? "critical" : "warning",
        title: alert.title,
        action:
          alert.alert_type === "heat"
            ? "Stage extra water, cap new OT, and pull 15–20 stops off the slowest heat-corridor route if a DA is available."
            : alert.alert_type === "storm"
              ? "Pre-assign a helper for CX-27 and hold apartment overflow if flooding starts. Brief DAs on hydroplaning and tote covers."
              : alert.summary,
        metric: `${alert.alert_type} · ${alert.severity}`,
        stationCode: db.stations.find((station) => station.id === alert.station_id)?.code,
      });
    });

  if (input.rescueOpen.length) {
    const distressed = input.rescueOpen
      .map((row) => input.todayRoutes.find((route) => route.id === row.distressed_route_id)?.route_code)
      .filter(Boolean)
      .join(" / ");
    recs.push({
      id: "rec-rescue",
      category: "routes",
      severity: "warning",
      title: `${input.rescueOpen.length} rescue${input.rescueOpen.length === 1 ? "" : "s"} already open`,
      action: `Lock helper assignments${distressed ? ` on ${distressed}` : ""} before 08:00. Do not launch additional high-volume routes without a named rescue DA.`,
      metric: `${input.behindRoutes.length} routes at risk`,
    });
  }

  const liveHighVolume = input.highVolumeRoutes.filter((route) => route.status !== "completed");
  if (liveHighVolume.length >= 3) {
    recs.push({
      id: "rec-high-volume",
      category: "routes",
      severity: "watch",
      title: `${liveHighVolume.length} high-volume routes still live`,
      action: `Keep a dedicated rescue DA for ${liveHighVolume.map((route) => route.route_code).join(", ")}. Each is above 1,200 packages.`,
      metric: liveHighVolume.map((route) => route.route_code).join(", "),
    });
  }

  const rank: Record<InsightSeverity, number> = { critical: 0, warning: 1, watch: 2 };
  recs.sort((a, b) => rank[a.severity] - rank[b.severity] || a.category.localeCompare(b.category));
  return recs;
}
