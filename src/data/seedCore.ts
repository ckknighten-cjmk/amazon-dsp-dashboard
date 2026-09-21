import {
  addDays,
  dateRange,
  dayOfWeek,
  hashString,
  mulberry32,
  round2,
} from "../lib/format";
import type {
  Attendance,
  AttendanceStatus,
  CoachingRecommendation,
  DemoUser,
  Driver,
  FailedDelivery,
  FinancialDaily,
  Forecast,
  HourlyProgress,
  Incident,
  Rescue,
  Route,
  SafetyEvent,
  ScoreStanding,
  Scorecard,
  Station,
  Vehicle,
  VehicleInspection,
} from "../types/database";

export const TODAY = "2026-09-20";
export const WEEK_START = "2026-09-14";
export const MONTH_START = "2026-09-01";

export const stations: Station[] = [
  { id: "stn-dla7", code: "DLA7", name: "Los Angeles", city: "Los Angeles", region: "US-West" },
  { id: "stn-dax5", code: "DAX5", name: "Phoenix", city: "Phoenix", region: "US-West" },
  { id: "stn-dse2", code: "DSE2", name: "Seattle", city: "Seattle", region: "US-West" },
  { id: "stn-dat6", code: "DAT6", name: "Atlanta", city: "Atlanta", region: "US-East" },
  { id: "stn-dch1", code: "DCH1", name: "Chicago", city: "Chicago", region: "US-Central" },
];

export const drivers: Driver[] = [
  { id: "drv-1042", employee_code: "DRV-1042", full_name: "Maya Alvarez", station_id: "stn-dla7", hire_date: "2023-03-12", status: "on_road", fico_score: 872, safety_score: 918, dcr: 99.4, attendance_pct: 99.1, on_time_pct: 98.4, dpmo: 210, seatbelt_pct: 99.8 },
  { id: "drv-1088", employee_code: "DRV-1088", full_name: "Kwame Osei", station_id: "stn-dla7", hire_date: "2022-11-04", status: "on_road", fico_score: 841, safety_score: 874, dcr: 98.9, attendance_pct: 97.4, on_time_pct: 96.1, dpmo: 480, seatbelt_pct: 98.6 },
  { id: "drv-1103", employee_code: "DRV-1103", full_name: "Jiro Nakamura", station_id: "stn-dla7", hire_date: "2021-06-18", status: "at_station", fico_score: 901, safety_score: 946, dcr: 99.7, attendance_pct: 99.6, on_time_pct: 99.2, dpmo: 90, seatbelt_pct: 100 },
  { id: "drv-1156", employee_code: "DRV-1156", full_name: "Sofia Petrova", station_id: "stn-dax5", hire_date: "2024-01-22", status: "delayed", fico_score: 764, safety_score: 742, dcr: 97.1, attendance_pct: 94.2, on_time_pct: 91.5, dpmo: 1120, seatbelt_pct: 96.4 },
  { id: "drv-1177", employee_code: "DRV-1177", full_name: "David Okafor", station_id: "stn-dax5", hire_date: "2023-08-09", status: "on_road", fico_score: 858, safety_score: 889, dcr: 99.1, attendance_pct: 98.3, on_time_pct: 97.7, dpmo: 260, seatbelt_pct: 99.2 },
  { id: "drv-1201", employee_code: "DRV-1201", full_name: "Lina Chen", station_id: "stn-dax5", hire_date: "2022-04-30", status: "break", fico_score: 812, safety_score: 831, dcr: 98.4, attendance_pct: 93.8, on_time_pct: 95.0, dpmo: 640, seatbelt_pct: 98.1 },
  { id: "drv-1210", employee_code: "DRV-1210", full_name: "Ravi Singh", station_id: "stn-dse2", hire_date: "2023-02-14", status: "on_road", fico_score: 866, safety_score: 902, dcr: 99.3, attendance_pct: 98.8, on_time_pct: 98.1, dpmo: 180, seatbelt_pct: 99.5 },
  { id: "drv-1224", employee_code: "DRV-1224", full_name: "Ama Mensah", station_id: "stn-dse2", hire_date: "2022-09-01", status: "on_road", fico_score: 848, safety_score: 861, dcr: 98.8, attendance_pct: 97.9, on_time_pct: 96.8, dpmo: 310, seatbelt_pct: 99.0 },
  { id: "drv-1238", employee_code: "DRV-1238", full_name: "Tyler Brooks", station_id: "stn-dse2", hire_date: "2024-05-06", status: "rescued", fico_score: 779, safety_score: 768, dcr: 97.6, attendance_pct: 95.1, on_time_pct: 92.4, dpmo: 870, seatbelt_pct: 97.2 },
  { id: "drv-1252", employee_code: "DRV-1252", full_name: "Nina Vargas", station_id: "stn-dat6", hire_date: "2023-07-19", status: "on_road", fico_score: 854, safety_score: 887, dcr: 99.0, attendance_pct: 98.0, on_time_pct: 97.2, dpmo: 240, seatbelt_pct: 99.3 },
  { id: "drv-1266", employee_code: "DRV-1266", full_name: "Harsh Patel", station_id: "stn-dat6", hire_date: "2021-12-02", status: "off_duty", fico_score: 890, safety_score: 921, dcr: 99.5, attendance_pct: 96.4, on_time_pct: 98.6, dpmo: 150, seatbelt_pct: 99.7 },
  { id: "drv-1280", employee_code: "DRV-1280", full_name: "Eva Kowalski", station_id: "stn-dch1", hire_date: "2022-02-28", status: "on_road", fico_score: 837, safety_score: 852, dcr: 98.7, attendance_pct: 97.1, on_time_pct: 96.4, dpmo: 390, seatbelt_pct: 98.8 },
  { id: "drv-1294", employee_code: "DRV-1294", full_name: "Chris Nguyen", station_id: "stn-dch1", hire_date: "2023-10-11", status: "on_road", fico_score: 861, safety_score: 894, dcr: 99.2, attendance_pct: 98.5, on_time_pct: 97.9, dpmo: 220, seatbelt_pct: 99.4 },
  { id: "drv-1308", employee_code: "DRV-1308", full_name: "Pablo Romero", station_id: "stn-dch1", hire_date: "2024-03-03", status: "off_duty", fico_score: 748, safety_score: 711, dcr: 96.8, attendance_pct: 91.6, on_time_pct: 90.8, dpmo: 1340, seatbelt_pct: 95.1 },
];

