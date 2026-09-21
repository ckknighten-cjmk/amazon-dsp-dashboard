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
  fico_score: number;
}

export type MaintenanceStatus = "scheduled" | "in_progress" | "completed" | "overdue";
export type MaintenanceType = "preventive" | "corrective" | "tire" | "body" | "recall";

export interface MaintenanceOrder {
  id: string;
  vehicle_id: string;
  station_id: string;
  work_order: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  scheduled_date: string;
  completed_date: string | null;
  odometer_miles: number;
  vendor: string;
  cost: number;
  downtime_hours: number;
  description: string;
}

export type PtoStatus = "pending" | "approved" | "denied" | "taken";
export type PtoType = "vacation" | "sick" | "personal" | "unpaid";

export interface PtoRequest {
  id: string;
  driver_id: string;
  pto_type: PtoType;
  status: PtoStatus;
  start_date: string;
  end_date: string;
  hours: number;
  notes: string;
}

export type DisciplineType = "verbal" | "written" | "final" | "suspension";
export type DisciplineStatus = "open" | "closed";

export interface DisciplinaryRecord {
  id: string;
  driver_id: string;
  occurred_at: string;
  type: DisciplineType;
  status: DisciplineStatus;
  category: string;
  description: string;
  issued_by: string;
}

export interface PayrollRecord {
  id: string;
  driver_id: string;
  station_id: string;
  period_start: string;
  period_end: string;
  regular_hours: number;
  overtime_hours: number;
  regular_pay: number;
  overtime_pay: number;
  bonuses: number;
  deductions: number;
  net_pay: number;
}

export type ExpenseCategory = "fuel" | "maintenance" | "insurance" | "supplies" | "uniforms" | "other";

export interface Expense {
  id: string;
  station_id: string;
  service_date: string;
  category: ExpenseCategory;
  vendor: string;
  amount: number;
  source: "fuel_card" | "shop" | "manual" | "payroll";
  reference: string;
  notes: string;
}

export type DowntimeReason = "maintenance" | "accident" | "inspection_fail" | "charging" | "parts";

export interface VehicleDowntime {
  id: string;
  vehicle_id: string;
  station_id: string;
  started_at: string;
  ended_at: string | null;
  reason: DowntimeReason;
  hours: number;
  notes: string;
}

export type MaintenanceEventType = "preventive" | "repair" | "inspection" | "damage" | "dvic";

export interface MaintenanceEvent {
  id: string;
  vehicle_id: string;
  station_id: string;
  work_order_id: string | null;
  event_type: MaintenanceEventType;
  occurred_at: string;
  odometer_miles: number;
  title: string;
  description: string;
  downtime_hours: number;
  technician: string;
}

export type WorkOrderStatus = "open" | "in_progress" | "completed" | "cancelled";
export type WorkOrderPriority = "low" | "medium" | "high" | "critical";
export type WorkOrderType = "preventive" | "repair" | "body" | "tire" | "recall" | "dvic";

export interface WorkOrder {
  id: string;
  vehicle_id: string;
  station_id: string;
  wo_number: string;
  title: string;
  description: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  opened_at: string;
  due_at: string;
  completed_at: string | null;
  shop: string;
  estimated_hours: number;
  actual_hours: number | null;
}

export type VehicleStatusCode = Vehicle["status"] | "new";

export interface VehicleStatusHistory {
  id: string;
  vehicle_id: string;
  from_status: VehicleStatusCode;
  to_status: Vehicle["status"];
  changed_at: string;
  reason: string;
  changed_by: string;
}

export type RepairCostCategory = "parts" | "labor" | "body" | "tires" | "glass" | "other";

export interface RepairCost {
  id: string;
  vehicle_id: string;
  work_order_id: string;
  category: RepairCostCategory;
  amount: number;
  incurred_at: string;
  vendor: string;
  description: string;
}

export type ImportSource = "amazon_scorecard" | "payroll" | "fuel_card" | "fleet_maintenance";
export type ImportJobStatus = "idle" | "ready" | "mapped" | "imported" | "failed";

export interface ImportJob {
  id: string;
  source: ImportSource;
  status: ImportJobStatus;
  last_run_at: string | null;
  next_run_at: string | null;
  records_imported: number;
  records_failed: number;
  mapping_notes: string;
  connector: string;
}

export type InsightSeverity = "critical" | "warning" | "watch";
export type InsightCategory = "staffing" | "overtime" | "routes" | "safety" | "profitability";

export interface Insight {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  recommendation: string;
  metric: string;
  stationCode?: string;
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
  maintenance: MaintenanceOrder[];
  payroll: PayrollRecord[];
  expenses: Expense[];
  pto: PtoRequest[];
  discipline: DisciplinaryRecord[];
  downtime: VehicleDowntime[];
  importJobs: ImportJob[];
  maintenanceEvents: MaintenanceEvent[];
  workOrders: WorkOrder[];
  vehicleStatusHistory: VehicleStatusHistory[];
  repairCosts: RepairCost[];
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
