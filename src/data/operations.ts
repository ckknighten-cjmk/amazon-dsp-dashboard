import { addDays, dateRange, dayOfWeek, hashString, mulberry32, round2 } from "../lib/format";
import type {
  DisciplinaryRecord,
  Expense,
  ImportJob,
  MaintenanceOrder,
  PayrollRecord,
  PtoRequest,
  VehicleDowntime,
} from "../types/database";
import { TODAY, WEEK_START, attendance, drivers, stations, vehicles } from "./seedCore";

const HOURLY_RATE = 21.75;
const OT_RATE = 32.63;

export const maintenance: MaintenanceOrder[] = [
  {
    id: "mnt-01",
    vehicle_id: "van-15",
    station_id: "stn-dla7",
    work_order: "WO-4418",
    type: "body",
    status: "in_progress",
    scheduled_date: addDays(TODAY, -2),
    completed_date: null,
    odometer_miles: 41220,
    vendor: "Penske Collision DLA7",
    cost: 4180,
    downtime_hours: 46,
    description: "Rear quarter panel and sensor cluster after cul-de-sac contact",
  },
  {
    id: "mnt-02",
    vehicle_id: "van-14",
    station_id: "stn-dch1",
    work_order: "WO-4421",
    type: "corrective",
    status: "in_progress",
    scheduled_date: TODAY,
    completed_date: null,
    odometer_miles: vehicles.find((v) => v.id === "van-14")?.odometer_miles ?? 62000,
    vendor: "Amazon Fleet Shop DCH1",
    cost: 890,
    downtime_hours: 9,
    description: "Brake warning + inner rear tire wear from DVIC fail",
  },
  {
    id: "mnt-03",
    vehicle_id: "van-04",
    station_id: "stn-dax5",
    work_order: "WO-4390",
    type: "preventive",
    status: "scheduled",
    scheduled_date: addDays(TODAY, 2),
    completed_date: null,
    odometer_miles: vehicles.find((v) => v.id === "van-04")?.odometer_miles ?? 28000,
    vendor: "Amazon Fleet Shop DAX5",
    cost: 340,
    downtime_hours: 4,
    description: "5k PM — cabin filter, torque, software recall check",
  },
  {
    id: "mnt-04",
    vehicle_id: "van-09",
    station_id: "stn-dse2",
    work_order: "WO-4382",
    type: "tire",
    status: "overdue",
    scheduled_date: addDays(TODAY, -1),
    completed_date: null,
    odometer_miles: vehicles.find((v) => v.id === "van-09")?.odometer_miles ?? 42000,
    vendor: "Discount Tire SODO",
    cost: 620,
    downtime_hours: 3,
    description: "Inner rear replacement after pre-trip headlamp / wear flag",
  },
  {
    id: "mnt-05",
    vehicle_id: "van-01",
    station_id: "stn-dla7",
    work_order: "WO-4311",
    type: "preventive",
    status: "completed",
    scheduled_date: addDays(TODAY, -12),
    completed_date: addDays(TODAY, -12),
    odometer_miles: 14850,
    vendor: "Amazon Fleet Shop DLA7",
    cost: 285,
    downtime_hours: 2.5,
    description: "Completed 15k PM",
  },
  {
    id: "mnt-06",
    vehicle_id: "van-07",
    station_id: "stn-dse2",
    work_order: "WO-4334",
    type: "recall",
    status: "completed",
    scheduled_date: addDays(TODAY, -8),
    completed_date: addDays(TODAY, -8),
    odometer_miles: 37170,
    vendor: "Ford Commercial Seattle",
    cost: 0,
    downtime_hours: 5,
    description: "Camera module recall — warranty",
  },
  {
    id: "mnt-07",
    vehicle_id: "van-12",
    station_id: "stn-dch1",
    work_order: "WO-4360",
    type: "corrective",
    status: "completed",
    scheduled_date: addDays(TODAY, -5),
    completed_date: addDays(TODAY, -5),
    odometer_miles: 55770,
    vendor: "Amazon Fleet Shop DCH1",
    cost: 475,
    downtime_hours: 6,
    description: "12V aux battery replacement",
  },
  {
    id: "mnt-08",
    vehicle_id: "van-03",
    station_id: "stn-dla7",
    work_order: "WO-4428",
    type: "preventive",
    status: "scheduled",
    scheduled_date: addDays(TODAY, 5),
    completed_date: null,
    odometer_miles: vehicles.find((v) => v.id === "van-03")?.odometer_miles ?? 22000,
    vendor: "Amazon Fleet Shop DLA7",
    cost: 310,
    downtime_hours: 3,
    description: "Upcoming 20k PM",
  },
];

