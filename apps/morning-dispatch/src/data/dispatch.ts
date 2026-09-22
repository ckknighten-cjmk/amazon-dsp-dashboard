import { addDays } from "../lib/format";
import type {
  DailyReadinessSnapshot,
  DispatchEvent,
  RouteAssignment,
  WeatherAlert,
} from "../types/database";
import { TODAY, attendance, drivers, routes, stations } from "./seedCore";

const todayAttendance = attendance.filter((row) => row.service_date === TODAY);

function stationCode(stationId: string): string {
  return stations.find((station) => station.id === stationId)?.code ?? stationId;
}

function checkInIso(actualStart: string | null, fallback = "06:52"): string {
  const time = actualStart ?? fallback;
  return `${TODAY}T${time}:00Z`;
}

export const dispatchEvents: DispatchEvent[] = [
  ...todayAttendance
    .filter((row) => row.status === "present" || row.status === "late")
    .map((row) => {
      const driver = drivers.find((item) => item.id === row.driver_id);
      const route = routes.find((item) => item.driver_id === row.driver_id);
      return {
        id: `de-checkin-${row.driver_id}`,
        station_id: driver?.station_id ?? "stn-dla7",
        driver_id: row.driver_id,
        vehicle_id: route?.vehicle_id ?? null,
        route_id: route?.id ?? null,
        service_date: TODAY,
        event_type: "check_in" as const,
        occurred_at: checkInIso(row.actual_start, row.status === "late" ? "07:18" : "06:52"),
        notes: row.status === "late" ? "Late to stand-up — still cleared for launch" : "Yard check-in complete",
        created_by: "Sam Okonkwo",
      };
    }),
  {
    id: "de-noshow-1308",
    station_id: "stn-dch1",
    driver_id: "drv-1308",
    vehicle_id: "van-14",
    route_id: "rte-cx42",
    service_date: TODAY,
    event_type: "no_show",
    occurred_at: `${TODAY}T05:41:00Z`,
    notes: "Pablo Romero no-showed. EV-223 remains in shop from DVIC fail. CX-42 at DCH1 is still open.",
    created_by: "Sam Okonkwo",
  },
  {
    id: "de-pto-1266",
    station_id: "stn-dat6",
    driver_id: "drv-1266",
    vehicle_id: null,
    route_id: "rte-cx33",
    service_date: TODAY,
    event_type: "pto",
    occurred_at: `${addDays(TODAY, -3)}T16:00:00Z`,
    notes: "Harsh Patel personal day — CX-33 still open at DAT6.",
    created_by: "Jordan Hale",
  },
  {
    id: "de-noshow-flex",
    station_id: "stn-dla7",
    driver_id: null,
    vehicle_id: null,
    route_id: "rte-cx40",
    service_date: TODAY,
    event_type: "no_show",
    occurred_at: `${TODAY}T07:10:00Z`,
    notes: "Agency flex DA did not report for CX-40 extra Sunday volume at DLA7.",
    created_by: "Sam Okonkwo",
  },
  {
    id: "de-delay-1156",
    station_id: "stn-dax5",
    driver_id: "drv-1156",
    vehicle_id: "van-04",
    route_id: "rte-cx31",
    service_date: TODAY,
    event_type: "delay",
    occurred_at: `${TODAY}T07:18:00Z`,
    notes: "Sofia Petrova late to wave. CX-31 departed 18 minutes after staged time.",
    created_by: "Sam Okonkwo",
  },
  {
    id: "de-damage-224",
    station_id: "stn-dla7",
    driver_id: null,
    vehicle_id: "van-15",
    route_id: null,
    service_date: TODAY,
    event_type: "damage_alert",
    occurred_at: `${TODAY}T06:05:00Z`,
    notes: "EV-224 still OOS — rear quarter panel and sensor cluster from cul-de-sac contact.",
    created_by: "Riley Cho",
  },
  {
    id: "de-damage-213",
    station_id: "stn-dse2",
    driver_id: "drv-1238",
    vehicle_id: "van-09",
    route_id: "rte-cx27",
    service_date: TODAY,
    event_type: "damage_alert",
    occurred_at: `${TODAY}T06:22:00Z`,
    notes: "New DVIC: headlamp out plus bumper scuff on EV-218. Still rolled on CX-27.",
    created_by: "Riley Cho",
  },
  {
    id: "de-weather-dax5",
    station_id: "stn-dax5",
    driver_id: null,
    vehicle_id: null,
    route_id: null,
    service_date: TODAY,
    event_type: "weather_hold",
    occurred_at: `${TODAY}T05:15:00Z`,
    notes: "Phoenix heat warning — extra water, earlier breaks, no new OT without ops approval.",
    created_by: "Jordan Hale",
  },
];