export const vehicles: Vehicle[] = [
  ...drivers.map((driver, index) => {
    const odometer = 14850 + index * 3720 + (index % 4) * 410;
    return {
      id: `van-${String(index + 1).padStart(2, "0")}`,
      van_id: `EV-${210 + index}`,
      vin: `1FTBW3U60PKA${String(10000 + index)}`,
      station_id: driver.station_id,
      year: index % 3 === 0 ? 2022 : 2023,
      make: "Ford",
      model: "E-Transit",
      status: (driver.id === "drv-1308" ? "maintenance" : "active") as Vehicle["status"],
      powertrain: "ev" as const,
      odometer_miles: odometer,
      last_service_date: addDays(TODAY, -(12 + index * 4)),
      next_service_miles: Math.ceil((odometer + 800) / 5000) * 5000,
      utilization_pct: driver.status === "off_duty" ? 18 : 74 + (index % 9),
      assigned_driver_id: driver.id === "drv-1308" ? null : driver.id,
    };
  }),
  {
    id: "van-15",
    van_id: "EV-224",
    vin: "1FTBW3U60PKA10015",
    station_id: "stn-dla7",
    year: 2023,
    make: "Ford",
    model: "E-Transit",
    status: "oos",
    powertrain: "ev",
    odometer_miles: 41220,
    last_service_date: addDays(TODAY, -2),
    next_service_miles: 45000,
    utilization_pct: 0,
    assigned_driver_id: null,
  },
];

const vehicleByDriver = Object.fromEntries(
  drivers.map((driver, index) => [driver.id, vehicles[index].id]),
);