export const downtime: VehicleDowntime[] = [
  {
    id: "dt-01",
    vehicle_id: "van-15",
    station_id: "stn-dla7",
    started_at: `${addDays(TODAY, -2)}T07:00:00Z`,
    ended_at: null,
    reason: "accident",
    hours: 46,
    notes: "OOS pending body shop — EV-224",
  },
  {
    id: "dt-02",
    vehicle_id: "van-14",
    station_id: "stn-dch1",
    started_at: `${TODAY}T06:20:00Z`,
    ended_at: null,
    reason: "inspection_fail",
    hours: 9,
    notes: "Held after DVIC fail — brake warning",
  },
  {
    id: "dt-03",
    vehicle_id: "van-09",
    station_id: "stn-dse2",
    started_at: `${addDays(TODAY, -1)}T16:40:00Z`,
    ended_at: `${TODAY}T05:50:00Z`,
    reason: "parts",
    hours: 13,
    notes: "Waiting on tire set overnight",
  },
  {
    id: "dt-04",
    vehicle_id: "van-01",
    station_id: "stn-dla7",
    started_at: `${addDays(TODAY, -12)}T06:00:00Z`,
    ended_at: `${addDays(TODAY, -12)}T08:30:00Z`,
    reason: "maintenance",
    hours: 2.5,
    notes: "PM completed same morning",
  },
  {
    id: "dt-05",
    vehicle_id: "van-06",
    station_id: "stn-dax5",
    started_at: `${addDays(TODAY, -3)}T18:10:00Z`,
    ended_at: `${addDays(TODAY, -3)}T20:05:00Z`,
    reason: "charging",
    hours: 1.9,
    notes: "Returned below reserve SOC",
  },
];

export const pto: PtoRequest[] = [
  {
    id: "pto-01",
    driver_id: "drv-1266",
    pto_type: "vacation",
    status: "taken",
    start_date: WEEK_START,
    end_date: addDays(WEEK_START, 1),
    hours: 18,
    notes: "Approved vacation — back mid-week, PTO again Sunday",
  },
  {
    id: "pto-02",
    driver_id: "drv-1266",
    pto_type: "personal",
    status: "approved",
    start_date: TODAY,
    end_date: TODAY,
    hours: 9,
    notes: "Sunday personal day already on the board",
  },
  {
    id: "pto-03",
    driver_id: "drv-1308",
    pto_type: "unpaid",
    status: "pending",
    start_date: addDays(TODAY, 1),
    end_date: addDays(TODAY, 3),
    hours: 27,
    notes: "Reliability hold — pending ops review after PIP",
  },
  {
    id: "pto-04",
    driver_id: "drv-1201",
    pto_type: "sick",
    status: "taken",
    start_date: addDays(WEEK_START, 1),
    end_date: addDays(WEEK_START, 1),
    hours: 9,
    notes: "Call-out converted to sick after doctor's note",
  },
  {
    id: "pto-05",
    driver_id: "drv-1103",
    pto_type: "vacation",
    status: "approved",
    start_date: addDays(TODAY, 6),
    end_date: addDays(TODAY, 8),
    hours: 27,
    notes: "Peak-adjacent PTO — coverage assigned",
  },
  {
    id: "pto-06",
    driver_id: "drv-1042",
    pto_type: "personal",
    status: "denied",
    start_date: addDays(TODAY, 6),
    end_date: addDays(TODAY, 6),
    hours: 9,
    notes: "Saturday peak — denied, offer swap next cycle",
  },
  {
    id: "pto-07",
    driver_id: "drv-1210",
    pto_type: "vacation",
    status: "approved",
    start_date: addDays(TODAY, 4),
    end_date: addDays(TODAY, 5),
    hours: 18,
    notes: "Mid-week vacation — extra DA covering DSE2",
  },
  {
    id: "pto-08",
    driver_id: "drv-1224",
    pto_type: "personal",
    status: "pending",
    start_date: addDays(TODAY, 2),
    end_date: addDays(TODAY, 2),
    hours: 9,
    notes: "School appointment. Pending dispatcher coverage check.",
  },
  {
    id: "pto-09",
    driver_id: "drv-1294",
    pto_type: "sick",
    status: "taken",
    start_date: addDays(WEEK_START, 2),
    end_date: addDays(WEEK_START, 2),
    hours: 9,
    notes: "Same-day sick — converted from late clock-in",
  },
  {
    id: "pto-10",
    driver_id: "drv-1280",
    pto_type: "vacation",
    status: "approved",
    start_date: addDays(TODAY, 8),
    end_date: addDays(TODAY, 10),
    hours: 27,
    notes: "Blackout adjacent — DCH1 extras already named",
  },
  {
    id: "pto-11",
    driver_id: "drv-1252",
    pto_type: "personal",
    status: "approved",
    start_date: addDays(TODAY, 1),
    end_date: addDays(TODAY, 1),
    hours: 9,
    notes: "Monday personal — DAT6 one DA short unless extra reports",
  },
  {
    id: "pto-12",
    driver_id: "drv-1177",
    pto_type: "sick",
    status: "pending",
    start_date: addDays(TODAY, 3),
    end_date: addDays(TODAY, 3),
    hours: 9,
    notes: "Follow-up appointment. Waiting on doctor's note.",
  },
];