function assignmentStatus(route: (typeof routes)[number], checkInAt: string | null): RouteAssignment["assignment_status"] {
  if (!route.driver_id) return "unassigned";
  if (route.status === "cancelled") return "cancelled";
  if (route.status === "rescue") return "delayed";
  if (route.status === "planned") return checkInAt ? "checked_in" : "assigned";
  if (route.status === "loading") return "staged";
  if (route.driver_id === "drv-1156") return "delayed";
  return "dispatched";
}

export const routeAssignments: RouteAssignment[] = routes
  .filter((route) => route.service_date === TODAY)
  .map((route) => {
    const att = todayAttendance.find((row) => row.driver_id === route.driver_id);
    const checkInAt =
      att && (att.status === "present" || att.status === "late") ? checkInIso(att.actual_start) : null;
    const dispatchedAt = route.started_at;
    return {
      id: `asg-${route.id}`,
      route_id: route.id,
      station_id: route.station_id,
      service_date: TODAY,
      driver_id: route.driver_id,
      vehicle_id: route.vehicle_id,
      assignment_status: assignmentStatus(route, checkInAt),
      check_in_at: checkInAt,
      dispatched_at: dispatchedAt,
      notes: !route.driver_id
        ? route.id === "rte-cx33"
          ? "Open after Patel PTO — needs extra DA or split onto CX-03."
          : route.id === "rte-cx40"
            ? "Open after agency no-show — DLA7 Sunday overflow."
            : route.id === "rte-cx41"
              ? "Open extra at DAX5 — staff before heat wave lock."
              : "Open after Romero no-show — DCH1 Sunday coverage."
        : route.status === "rescue"
          ? "Rescue in progress — monitor remaining stops."
          : att?.status === "late"
            ? "Late check-in — staged after wave start."
            : "Assigned and on the board.",
    };
  });

export const weatherAlerts: WeatherAlert[] = [
  {
    id: "wx-dax5-heat",
    station_id: "stn-dax5",
    service_date: TODAY,
    alert_type: "heat",
    severity: "critical",
    title: "Excessive Heat Warning — Phoenix",
    summary: "DAX5 heat index 108–112°F through 19:00. High-risk operating conditions for CX-31 / CX-05 / CX-18. CX-41 is still unassigned. Mandatory extra water, 50-min cooling breaks, and no new OT without ops approval.",
    starts_at: `${TODAY}T15:00:00Z`,
    ends_at: `${addDays(TODAY, 1)}T02:00:00Z`,
    high_risk: true,
  },
  {
    id: "wx-dse2-storm",
    station_id: "stn-dse2",
    service_date: TODAY,
    alert_type: "storm",
    severity: "warning",
    title: "Storm Warning — Puget Sound",
    summary: "Atmospheric river over DSE2 with 0.6–1.1\" rain and gusts 35–45 mph. Elevated rescue risk on CX-27. Stage a helper DA and hold apartment overflow if flooding starts.",
    starts_at: `${TODAY}T13:00:00Z`,
    ends_at: `${TODAY}T23:00:00Z`,
    high_risk: true,
  },
  {
    id: "wx-dch1-wind",
    station_id: "stn-dch1",
    service_date: TODAY,
    alert_type: "wind",
    severity: "watch",
    title: "Wind Advisory — Chicago",
    summary: "Sustained 20–25 mph with gusts to 40 mph at DCH1. Secure totes on EV-221 / EV-222 and watch for door-prop incidents on high-rise stops. CX-42 is still open after Romero no-show.",
    starts_at: `${TODAY}T12:00:00Z`,
    ends_at: `${TODAY}T22:00:00Z`,
    high_risk: false,
  },
  {
    id: "wx-dla7-aqi",
    station_id: "stn-dla7",
    service_date: TODAY,
    alert_type: "air_quality",
    severity: "watch",
    title: "Air Quality Advisory — Los Angeles",
    summary: "Smoke-influenced AQI 118 (Unhealthy for sensitive groups) at DLA7. Issue N95s at stand-up and keep CX-40 unassigned until staffing recovers.",
    starts_at: `${TODAY}T06:00:00Z`,
    ends_at: `${TODAY}T20:00:00Z`,
    high_risk: false,
  },
  {
    id: "wx-dat6-heat",
    station_id: "stn-dat6",
    service_date: TODAY,
    alert_type: "heat",
    severity: "warning",
    title: "Heat Advisory — Atlanta",
    summary: "DAT6 afternoon heat index 98°F. CX-03 is staffed; CX-33 is still open after Patel PTO. Do not split a 1,100-stop day onto one DA without a rescue plan.",
    starts_at: `${TODAY}T16:00:00Z`,
    ends_at: `${addDays(TODAY, 1)}T00:00:00Z`,
    high_risk: true,
  },
];