export const routes: Route[] = [
  { id: "rte-cx14", route_code: "CX-14", station_id: "stn-dla7", driver_id: "drv-1042", vehicle_id: vehicleByDriver["drv-1042"], service_date: TODAY, status: "in_progress", stops_planned: 190, stops_completed: 168, packages_planned: 1260, packages_delivered: 1118, failed_count: 2, started_at: `${TODAY}T07:12:00Z`, completed_at: null, estimated_finish: `${TODAY}T18:40:00Z` },
  { id: "rte-cx22", route_code: "CX-22", station_id: "stn-dla7", driver_id: "drv-1088", vehicle_id: vehicleByDriver["drv-1088"], service_date: TODAY, status: "in_progress", stops_planned: 175, stops_completed: 152, packages_planned: 1140, packages_delivered: 988, failed_count: 3, started_at: `${TODAY}T07:18:00Z`, completed_at: null, estimated_finish: `${TODAY}T19:05:00Z` },
  { id: "rte-cx07", route_code: "CX-07", station_id: "stn-dla7", driver_id: "drv-1103", vehicle_id: vehicleByDriver["drv-1103"], service_date: TODAY, status: "completed", stops_planned: 200, stops_completed: 200, packages_planned: 1340, packages_delivered: 1331, failed_count: 1, started_at: `${TODAY}T06:58:00Z`, completed_at: `${TODAY}T16:42:00Z`, estimated_finish: `${TODAY}T17:10:00Z` },
  { id: "rte-cx31", route_code: "CX-31", station_id: "stn-dax5", driver_id: "drv-1156", vehicle_id: vehicleByDriver["drv-1156"], service_date: TODAY, status: "in_progress", stops_planned: 185, stops_completed: 120, packages_planned: 1210, packages_delivered: 764, failed_count: 6, started_at: `${TODAY}T07:41:00Z`, completed_at: null, estimated_finish: `${TODAY}T20:15:00Z` },
  { id: "rte-cx05", route_code: "CX-05", station_id: "stn-dax5", driver_id: "drv-1177", vehicle_id: vehicleByDriver["drv-1177"], service_date: TODAY, status: "in_progress", stops_planned: 168, stops_completed: 143, packages_planned: 1095, packages_delivered: 931, failed_count: 2, started_at: `${TODAY}T07:08:00Z`, completed_at: null, estimated_finish: `${TODAY}T18:20:00Z` },
  { id: "rte-cx18", route_code: "CX-18", station_id: "stn-dax5", driver_id: "drv-1201", vehicle_id: vehicleByDriver["drv-1201"], service_date: TODAY, status: "in_progress", stops_planned: 160, stops_completed: 90, packages_planned: 1020, packages_delivered: 574, failed_count: 1, started_at: `${TODAY}T07:22:00Z`, completed_at: null, estimated_finish: `${TODAY}T19:30:00Z` },
  { id: "rte-cx11", route_code: "CX-11", station_id: "stn-dse2", driver_id: "drv-1210", vehicle_id: vehicleByDriver["drv-1210"], service_date: TODAY, status: "in_progress", stops_planned: 178, stops_completed: 149, packages_planned: 1165, packages_delivered: 972, failed_count: 1, started_at: `${TODAY}T07:05:00Z`, completed_at: null, estimated_finish: `${TODAY}T18:10:00Z` },
  { id: "rte-cx09", route_code: "CX-09", station_id: "stn-dse2", driver_id: "drv-1224", vehicle_id: vehicleByDriver["drv-1224"], service_date: TODAY, status: "in_progress", stops_planned: 182, stops_completed: 133, packages_planned: 1190, packages_delivered: 861, failed_count: 0, started_at: `${TODAY}T07:11:00Z`, completed_at: null, estimated_finish: `${TODAY}T19:00:00Z` },
  { id: "rte-cx27", route_code: "CX-27", station_id: "stn-dse2", driver_id: "drv-1238", vehicle_id: vehicleByDriver["drv-1238"], service_date: TODAY, status: "rescue", stops_planned: 196, stops_completed: 104, packages_planned: 1288, packages_delivered: 671, failed_count: 4, started_at: `${TODAY}T07:33:00Z`, completed_at: null, estimated_finish: `${TODAY}T20:45:00Z` },
  { id: "rte-cx03", route_code: "CX-03", station_id: "stn-dat6", driver_id: "drv-1252", vehicle_id: vehicleByDriver["drv-1252"], service_date: TODAY, status: "in_progress", stops_planned: 170, stops_completed: 138, packages_planned: 1104, packages_delivered: 896, failed_count: 2, started_at: `${TODAY}T07:16:00Z`, completed_at: null, estimated_finish: `${TODAY}T18:35:00Z` },
  { id: "rte-cx16", route_code: "CX-16", station_id: "stn-dch1", driver_id: "drv-1280", vehicle_id: vehicleByDriver["drv-1280"], service_date: TODAY, status: "in_progress", stops_planned: 174, stops_completed: 141, packages_planned: 1135, packages_delivered: 918, failed_count: 3, started_at: `${TODAY}T07:09:00Z`, completed_at: null, estimated_finish: `${TODAY}T18:50:00Z` },
  { id: "rte-cx21", route_code: "CX-21", station_id: "stn-dch1", driver_id: "drv-1294", vehicle_id: vehicleByDriver["drv-1294"], service_date: TODAY, status: "in_progress", stops_planned: 188, stops_completed: 157, packages_planned: 1220, packages_delivered: 1014, failed_count: 1, started_at: `${TODAY}T07:04:00Z`, completed_at: null, estimated_finish: `${TODAY}T18:25:00Z` },
  { id: "rte-cx33", route_code: "CX-33", station_id: "stn-dat6", driver_id: null, vehicle_id: null, service_date: TODAY, status: "planned", stops_planned: 172, stops_completed: 0, packages_planned: 1118, packages_delivered: 0, failed_count: 0, started_at: null, completed_at: null, estimated_finish: `${TODAY}T19:10:00Z` },
  { id: "rte-cx42", route_code: "CX-42", station_id: "stn-dla7", driver_id: null, vehicle_id: null, service_date: TODAY, status: "planned", stops_planned: 164, stops_completed: 0, packages_planned: 1088, packages_delivered: 0, failed_count: 0, started_at: null, completed_at: null, estimated_finish: `${TODAY}T19:20:00Z` },
];