export const discipline: DisciplinaryRecord[] = [
  {
    id: "disc-01",
    driver_id: "drv-1308",
    occurred_at: `${addDays(TODAY, -6)}T10:30:00Z`,
    type: "final",
    status: "open",
    category: "Safety",
    description: "Seatbelt + distraction events after prior written warning. Final notice issued.",
    issued_by: "Riley Cho",
  },
  {
    id: "disc-02",
    driver_id: "drv-1156",
    occurred_at: `${addDays(TODAY, -2)}T16:00:00Z`,
    type: "written",
    status: "open",
    category: "Safety",
    description: "Third speeding event in seven days. Written warning + clinic required.",
    issued_by: "Riley Cho",
  },
  {
    id: "disc-03",
    driver_id: "drv-1238",
    occurred_at: `${addDays(TODAY, -1)}T07:15:00Z`,
    type: "verbal",
    status: "open",
    category: "Performance",
    description: "Late wave + rescue dependency. Verbal coaching documented.",
    issued_by: "Jordan Hale",
  },
  {
    id: "disc-04",
    driver_id: "drv-1201",
    occurred_at: `${addDays(TODAY, -10)}T09:00:00Z`,
    type: "verbal",
    status: "closed",
    category: "Attendance",
    description: "Call-out pattern counseling. Closed after checklist completion.",
    issued_by: "Jordan Hale",
  },
];

const priorPeriodStart = addDays(WEEK_START, -14);
const priorPeriodEnd = addDays(WEEK_START, -1);
const currentPeriodStart = WEEK_START;
const currentPeriodEnd = TODAY;

function hoursForStatus(status: string): { regular: number; overtime: number } {
  if (status === "present") return { regular: 9, overtime: 0.4 };
  if (status === "late") return { regular: 8.5, overtime: 0.2 };
  return { regular: 0, overtime: 0 };
}

function payrollForPeriod(periodStart: string, periodEnd: string, suffix: string): PayrollRecord[] {
  return drivers.map((driver) => {
    const rows = attendance.filter(
      (row) => row.driver_id === driver.id && row.service_date >= periodStart && row.service_date <= periodEnd,
    );
    const random = mulberry32(hashString(`${driver.id}:${periodStart}:pay`));
    const worked = rows.reduce(
      (acc, row) => {
        const hours = hoursForStatus(row.status);
        acc.regular += hours.regular;
        acc.overtime += hours.overtime;
        return acc;
      },
      { regular: 0, overtime: 0 },
    );
    if (periodStart < WEEK_START) {
      worked.regular = round2(36 + random() * 8);
      worked.overtime = round2(driver.attendance_pct < 95 ? 6 + random() * 4 : 1 + random() * 3);
    }
    if (driver.id === "drv-1156" || driver.id === "drv-1238") {
      worked.overtime = round2(worked.overtime + 3.5);
    }
    const regularPay = round2(worked.regular * HOURLY_RATE);
    const overtimePay = round2(worked.overtime * OT_RATE);
    const bonuses = driver.dcr >= 99.3 ? 75 : 0;
    const deductions = round2(18 + random() * 12);
    return {
      id: `pay-${driver.id}-${suffix}`,
      driver_id: driver.id,
      station_id: driver.station_id,
      period_start: periodStart,
      period_end: periodEnd,
      regular_hours: round2(worked.regular),
      overtime_hours: round2(worked.overtime),
      regular_pay: regularPay,
      overtime_pay: overtimePay,
      bonuses,
      deductions,
      net_pay: round2(regularPay + overtimePay + bonuses - deductions),
    };
  });
}

export const payroll: PayrollRecord[] = [
  ...payrollForPeriod(priorPeriodStart, priorPeriodEnd, "prev"),
  ...payrollForPeriod(currentPeriodStart, currentPeriodEnd, "curr"),
];

