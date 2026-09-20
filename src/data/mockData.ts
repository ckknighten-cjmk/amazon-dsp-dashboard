// Deterministic mock data for the Amazon DSP Operations Command Center.
// All values are synthetic and intended purely for local development / demos.

export type Trend = "up" | "down" | "flat";

export interface Kpi {
  label: string;
  value: string;
  delta: string;
  trend: Trend;
  hint?: string;
}

export interface DriverStatus {
  id: string;
  name: string;
  route: string;
  stopsCompleted: number;
  stopsTotal: number;
  status: "On Road" | "At Station" | "Break" | "Delayed";
  onTimePct: number;
}

export interface RouteProgress {
  hour: string;
  planned: number;
  delivered: number;
}

export const executiveKpis: Kpi[] = [
  { label: "Packages Delivered", value: "18,942", delta: "+4.2%", trend: "up", hint: "vs. yesterday" },
  { label: "On-Time Rate", value: "97.8%", delta: "+0.6pp", trend: "up", hint: "rolling 7-day" },
  { label: "Active Routes", value: "142", delta: "-3", trend: "down", hint: "vs. plan (145)" },
  { label: "Cost / Package", value: "$3.41", delta: "-2.1%", trend: "up", hint: "efficiency gain" },
];

export const weeklyDeliveries = [
  { day: "Mon", delivered: 17240, planned: 17000 },
  { day: "Tue", delivered: 18010, planned: 17600 },
  { day: "Wed", delivered: 17650, planned: 17900 },
  { day: "Thu", delivered: 18420, planned: 18100 },
  { day: "Fri", delivered: 19180, planned: 18600 },
  { day: "Sat", delivered: 20340, planned: 19800 },
  { day: "Sun", delivered: 18942, planned: 18900 },
];

export const stationMix = [
  { name: "DLA7 – Los Angeles", value: 4820 },
  { name: "DAX5 – Phoenix", value: 3910 },
  { name: "DSE2 – Seattle", value: 3640 },
  { name: "DAT6 – Atlanta", value: 3270 },
  { name: "DCH1 – Chicago", value: 3302 },
];

export const liveRouteProgress: RouteProgress[] = [
  { hour: "06:00", planned: 900, delivered: 880 },
  { hour: "08:00", planned: 3200, delivered: 3120 },
  { hour: "10:00", planned: 6400, delivered: 6250 },
  { hour: "12:00", planned: 9600, delivered: 9410 },
  { hour: "14:00", planned: 12800, delivered: 12610 },
  { hour: "16:00", planned: 15600, delivered: 15380 },
  { hour: "18:00", planned: 17900, delivered: 17640 },
];

export const drivers: DriverStatus[] = [
  { id: "DRV-1042", name: "M. Alvarez", route: "CX-14", stopsCompleted: 168, stopsTotal: 190, status: "On Road", onTimePct: 98.4 },
  { id: "DRV-1088", name: "K. Osei", route: "CX-22", stopsCompleted: 152, stopsTotal: 175, status: "On Road", onTimePct: 96.1 },
  { id: "DRV-1103", name: "J. Nakamura", route: "CX-07", stopsCompleted: 200, stopsTotal: 200, status: "At Station", onTimePct: 99.2 },
  { id: "DRV-1156", name: "S. Petrova", route: "CX-31", stopsCompleted: 120, stopsTotal: 185, status: "Delayed", onTimePct: 91.5 },
  { id: "DRV-1177", name: "D. Okafor", route: "CX-05", stopsCompleted: 143, stopsTotal: 168, status: "On Road", onTimePct: 97.7 },
  { id: "DRV-1201", name: "L. Chen", route: "CX-18", stopsCompleted: 90, stopsTotal: 160, status: "Break", onTimePct: 95.0 },
];

export const driverPerformance = [
  { name: "Alvarez", onTime: 98.4, dpmo: 210 },
  { name: "Osei", onTime: 96.1, dpmo: 480 },
  { name: "Nakamura", onTime: 99.2, dpmo: 90 },
  { name: "Petrova", onTime: 91.5, dpmo: 1120 },
  { name: "Okafor", onTime: 97.7, dpmo: 260 },
  { name: "Chen", onTime: 95.0, dpmo: 640 },
];

export const financials = [
  { month: "Jan", revenue: 1.82, cost: 1.51 },
  { month: "Feb", revenue: 1.74, cost: 1.46 },
  { month: "Mar", revenue: 1.98, cost: 1.55 },
  { month: "Apr", revenue: 2.11, cost: 1.63 },
  { month: "May", revenue: 2.24, cost: 1.69 },
  { month: "Jun", revenue: 2.38, cost: 1.74 },
];

export const costBreakdown = [
  { name: "Labor", value: 58 },
  { name: "Fuel", value: 17 },
  { name: "Vehicle Lease", value: 14 },
  { name: "Insurance", value: 7 },
  { name: "Other", value: 4 },
];

export const safetyIncidents = [
  { week: "W1", incidents: 4, nearMiss: 12 },
  { week: "W2", incidents: 2, nearMiss: 9 },
  { week: "W3", incidents: 3, nearMiss: 11 },
  { week: "W4", incidents: 1, nearMiss: 7 },
  { week: "W5", incidents: 2, nearMiss: 6 },
  { week: "W6", incidents: 0, nearMiss: 5 },
];

export const complianceItems = [
  { label: "DOT Inspections Passed", value: "142 / 142", status: "ok" as const },
  { label: "Expiring Licenses (30d)", value: "3", status: "warn" as const },
  { label: "Overdue Vehicle Maint.", value: "1", status: "warn" as const },
  { label: "Safety Trainings Current", value: "98.6%", status: "ok" as const },
];

export const forecast = [
  { day: "Mon", actual: 17240, forecast: 17240, lower: 17240, upper: 17240 },
  { day: "Tue", actual: 18010, forecast: 18010, lower: 18010, upper: 18010 },
  { day: "Wed", actual: 17650, forecast: 17650, lower: 17650, upper: 17650 },
  { day: "Thu", actual: null, forecast: 18500, lower: 17800, upper: 19200 },
  { day: "Fri", actual: null, forecast: 19400, lower: 18500, upper: 20300 },
  { day: "Sat", actual: null, forecast: 21200, lower: 20000, upper: 22400 },
  { day: "Sun", actual: null, forecast: 19100, lower: 18000, upper: 20200 },
];

export const chartPalette = ["#ff9900", "#146eb4", "#00a8b5", "#8b5cf6", "#f43f5e"];