export const rescues: Rescue[] = [
  {
    id: "rsc-001",
    service_date: TODAY,
    distressed_route_id: "rte-cx27",
    rescue_route_id: "rte-cx09",
    stops_transferred: 28,
    status: "in_progress",
    reason: "Behind pace after delayed wave departure",
    requested_at: `${TODAY}T14:18:00Z`,
    completed_at: null,
  },
  {
    id: "rsc-002",
    service_date: TODAY,
    distressed_route_id: "rte-cx31",
    rescue_route_id: null,
    stops_transferred: 22,
    status: "requested",
    reason: "High remaining stops + access issues",
    requested_at: `${TODAY}T15:02:00Z`,
    completed_at: null,
  },
  {
    id: "rsc-003",
    service_date: TODAY,
    distressed_route_id: "rte-cx18",
    rescue_route_id: "rte-cx05",
    stops_transferred: 16,
    status: "completed",
    reason: "Meal break overrun, restored to plan",
    requested_at: `${TODAY}T12:40:00Z`,
    completed_at: `${TODAY}T13:55:00Z`,
  },
];

export const failedDeliveries: FailedDelivery[] = [
  { id: "fail-01", route_id: "rte-cx31", tracking_id: "TBA308441029847", stop_number: 64, reason: "Access problem", customer_notified: true, created_at: `${TODAY}T11:14:00Z` },
  { id: "fail-02", route_id: "rte-cx31", tracking_id: "TBA308441029901", stop_number: 88, reason: "Customer unavailable", customer_notified: true, created_at: `${TODAY}T13:22:00Z` },
  { id: "fail-03", route_id: "rte-cx31", tracking_id: "TBA308441030112", stop_number: 101, reason: "Business closed", customer_notified: false, created_at: `${TODAY}T14:05:00Z` },
  { id: "fail-04", route_id: "rte-cx27", tracking_id: "TBA308441031440", stop_number: 77, reason: "Unsafe location", customer_notified: true, created_at: `${TODAY}T12:48:00Z` },
  { id: "fail-05", route_id: "rte-cx27", tracking_id: "TBA308441031512", stop_number: 92, reason: "Incorrect address", customer_notified: false, created_at: `${TODAY}T13:36:00Z` },
  { id: "fail-06", route_id: "rte-cx22", tracking_id: "TBA308441032008", stop_number: 54, reason: "Customer unavailable", customer_notified: true, created_at: `${TODAY}T10:51:00Z` },
  { id: "fail-07", route_id: "rte-cx16", tracking_id: "TBA308441032774", stop_number: 119, reason: "Access problem", customer_notified: true, created_at: `${TODAY}T15:11:00Z` },
  { id: "fail-08", route_id: "rte-cx14", tracking_id: "TBA308441033091", stop_number: 142, reason: "Weather delay", customer_notified: false, created_at: `${TODAY}T15:44:00Z` },
  { id: "fail-09", route_id: "rte-cx07", tracking_id: "TBA308441028611", stop_number: 198, reason: "Business closed", customer_notified: true, created_at: `${TODAY}T16:12:00Z` },
  { id: "fail-10", route_id: "rte-cx03", tracking_id: "TBA308441034220", stop_number: 61, reason: "Customer unavailable", customer_notified: true, created_at: `${TODAY}T11:39:00Z` },
];