const fuelVendors: Record<string, string> = {
  "stn-dla7": "WEX · ChargePoint LA",
  "stn-dax5": "WEX · EVgo PHX",
  "stn-dse2": "WEX · Electrify America SEA",
  "stn-dat6": "WEX · EVgo ATL",
  "stn-dch1": "WEX · ChargePoint CHI",
};

const stationFuelBase: Record<string, number> = {
  "stn-dla7": 1840,
  "stn-dax5": 1520,
  "stn-dse2": 1410,
  "stn-dat6": 1280,
  "stn-dch1": 1310,
};

export const expenses: Expense[] = [
  ...dateRange(addDays(TODAY, -13), TODAY).flatMap((date) =>
    stations.map((station) => {
      const random = mulberry32(hashString(`${station.id}:${date}:fuel`));
      const weekday = dayOfWeek(date);
      const boost = weekday === 6 ? 1.14 : weekday === 0 ? 1.06 : 1;
      return {
        id: `exp-fuel-${station.id}-${date}`,
        station_id: station.id,
        service_date: date,
        category: "fuel" as const,
        vendor: fuelVendors[station.id],
        amount: round2(stationFuelBase[station.id] * boost * (0.94 + random() * 0.12)),
        source: "fuel_card" as const,
        reference: `WEX-${date.replace(/-/g, "")}-${station.code}`,
        notes: "Depot charge + mid-day top-up",
      };
    }),
  ),
  ...maintenance
    .filter((order) => order.cost > 0)
    .map((order) => ({
      id: `exp-mnt-${order.id}`,
      station_id: order.station_id,
      service_date: order.completed_date ?? order.scheduled_date,
      category: "maintenance" as const,
      vendor: order.vendor,
      amount: order.cost,
      source: "shop" as const,
      reference: order.work_order,
      notes: order.description,
    })),
  {
    id: "exp-ins-01",
    station_id: "stn-dla7",
    service_date: addDays(TODAY, -9),
    category: "insurance",
    vendor: "Progressive Commercial",
    amount: 6420,
    source: "manual",
    reference: "INV-PC-9921",
    notes: "Monthly fleet liability installment",
  },
  {
    id: "exp-sup-01",
    station_id: "stn-dax5",
    service_date: addDays(TODAY, -4),
    category: "supplies",
    vendor: "Uline",
    amount: 318,
    source: "manual",
    reference: "PO-8841",
    notes: "Tote labels and overflow bags",
  },
  {
    id: "exp-uni-01",
    station_id: "stn-dse2",
    service_date: addDays(TODAY, -6),
    category: "uniforms",
    vendor: "Amazon DSP Gear",
    amount: 246,
    source: "manual",
    reference: "UNI-2209",
    notes: "Replacement vest + rain kit",
  },
];

export const importJobs: ImportJob[] = [
  {
    id: "imp-scorecard",
    source: "amazon_scorecard",
    status: "mapped",
    last_run_at: `${addDays(TODAY, -5)}T04:10:00Z`,
    next_run_at: `${addDays(TODAY, 2)}T04:00:00Z`,
    records_imported: 40,
    records_failed: 0,
    mapping_notes: "Weekly Amazon scorecard CSV → DCR, POD, CDF, Safety, FICO, DNR, DSC, CE",
    connector: "S3 / Partner Portal export",
  },
  {
    id: "imp-payroll",
    source: "payroll",
    status: "imported",
    last_run_at: `${addDays(WEEK_START, -1)}T22:15:00Z`,
    next_run_at: `${addDays(TODAY, 6)}T22:00:00Z`,
    records_imported: 14,
    records_failed: 0,
    mapping_notes: "ADP / Paycom hours, OT, bonuses, and net pay by employee code",
    connector: "SFTP payroll register",
  },
  {
    id: "imp-fuel",
    source: "fuel_card",
    status: "imported",
    last_run_at: `${addDays(TODAY, -1)}T03:40:00Z`,
    next_run_at: `${addDays(TODAY, 1)}T03:40:00Z`,
    records_imported: 70,
    records_failed: 2,
    mapping_notes: "WEX / charge-network transactions → expenses.fuel by station and van",
    connector: "WEX Connect API",
  },
  {
    id: "imp-fleet",
    source: "fleet_maintenance",
    status: "ready",
    last_run_at: `${addDays(TODAY, -3)}T01:20:00Z`,
    next_run_at: `${TODAY}T23:30:00Z`,
    records_imported: 0,
    records_failed: 0,
    mapping_notes: "Shop work orders, DVIC defects, and downtime from fleet vendor",
    connector: "Amazon Fleet / shop CSV",
  },
];
