export type AppRole =
  | "owner"
  | "operations_manager"
  | "dispatcher"
  | "safety_manager"
  | "finance"
  | "driver";

export type DriverStatus =
  | "on_road"
  | "at_station"
  | "break"
  | "delayed"
  | "rescued"
  | "off_duty";

export type RouteStatus =
  | "planned"
  | "loading"
  | "in_progress"
  | "rescue"
  | "completed"
  | "cancelled";

export type RescueStatus = "requested" | "in_progress" | "completed";

export type AttendanceStatus = "present" | "late" | "absent" | "pto" | "call_out";

export type SafetyEventType =
  | "speeding"
  | "seatbelt"
  | "following_distance"
  | "sign_signal"
  | "distraction"
  | "harsh_braking";

export type InspectionStatus = "pass" | "fail" | "pending";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type ScoreStanding = "fantastic" | "great" | "fair" | "poor";

export type Trend = "up" | "down" | "flat";

export interface Kpi {
  label: string;
  value: string;
  delta: string;
  trend: Trend;
  hint?: string;
  favorable?: "up" | "down";
}

export interface Station {
  id: string;
  code: string;
  name: string;
  city: string;
  region: string;
}

export interface Driver {
  id: string;
  employee_code: string;
  full_name: string;
  station_id: string;
  hire_date: string;
  status: DriverStatus;
  fico_score: number;
  safety_score: number;
  dcr: number;
  attendance_pct: number;
  on_time_pct: number;
  dpmo: number;
  seatbelt_pct: number;
}

export interface Vehicle {
  id: string;
  van_id: string;
  vin: string;
  station_id: string;
  year: number;
  make: string;
  model: string;
  status: "active" | "maintenance" | "oos";
  powertrain: "ev" | "ice";
  odometer_miles: number;
  last_service_date: string;
  next_service_miles: number;
  utilization_pct: number;
  assigned_driver_id: string | null;
}

export interface Route {
  id: string;
  route_code: string;
  station_id: string;
  driver_id: string;
  vehicle_id: string;
  service_date: string;
  status: RouteStatus;
  stops_planned: number;
  stops_completed: number;
  packages_planned: number;
  packages_delivered: number;
  failed_count: number;
  started_at: string | null;
  completed_at: string | null;
  estimated_finish: string | null;
}

export interface Rescue {
  id: string;
  service_date: string;
  distressed_route_id: string;
  rescue_route_id: string | null;
  stops_transferred: number;
  status: RescueStatus;
  reason: string;
  requested_at: string;
  completed_at: string | null;
}

export interface FailedDelivery {
  id: string;
  route_id: string;
  tracking_id: string;
  stop_number: number;
  reason: string;
  customer_notified: boolean;
  created_at: string;
}

export interface Attendance {
  id: string;
  driver_id: string;
  service_date: string;
  status: AttendanceStatus;
  scheduled_start: string;
  actual_start: string | null;
}

export interface SafetyEvent {
  id: string;
  driver_id: string;
  vehicle_id: string;
  event_type: SafetyEventType;
  severity: IncidentSeverity;
  speed_mph: number | null;
  speed_limit_mph: number | null;
  occurred_at: string;
  notes: string;
}

export interface VehicleInspection {
  id: string;
  vehicle_id: string;
  driver_id: string;
  inspected_at: string;
  status: InspectionStatus;
  defects: string[];
  notes: string;
}

export interface Incident {
  id: string;
  driver_id: string | null;
  vehicle_id: string | null;
  station_id: string;
  occurred_at: string;
  severity: IncidentSeverity;
  category: string;
  description: string;
  status: "open" | "investigating" | "closed";
}

export interface CoachingRecommendation {
  id: string;
  driver_id: string;
  category: string;
  priority: "high" | "medium" | "low";
  recommendation: string;
  metric: string;
  created_at: string;
  completed_at: string | null;
}

export interface FinancialDaily {
  id: string;
  station_id: string;
  service_date: string;
  revenue: number;
  labor_cost: number;
  overtime_cost: number;
  fuel_cost: number;
  vehicle_cost: number;
  other_cost: number;
}

export interface Scorecard {
  id: string;
  station_id: string;
  week_start: string;
  standing: ScoreStanding;
  dcr: number;
  cdf: number;
  pod_compliance: number;
  contact_compliance: number;
  safety_score: number;
  attendance_pct: number;
  photo_on_delivery: number;
  dnr: number;
  dsc: number;
  customer_escalations: number;
}

export interface Forecast {
  id: string;
  station_id: string;
  forecast_date: string;
  volume_forecast: number;
  volume_lower: number;
  volume_upper: number;
  volume_actual: number | null;
  routes_forecast: number;
  staffing_forecast: number;
  overtime_hours_forecast: number;
}

export interface HourlyProgress {
  hour: string;
  planned: number;
  delivered: number;
}

export interface SeedDatabase {
  stations: Station[];
  drivers: Driver[];
  vehicles: Vehicle[];
  routes: Route[];
  rescues: Rescue[];
  failedDeliveries: FailedDelivery[];
  attendance: Attendance[];
  safetyEvents: SafetyEvent[];
  inspections: VehicleInspection[];
  incidents: Incident[];
  coaching: CoachingRecommendation[];
  financialDaily: FinancialDaily[];
  scorecards: Scorecard[];
  forecasts: Forecast[];
  hourlyProgress: HourlyProgress[];
}

export interface DemoUser {
  email: string;
  password: string;
  role: AppRole;
  fullName: string;
  initials: string;
  stationId: string | null;
  driverId?: string;
}

export interface SessionUser {
  email: string;
  role: AppRole;
  fullName: string;
  initials: string;
  stationId: string | null;
  driverId?: string;
}