const attendanceCycle: AttendanceStatus[][] = [
  ["present", "present", "present", "present", "present", "present", "present"],
  ["present", "late", "present", "present", "present", "present", "present"],
  ["present", "present", "present", "present", "present", "present", "present"],
  ["late", "present", "present", "call_out", "present", "present", "late"],
  ["present", "present", "present", "present", "present", "present", "present"],
  ["present", "call_out", "present", "present", "late", "present", "present"],
  ["present", "present", "present", "present", "present", "present", "present"],
  ["present", "present", "present", "late", "present", "present", "present"],
  ["present", "late", "present", "present", "present", "present", "present"],
  ["present", "present", "present", "present", "present", "present", "present"],
  ["pto", "pto", "present", "present", "present", "present", "pto"],
  ["present", "present", "late", "present", "present", "present", "present"],
  ["present", "present", "present", "present", "present", "present", "present"],
  ["call_out", "present", "late", "present", "absent", "present", "call_out"],
];

const weekDates = dateRange(WEEK_START, TODAY);

export const attendance: Attendance[] = drivers.flatMap((driver, driverIndex) =>
  weekDates.map((date, dayIndex) => {
    const status = attendanceCycle[driverIndex][dayIndex];
    const scheduled = "07:00";
    const actual =
      status === "present" ? "06:52" :
      status === "late" ? "07:18" :
      null;
    return {
      id: `att-${driver.id}-${date}`,
      driver_id: driver.id,
      service_date: date,
      status,
      scheduled_start: scheduled,
      actual_start: actual,
    };
  }),
);

