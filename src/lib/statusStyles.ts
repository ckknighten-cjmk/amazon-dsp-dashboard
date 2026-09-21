import type {
  AttendanceStatus,
  DriverStatus,
  IncidentSeverity,
  InspectionStatus,
  RescueStatus,
  RouteStatus,
  ScoreStanding,
} from "../types/database";

export const driverStatusLabel: Record<DriverStatus, string> = {
  on_road: "On Road",
  at_station: "At Station",
  break: "Break",
  delayed: "Delayed",
  rescued: "Rescue",
  off_duty: "Off Duty",
};

export const driverStatusClass: Record<DriverStatus, string> = {
  on_road: "badge-success",
  at_station: "badge-info",
  break: "badge-warning",
  delayed: "badge-danger",
  rescued: "badge-danger",
  off_duty: "badge-neutral",
};

export const routeStatusLabel: Record<RouteStatus, string> = {
  planned: "Planned",
  loading: "Loading",
  in_progress: "In Progress",
  rescue: "Rescue",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const routeStatusClass: Record<RouteStatus, string> = {
  planned: "badge-neutral",
  loading: "badge-info",
  in_progress: "badge-success",
  rescue: "badge-danger",
  completed: "badge-info",
  cancelled: "badge-neutral",
};

export const rescueStatusClass: Record<RescueStatus, string> = {
  requested: "badge-warning",
  in_progress: "badge-danger",
  completed: "badge-success",
};

export const attendanceClass: Record<AttendanceStatus, string> = {
  present: "badge-success",
  late: "badge-warning",
  absent: "badge-danger",
  pto: "badge-info",
  call_out: "badge-danger",
};

export const severityClass: Record<IncidentSeverity, string> = {
  low: "badge-info",
  medium: "badge-warning",
  high: "badge-danger",
  critical: "badge-danger",
};

export const inspectionClass: Record<InspectionStatus, string> = {
  pass: "badge-success",
  fail: "badge-danger",
  pending: "badge-warning",
};

export const standingClass: Record<ScoreStanding, string> = {
  fantastic: "badge-success",
  great: "badge-info",
  fair: "badge-warning",
  poor: "badge-danger",
};