function snapshotBase(
  id: string,
  stationId: string | null,
  serviceDate: string,
  capturedAt: string,
  values: Omit<DailyReadinessSnapshot, "id" | "station_id" | "service_date" | "captured_at">,
): DailyReadinessSnapshot {
  return { id, station_id: stationId, service_date: serviceDate, captured_at: capturedAt, ...values };
}

export const dailyReadinessSnapshots: DailyReadinessSnapshot[] = [
  snapshotBase("snap-net-yday", null, addDays(TODAY, -1), `${addDays(TODAY, -1)}T05:30:00Z`, {
    drivers_scheduled: 14,
    drivers_checked_in: 13,
    pto_count: 0,
    call_outs: 1,
    no_shows: 0,
    open_routes: 0,
    staffing_delta: 1,
    vans_available: 14,
    vans_grounded: 1,
    vans_in_service: 13,
    new_dvic_defects: 1,
    new_damage_alerts: 1,
    fleet_readiness_pct: 93.3,
    routes_assigned: 13,
    routes_unassigned: 0,
    route_coverage_pct: 100,
    rescue_risk: 18,
    high_volume_routes: 4,
    staffing_readiness_pct: 92.9,
    launch_readiness_score: 91.4,
    weather_risk: 12,
    notes: "Saturday peak cleared with one call-out covered by a flex DA.",
  }),
  snapshotBase("snap-net-today", null, TODAY, `${TODAY}T05:30:00Z`, {
    drivers_scheduled: 14,
    drivers_checked_in: 8,
    pto_count: 1,
    call_outs: 0,
    no_shows: 2,
    open_routes: 4,
    staffing_delta: -2,
    vans_available: 13,
    vans_grounded: 2,
    vans_in_service: 0,
    new_dvic_defects: 3,
    new_damage_alerts: 2,
    fleet_readiness_pct: 86.7,
    routes_assigned: 12,
    routes_unassigned: 4,
    route_coverage_pct: 75,
    rescue_risk: 42,
    high_volume_routes: 5,
    staffing_readiness_pct: 85.7,
    launch_readiness_score: 78.2,
    weather_risk: 40,
    notes: "Pre-wave snapshot: four open routes, Romero no-show, Phoenix heat, Seattle storm.",
  }),
  ...stations.map((station, index) =>
    snapshotBase(`snap-${station.code.toLowerCase()}-today`, station.id, TODAY, `${TODAY}T05:32:00Z`, {
      drivers_scheduled: station.id === "stn-dla7" ? 4 : station.id === "stn-dax5" ? 3 : 3,
      drivers_checked_in: station.id === "stn-dla7" ? 3 : station.id === "stn-dch1" ? 2 : station.id === "stn-dat6" ? 1 : 3,
      pto_count: station.id === "stn-dat6" ? 1 : 0,
      call_outs: 0,
      no_shows: station.id === "stn-dla7" || station.id === "stn-dch1" ? 1 : 0,
      open_routes: station.id === "stn-dse2" ? 0 : 1,
      staffing_delta: station.id === "stn-dse2" ? 0 : -1,
      vans_available: station.id === "stn-dla7" ? 3 : station.id === "stn-dch1" ? 2 : 3,
      vans_grounded: station.id === "stn-dla7" || station.id === "stn-dch1" ? 1 : 0,
      vans_in_service: 0,
      new_dvic_defects: station.id === "stn-dla7" ? 1 : station.id === "stn-dse2" || station.id === "stn-dch1" ? 1 : 0,
      new_damage_alerts: station.id === "stn-dla7" || station.id === "stn-dse2" ? 1 : 0,
      fleet_readiness_pct: station.id === "stn-dla7" ? 75 : station.id === "stn-dch1" ? 66.7 : 100,
      routes_assigned: station.id === "stn-dla7" ? 3 : station.id === "stn-dat6" ? 1 : station.id === "stn-dch1" ? 2 : 3,
      routes_unassigned: station.id === "stn-dse2" ? 0 : 1,
      route_coverage_pct: station.id === "stn-dla7" ? 75 : station.id === "stn-dat6" ? 50 : station.id === "stn-dch1" ? 67 : station.id === "stn-dax5" ? 75 : 100,
      rescue_risk: station.id === "stn-dse2" ? 62 : station.id === "stn-dax5" ? 55 : 20 + index,
      high_volume_routes: station.id === "stn-dla7" ? 2 : 1,
      staffing_readiness_pct: station.id === "stn-dla7" ? 75 : station.id === "stn-dat6" ? 50 : 100,
      launch_readiness_score: station.id === "stn-dat6" ? 64 : station.id === "stn-dax5" ? 71 : station.id === "stn-dse2" ? 74 : 82,
      weather_risk: station.id === "stn-dax5" ? 80 : station.id === "stn-dse2" ? 55 : station.id === "stn-dat6" ? 40 : 15,
      notes: `${stationCode(station.id)} 05:30 yard report.`,
    }),
  ),
];