export const safetyEvents: SafetyEvent[] = [
  { id: "sev-01", driver_id: "drv-1156", vehicle_id: vehicleByDriver["drv-1156"], event_type: "speeding", severity: "high", speed_mph: 48, speed_limit_mph: 35, occurred_at: `${TODAY}T10:22:00Z`, notes: "Residential zone, 13 over" },
  { id: "sev-02", driver_id: "drv-1156", vehicle_id: vehicleByDriver["drv-1156"], event_type: "seatbelt", severity: "medium", speed_mph: null, speed_limit_mph: null, occurred_at: `${addDays(TODAY, -2)}T09:14:00Z`, notes: "Unbuckled for 46 seconds after stop" },
  { id: "sev-03", driver_id: "drv-1238", vehicle_id: vehicleByDriver["drv-1238"], event_type: "speeding", severity: "medium", speed_mph: 41, speed_limit_mph: 30, occurred_at: `${TODAY}T11:08:00Z`, notes: "School zone buffer" },
  { id: "sev-04", driver_id: "drv-1238", vehicle_id: vehicleByDriver["drv-1238"], event_type: "following_distance", severity: "medium", speed_mph: 32, speed_limit_mph: 35, occurred_at: `${addDays(TODAY, -1)}T15:41:00Z`, notes: "Mentor following-distance alert" },
  { id: "sev-05", driver_id: "drv-1308", vehicle_id: vehicleByDriver["drv-1308"], event_type: "distraction", severity: "high", speed_mph: null, speed_limit_mph: null, occurred_at: `${addDays(TODAY, -4)}T13:02:00Z`, notes: "Phone handling while moving" },
  { id: "sev-06", driver_id: "drv-1201", vehicle_id: vehicleByDriver["drv-1201"], event_type: "sign_signal", severity: "low", speed_mph: null, speed_limit_mph: null, occurred_at: `${addDays(TODAY, -3)}T16:27:00Z`, notes: "Rolling stop" },
  { id: "sev-07", driver_id: "drv-1088", vehicle_id: vehicleByDriver["drv-1088"], event_type: "harsh_braking", severity: "low", speed_mph: 28, speed_limit_mph: 25, occurred_at: `${TODAY}T08:47:00Z`, notes: "Pedestrian dart-out" },
  { id: "sev-08", driver_id: "drv-1280", vehicle_id: vehicleByDriver["drv-1280"], event_type: "speeding", severity: "low", speed_mph: 38, speed_limit_mph: 30, occurred_at: `${addDays(TODAY, -5)}T12:11:00Z`, notes: "8 over posted" },
  { id: "sev-09", driver_id: "drv-1308", vehicle_id: vehicleByDriver["drv-1308"], event_type: "seatbelt", severity: "high", speed_mph: null, speed_limit_mph: null, occurred_at: `${addDays(TODAY, -6)}T10:03:00Z`, notes: "Unbuckled while rolling" },
  { id: "sev-10", driver_id: "drv-1156", vehicle_id: vehicleByDriver["drv-1156"], event_type: "speeding", severity: "medium", speed_mph: 52, speed_limit_mph: 40, occurred_at: `${addDays(TODAY, -1)}T17:19:00Z`, notes: "Arterial overspeed" },
  { id: "sev-11", driver_id: "drv-1224", vehicle_id: vehicleByDriver["drv-1224"], event_type: "following_distance", severity: "low", speed_mph: 24, speed_limit_mph: 25, occurred_at: `${TODAY}T09:33:00Z`, notes: "Dense urban traffic" },
  { id: "sev-12", driver_id: "drv-1238", vehicle_id: vehicleByDriver["drv-1238"], event_type: "seatbelt", severity: "medium", speed_mph: null, speed_limit_mph: null, occurred_at: `${addDays(TODAY, -3)}T14:55:00Z`, notes: "Rebuckled after 22s" },
];

export const inspections: VehicleInspection[] = vehicles.map((vehicle, index) => {
  const driver = drivers.find((row) => row.id === vehicle.assigned_driver_id) ?? drivers[Math.min(index, drivers.length - 1)];
  const failed = vehicle.status === "maintenance" || vehicle.status === "oos" || driver.id === "drv-1238";
  return {
    id: `insp-${vehicle.id}`,
    vehicle_id: vehicle.id,
    driver_id: driver.id,
    inspected_at: `${TODAY}T06:${String(10 + (index % 50)).padStart(2, "0")}:00Z`,
    status: vehicle.status === "oos" ? "fail" : driver.id === "drv-1266" ? "pending" : failed ? "fail" : "pass",
    defects: failed
      ? vehicle.status === "maintenance" || vehicle.status === "oos"
        ? ["Brake warning light", "Tire wear inner rear"]
        : ["Headlamp out"]
      : [],
    notes: failed ? "Hold for maintenance before next wave" : "Pre-trip complete",
  };
});

export const incidents: Incident[] = [
  { id: "inc-01", driver_id: "drv-1156", vehicle_id: vehicleByDriver["drv-1156"], station_id: "stn-dax5", occurred_at: `${addDays(TODAY, -2)}T15:28:00Z`, severity: "medium", category: "property", description: "Mirror contact with HOA gate arm. No injury.", status: "investigating" },
  { id: "inc-02", driver_id: "drv-1308", vehicle_id: vehicleByDriver["drv-1308"], station_id: "stn-dch1", occurred_at: `${addDays(TODAY, -8)}T11:04:00Z`, severity: "high", category: "collision", description: "Low-speed rear-end in cul-de-sac. Van OOS pending body work.", status: "open" },
  { id: "inc-03", driver_id: "drv-1238", vehicle_id: vehicleByDriver["drv-1238"], station_id: "stn-dse2", occurred_at: `${addDays(TODAY, -12)}T09:40:00Z`, severity: "low", category: "cargo", description: "Package crush at overflow tote. Customer refunded.", status: "closed" },
  { id: "inc-04", driver_id: null, vehicle_id: null, station_id: "stn-dla7", occurred_at: `${addDays(TODAY, -5)}T06:22:00Z`, severity: "low", category: "station", description: "Near-miss between van and yard walkers during launch.", status: "closed" },
  { id: "inc-05", driver_id: "drv-1088", vehicle_id: vehicleByDriver["drv-1088"], station_id: "stn-dla7", occurred_at: `${addDays(TODAY, -18)}T16:11:00Z`, severity: "medium", category: "injury", description: "Ankle twist on wet walkway. First aid only.", status: "closed" },
];

export const coaching: CoachingRecommendation[] = [
  { id: "coach-01", driver_id: "drv-1156", category: "Safety", priority: "high", recommendation: "Complete speeding clinic and dual-ride with a safety mentor this week.", metric: "3 speeding events / 7d", created_at: `${addDays(TODAY, -1)}T08:00:00Z`, completed_at: null },
  { id: "coach-02", driver_id: "drv-1156", category: "Quality", priority: "high", recommendation: "Audit photo-on-delivery and contact compliance. Ride-along on CX-31 pacing.", metric: "DPMO 1,120", created_at: `${addDays(TODAY, -1)}T08:00:00Z`, completed_at: null },
  { id: "coach-03", driver_id: "drv-1238", category: "Pacing", priority: "high", recommendation: "Wave-time discipline and stop sequencing. Assign rescue playbook review.", metric: "On-time 92.4%", created_at: `${TODAY}T06:30:00Z`, completed_at: null },
  { id: "coach-04", driver_id: "drv-1308", category: "Attendance", priority: "high", recommendation: "Attendance counseling and reliability PIP checkpoint.", metric: "Attendance 91.6%", created_at: `${addDays(TODAY, -3)}T09:00:00Z`, completed_at: null },
  { id: "coach-05", driver_id: "drv-1201", category: "Reliability", priority: "medium", recommendation: "Call-out pattern review and shift-start checklist.", metric: "Attendance 93.8%", created_at: `${addDays(TODAY, -2)}T09:15:00Z`, completed_at: null },
  { id: "coach-06", driver_id: "drv-1088", category: "Quality", priority: "low", recommendation: "Refresh POD angle training after two blurry photos.", metric: "DPMO 480", created_at: `${addDays(TODAY, -4)}T10:00:00Z`, completed_at: `${addDays(TODAY, -1)}T16:00:00Z` },
];

const stationDailyBase: Record<string, number> = {
  "stn-dla7": 92000,
  "stn-dax5": 74000,
  "stn-dse2": 69000,
  "stn-dat6": 62000,
  "stn-dch1": 63000,
};

const stationVolumeBase: Record<string, number> = {
  "stn-dla7": 4820,
  "stn-dax5": 3910,
  "stn-dse2": 3640,
  "stn-dat6": 3270,
  "stn-dch1": 3302,
};

export const financialDaily: FinancialDaily[] = dateRange(addDays(TODAY, -59), TODAY).flatMap((date) =>
  stations.map((station) => {
    const random = mulberry32(hashString(`${station.id}:${date}:fin`));
    const weekday = dayOfWeek(date);
    const weekendBoost = weekday === 6 ? 1.12 : weekday === 0 ? 1.06 : 1;
    const revenue = round2(stationDailyBase[station.id] * weekendBoost * (0.97 + random() * 0.06));
    return {
      id: `fin-${station.id}-${date}`,
      station_id: station.id,
      service_date: date,
      revenue,
      labor_cost: round2(revenue * (0.505 + random() * 0.03)),
      overtime_cost: round2(revenue * (0.048 + random() * 0.02)),
      fuel_cost: round2(revenue * (0.092 + random() * 0.018)),
      vehicle_cost: round2(revenue * (0.076 + random() * 0.012)),
      other_cost: round2(revenue * (0.026 + random() * 0.008)),
    };
  }),
);

function standingFromDcr(dcr: number): ScoreStanding {
  if (dcr >= 99.0) return "fantastic";
  if (dcr >= 98.2) return "great";
  if (dcr >= 97.0) return "fair";
  return "poor";
}

export const scorecards: Scorecard[] = Array.from({ length: 8 }, (_, weekIndex) =>
  addDays(WEEK_START, -7 * (7 - weekIndex)),
).flatMap((weekStart) =>
  stations.map((station) => {
    const random = mulberry32(hashString(`${station.id}:${weekStart}:sc`));
    const dcr = round2(98.2 + random() * 1.5 - (station.id === "stn-dax5" ? 0.6 : 0));
    const safety = round2(820 + random() * 90 - (station.id === "stn-dch1" ? 30 : 0));
    return {
      id: `sc-${station.id}-${weekStart}`,
      station_id: station.id,
      week_start: weekStart,
      standing: standingFromDcr(dcr),
      dcr,
      cdf: round2(4.72 + random() * 0.22),
      pod_compliance: round2(97.4 + random() * 2.2),
      contact_compliance: round2(96.8 + random() * 2.4),
      safety_score: safety,
      attendance_pct: round2(96.2 + random() * 3.2),
      photo_on_delivery: round2(97.1 + random() * 2.4),
      dnr: round2(0.16 + random() * 0.28),
      dsc: round2(99.05 + random() * 0.7),
      customer_escalations: Math.round(3 + random() * 10),
      fico_score: Math.round(820 + random() * 70 - (station.id === "stn-dax5" ? 25 : 0)),
    };
  }),
);

export const forecasts: Forecast[] = dateRange(addDays(TODAY, -6), addDays(TODAY, 7)).flatMap((date) =>
  stations.map((station) => {
    const random = mulberry32(hashString(`${station.id}:${date}:fc`));
    const weekday = dayOfWeek(date);
    const weekendBoost = weekday === 6 ? 1.14 : weekday === 0 ? 1.05 : weekday === 5 ? 1.08 : 1;
    const volume = Math.round(stationVolumeBase[station.id] * weekendBoost * (0.97 + random() * 0.06));
    const isPast = date <= TODAY;
    return {
      id: `fc-${station.id}-${date}`,
      station_id: station.id,
      forecast_date: date,
      volume_forecast: volume,
      volume_lower: Math.round(volume * 0.94),
      volume_upper: Math.round(volume * 1.07),
      volume_actual: isPast ? Math.round(volume * (0.98 + random() * 0.04)) : null,
      routes_forecast: Math.round(26 + (stationVolumeBase[station.id] - 3300) / 220 + (weekday === 6 ? 4 : 0)),
      staffing_forecast: Math.round(28 + (stationVolumeBase[station.id] - 3300) / 200 + (weekday === 6 ? 5 : 0)),
      overtime_hours_forecast: round2(18 + random() * 16 + (weekday === 6 ? 12 : 0)),
    };
  }),
);

export const hourlyProgress: HourlyProgress[] = [
  { hour: "06:00", planned: 900, delivered: 880 },
  { hour: "08:00", planned: 3200, delivered: 3120 },
  { hour: "10:00", planned: 6400, delivered: 6250 },
  { hour: "12:00", planned: 9600, delivered: 9410 },
  { hour: "14:00", planned: 12800, delivered: 12610 },
  { hour: "16:00", planned: 15600, delivered: 15380 },
  { hour: "18:00", planned: 17900, delivered: 17640 },
];

export const DEMO_USERS: DemoUser[] = [
  { email: "owner@dsp.local", password: "demo", role: "owner", fullName: "Alex Rivera", initials: "AR", stationId: null },
  { email: "ops@dsp.local", password: "demo", role: "operations_manager", fullName: "Jordan Hale", initials: "JH", stationId: "stn-dla7" },
  { email: "dispatch@dsp.local", password: "demo", role: "dispatcher", fullName: "Sam Okonkwo", initials: "SO", stationId: "stn-dla7" },
  { email: "safety@dsp.local", password: "demo", role: "safety_manager", fullName: "Riley Cho", initials: "RC", stationId: null },
  { email: "finance@dsp.local", password: "demo", role: "finance", fullName: "Morgan Ellis", initials: "ME", stationId: null },
  { email: "driver@dsp.local", password: "demo", role: "driver", fullName: "Maya Alvarez", initials: "MA", stationId: "stn-dla7", driverId: "drv-1042" },
];

export const chartPalette = ["#ff9900", "#146eb4", "#00a8b5", "#8b5cf6", "#f43f5e"];
