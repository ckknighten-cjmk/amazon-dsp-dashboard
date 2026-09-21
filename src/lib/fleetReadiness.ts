import { MONTH_START, TODAY, TOMORROW } from "../data/seed";
import type {
  Kpi,
  MaintenanceEvent,
  RepairCostCategory,
  SeedDatabase,
  Vehicle,
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
} from "../types/database";
import { addDays, dateRange, formatDate, formatNumber, formatPct, formatUsd, formatUsdCompact, hashString, mulberry32, round2, sum, weekdayShort } from "./format";

export type FleetBoardState = "available" | "grounded" | "needs_service";

export interface FleetVehicleRow extends Vehicle {
  driverName: string;
  stationCode: string;
  inspectionStatus: "pass" | "fail" | "pending";
  defects: string[];
  routeCode: string;
  serviceDue: boolean;
  boardState: FleetBoardState;
  availableTomorrow: boolean;
  grounded: boolean;
  needsService: boolean;
  openDvic: boolean;
  blockingReason: string | null;
  openWorkOrders: number;
}

const BLOCKING_PRIORITIES: WorkOrderPriority[] = ["high", "critical"];
const OPEN_WO_STATUSES: WorkOrderStatus[] = ["open", "in_progress"];

export function latestInspection(db: SeedDatabase, vehicleId: string) {
  return db.inspections
    .filter((row) => row.vehicle_id === vehicleId)
    .sort((a, b) => b.inspected_at.localeCompare(a.inspected_at))[0];
}

export function openWorkOrdersFor(db: SeedDatabase, vehicleId: string): WorkOrder[] {
  return db.workOrders.filter((row) => row.vehicle_id === vehicleId && OPEN_WO_STATUSES.includes(row.status));
}

export function hasOpenDvic(db: SeedDatabase, vehicleId: string): boolean {
  const inspection = latestInspection(db, vehicleId);
  if (inspection && (inspection.status === "fail" || inspection.defects.length > 0)) return true;
  return db.workOrders.some((row) => row.vehicle_id === vehicleId && row.type === "dvic" && OPEN_WO_STATUSES.includes(row.status));
}

export function isGrounded(db: SeedDatabase, vehicle: Vehicle): boolean {
  if (vehicle.status === "oos") return true;
  return db.downtime.some(
    (row) =>
      row.vehicle_id === vehicle.id &&
      !row.ended_at &&
      (row.reason === "accident" || row.reason === "inspection_fail"),
  );
}

export function needsService(db: SeedDatabase, vehicle: Vehicle): boolean {
  if (vehicle.status === "maintenance") return true;
  if (vehicle.odometer_miles >= vehicle.next_service_miles) return true;
  const open = openWorkOrdersFor(db, vehicle.id);
  return open.some(
    (row) =>
      row.type === "preventive" ||
      row.type === "repair" ||
      row.type === "tire" ||
      row.type === "body" ||
      row.due_at < TODAY,
  );
}

export function availableTomorrow(db: SeedDatabase, vehicle: Vehicle): boolean {
  if (isGrounded(db, vehicle)) return false;
  if (vehicle.status !== "active") return false;
  if (hasOpenDvic(db, vehicle.id)) return false;
  const blocking = openWorkOrdersFor(db, vehicle.id).some(
    (row) => BLOCKING_PRIORITIES.includes(row.priority) || row.status === "in_progress" || row.due_at < TODAY,
  );
  return !blocking;
}

export function boardState(db: SeedDatabase, vehicle: Vehicle): FleetBoardState {
  if (isGrounded(db, vehicle)) return "grounded";
  if (!availableTomorrow(db, vehicle) || needsService(db, vehicle)) return "needs_service";
  return "available";
}

function blockingReason(db: SeedDatabase, vehicle: Vehicle): string | null {
  if (isGrounded(db, vehicle)) {
    const downtime = db.downtime.find((row) => row.vehicle_id === vehicle.id && !row.ended_at);
    return downtime?.notes ?? "Grounded / out of service";
  }
  if (hasOpenDvic(db, vehicle.id)) {
    const inspection = latestInspection(db, vehicle.id);
    const defects = inspection?.defects.join(", ");
    return defects ? `Open DVIC: ${defects}` : "Open DVIC defect";
  }
  const overdue = openWorkOrdersFor(db, vehicle.id).find((row) => row.due_at < TODAY || BLOCKING_PRIORITIES.includes(row.priority));
  if (overdue) return `${overdue.wo_number} · ${overdue.title}`;
  if (vehicle.status === "maintenance") return "In shop";
  if (vehicle.odometer_miles >= vehicle.next_service_miles) return "Preventive maintenance overdue";
  return null;
}

function fleetRows(db: SeedDatabase): FleetVehicleRow[] {
  return db.vehicles.map((vehicle) => {
    const driver = db.drivers.find((row) => row.id === vehicle.assigned_driver_id);
    const station = db.stations.find((row) => row.id === vehicle.station_id);
    const inspection = latestInspection(db, vehicle.id);
    const route = db.routes.find((row) => row.vehicle_id === vehicle.id && row.service_date === TODAY);
    const grounded = isGrounded(db, vehicle);
    const service = needsService(db, vehicle);
    const dvic = hasOpenDvic(db, vehicle.id);
    const ready = availableTomorrow(db, vehicle);
    return {
      ...vehicle,
      driverName: driver?.full_name ?? "Spare / unassigned",
      stationCode: station?.code ?? "",
      inspectionStatus: inspection?.status ?? "pending",
      defects: inspection?.defects ?? [],
      routeCode: route?.route_code ?? "—",
      serviceDue: vehicle.odometer_miles >= vehicle.next_service_miles - 750,
      boardState: boardState(db, vehicle),
      availableTomorrow: ready,
      grounded,
      needsService: service,
      openDvic: dvic,
      blockingReason: ready ? null : blockingReason(db, vehicle),
      openWorkOrders: openWorkOrdersFor(db, vehicle.id).length,
    };
  });
}

function estimatedMtdMiles(db: SeedDatabase): number {
  const days = dateRange(MONTH_START, TODAY).length;
  return sum(db.vehicles.map((vehicle) => Math.round((vehicle.utilization_pct / 100) * 108 * days)));
}

export function buildFleetReadiness(db: SeedDatabase) {
  const rows = fleetRows(db);
  const available = rows.filter((row) => row.availableTomorrow);
  const grounded = rows.filter((row) => row.grounded);
  const service = rows.filter((row) => row.needsService);
  const dvic = rows.filter((row) => row.openDvic);
  const readinessPct = db.vehicles.length ? (available.length / db.vehicles.length) * 100 : 0;
  const dueSoon = rows.filter((row) => row.serviceDue && !row.grounded);
  const openDowntime = db.downtime.filter((row) => !row.ended_at);
  const downtimeHours = sum(db.downtime.map((row) => row.hours));
  const mtdCosts = db.repairCosts.filter((row) => row.incurred_at >= MONTH_START && row.incurred_at <= TODAY);
  const repairTotal = sum(mtdCosts.map((row) => row.amount));
  const mtdMiles = estimatedMtdMiles(db);
  const costPerMile = mtdMiles ? repairTotal / mtdMiles : 0;
  const costPerVehicle = db.vehicles.length ? repairTotal / db.vehicles.length : 0;

  const kpis: Kpi[] = [
    {
      label: "Vans available",
      value: String(available.length),
      delta: `${db.vehicles.length} in fleet`,
      trend: available.length >= db.vehicles.length * 0.8 ? "up" : "down",
      hint: `Ready for ${formatDate(TOMORROW)}`,
      favorable: "up",
    },
    {
      label: "Vans grounded",
      value: String(grounded.length),
      delta: `${openDowntime.length} open holds`,
      trend: grounded.length ? "down" : "up",
      hint: "OOS / accident / DVIC hold",
      favorable: "down",
    },
    {
      label: "Vans needing service",
      value: String(service.length),
      delta: dueSoon.length ? `${dueSoon.length} PM due soon` : "On cadence",
      trend: service.length ? "down" : "up",
      hint: "Shop, overdue, or PM window",
      favorable: "down",
    },
    {
      label: "Open DVIC defects",
      value: String(dvic.length),
      delta: `${dvic.reduce((count, row) => count + row.defects.length, 0)} defect flags`,
      trend: dvic.length ? "down" : "up",
      hint: "Failed or defective pre-trips",
      favorable: "down",
    },
    {
      label: "Readiness",
      value: formatPct(readinessPct, 0),
      delta: `${available.length}/${db.vehicles.length} launch-ready`,
      trend: readinessPct >= 80 ? "up" : "down",
      hint: "Share of fleet available tomorrow",
      favorable: "up",
    },
  ];

  const mix = [
    { name: "Available tomorrow", value: available.length, fill: "#10b981" },
    { name: "Grounded", value: grounded.length, fill: "#f43f5e" },
    { name: "Needs service", value: rows.filter((row) => row.boardState === "needs_service" && !row.grounded).length, fill: "#f59e0b" },
  ];

  const pmSchedule = [...rows]
    .map((row) => {
      const pmOrder = db.workOrders.find((order) => order.vehicle_id === row.id && order.type === "preventive" && OPEN_WO_STATUSES.includes(order.status));
      const milesRemaining = row.next_service_miles - row.odometer_miles;
      const estimatedDue = addDays(TODAY, Math.max(0, Math.ceil(milesRemaining / 108)));
      const dueDate = pmOrder?.due_at ?? estimatedDue;
      return {
        ...row,
        milesRemaining,
        dueDate,
        pmWorkOrder: pmOrder?.wo_number ?? null,
        pmOverdue: milesRemaining <= 0 || dueDate < TODAY,
      };
    })
    .sort((a, b) => a.milesRemaining - b.milesRemaining || a.dueDate.localeCompare(b.dueDate));

  const openWorkOrders = db.workOrders
    .filter((row) => OPEN_WO_STATUSES.includes(row.status))
    .slice()
    .sort((a, b) => {
      const rank: Record<WorkOrderPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return rank[a.priority] - rank[b.priority] || a.due_at.localeCompare(b.due_at);
    });

  const repairHistory = db.workOrders
    .filter((row) => row.status === "completed")
    .slice()
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));

  const costByCategory = (["parts", "labor", "body", "tires", "glass", "other"] as RepairCostCategory[])
    .map((category) => ({
      name: category[0].toUpperCase() + category.slice(1),
      value: round2(sum(mtdCosts.filter((row) => row.category === category).map((row) => row.amount))),
    }))
    .filter((row) => row.value > 0);

  const costByVehicle = rows
    .map((row) => ({
      id: row.id,
      vanId: row.van_id,
      stationCode: row.stationCode,
      amount: round2(sum(mtdCosts.filter((cost) => cost.vehicle_id === row.id).map((cost) => cost.amount))),
      downtimeHours: round2(sum(db.downtime.filter((item) => item.vehicle_id === row.id).map((item) => item.hours))),
    }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const costTrend = dateRange(addDays(TODAY, -13), TODAY).map((date) => ({
    date,
    day: weekdayShort(date),
    amount: round2(sum(db.repairCosts.filter((row) => row.incurred_at === date).map((row) => row.amount))),
  }));

  const downtimeByReason = ["accident", "inspection_fail", "maintenance", "parts", "charging"].map((reason) => ({
    name: reason.replace("_", " "),
    hours: round2(sum(db.downtime.filter((row) => row.reason === reason).map((row) => row.hours))),
  }));

  const availabilityTrend = dateRange(addDays(TODAY, -13), TODAY).map((date) => {
    const groundedIds = new Set<string>();
    for (const vehicle of db.vehicles) {
      const events = db.vehicleStatusHistory
        .filter((row) => row.vehicle_id === vehicle.id && row.changed_at.slice(0, 10) <= date)
        .sort((a, b) => a.changed_at.localeCompare(b.changed_at));
      const last = events[events.length - 1];
      const status = last?.to_status ?? vehicle.status;
      if (status === "oos") groundedIds.add(vehicle.id);
      if (date === TODAY && isGrounded(db, vehicle)) groundedIds.add(vehicle.id);
    }
    const ready = db.vehicles.length - groundedIds.size;
    return {
      date,
      day: weekdayShort(date),
      availability: round2((ready / Math.max(db.vehicles.length, 1)) * 100),
      grounded: groundedIds.size,
    };
  });

  const newDamage = db.maintenanceEvents
    .filter((row) => row.event_type === "damage" && row.occurred_at.slice(0, 10) >= addDays(TODAY, -3))
    .slice()
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));

  const openDvicEvents = db.maintenanceEvents
    .filter((row) => row.event_type === "dvic")
    .filter((row) => openWorkOrdersFor(db, row.vehicle_id).some((order) => order.type === "dvic" || order.type === "repair" || order.type === "tire") || hasOpenDvic(db, row.vehicle_id))
    .slice()
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));

  const kpiCards: Kpi[] = [
    {
      label: "Fleet availability",
      value: formatPct(readinessPct, 1),
      delta: `${available.length} ready tomorrow`,
      trend: readinessPct >= 80 ? "up" : "down",
      hint: "Launch-ready share of fleet",
      favorable: "up",
    },
    {
      label: "Cost per mile",
      value: formatUsd(costPerMile, 2),
      delta: `${formatNumber(mtdMiles, 0)} MTD mi`,
      trend: costPerMile <= 0.35 ? "up" : "down",
      hint: "MTD repair cost / estimated miles",
      favorable: "down",
    },
    {
      label: "Cost per vehicle",
      value: formatUsd(costPerVehicle, 0),
      delta: `${db.vehicles.length} vans`,
      trend: costPerVehicle <= 600 ? "up" : "down",
      hint: "MTD repair cost / fleet size",
      favorable: "down",
    },
    {
      label: "Downtime hours",
      value: `${formatNumber(downtimeHours, 1)}h`,
      delta: `${openDowntime.length} currently held`,
      trend: downtimeHours <= 80 ? "up" : "down",
      hint: "Accident, shop, parts, charging",
      favorable: "down",
    },
    {
      label: "Repair costs",
      value: formatUsdCompact(repairTotal),
      delta: "MTD shop spend",
      trend: "down",
      hint: `${mtdCosts.length} cost lines`,
      favorable: "down",
    },
  ];

  return {
    kpis,
    kpiCards,
    rows,
    dueSoon,
    available,
    grounded,
    service,
    dvic,
    readinessPct,
    mix,
    pmSchedule,
    openWorkOrders,
    repairHistory,
    workOrders: db.workOrders,
    maintenance: db.maintenance,
    downtime: db.downtime,
    openMaintenance: db.maintenance.filter((row) => row.status !== "completed"),
    openDowntime,
    downtimeHours,
    costByCategory,
    costByVehicle,
    costTrend,
    downtimeByReason,
    availabilityTrend,
    newDamage,
    openDvicEvents,
    repairTotal,
    costPerMile,
    costPerVehicle,
    mtdMiles,
    tomorrowLabel: formatDate(TOMORROW),
    todayLabel: formatDate(TODAY),
  };
}

export function eventsForVehicle(db: SeedDatabase, vehicleId: string): MaintenanceEvent[] {
  return db.maintenanceEvents
    .filter((row) => row.vehicle_id === vehicleId)
    .slice()
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
}

export function buildVehicleDetail(db: SeedDatabase, vehicleId: string) {
  const fleet = buildFleetReadiness(db);
  const vehicle = fleet.rows.find((row) => row.id === vehicleId);
  if (!vehicle) return null;

  const events = eventsForVehicle(db, vehicleId);
  const orders = db.workOrders
    .filter((row) => row.vehicle_id === vehicleId)
    .slice()
    .sort((a, b) => b.opened_at.localeCompare(a.opened_at));
  const costs = db.repairCosts.filter((row) => row.vehicle_id === vehicleId);
  const history = db.vehicleStatusHistory
    .filter((row) => row.vehicle_id === vehicleId)
    .slice()
    .sort((a, b) => b.changed_at.localeCompare(a.changed_at));
  const downtime = db.downtime
    .filter((row) => row.vehicle_id === vehicleId)
    .slice()
    .sort((a, b) => b.started_at.localeCompare(a.started_at));
  const incidents = db.incidents.filter((row) => row.vehicle_id === vehicleId);

  const rng = mulberry32(hashString(vehicle.id));
  const groundedSince = history.find((row) => row.to_status === "oos")?.changed_at.slice(0, 10);
  const routeHistory = dateRange(addDays(TODAY, -9), TODAY)
    .map((date) => {
      const todayRoute = db.routes.find((row) => row.vehicle_id === vehicleId && row.service_date === date);
      if (todayRoute) {
        const driver = db.drivers.find((row) => row.id === todayRoute.driver_id);
        return {
          id: todayRoute.id,
          date,
          route: todayRoute.route_code,
          driver: driver?.full_name ?? vehicle.driverName,
          packages: todayRoute.packages_delivered,
          miles: 18 + Math.round(todayRoute.stops_completed * 0.42),
          status: todayRoute.status === "completed" ? "completed" : todayRoute.status === "cancelled" ? "cancelled" : "in_progress",
        };
      }
      if (groundedSince && date >= groundedSince) return null;
      if (vehicle.status === "maintenance" && date === TODAY) return null;
      if (rng() < 0.12) return null;
      const driver = db.drivers.find((row) => row.id === vehicle.assigned_driver_id);
      const packages = 820 + Math.round(rng() * 420);
      return {
        id: `hist-${vehicle.id}-${date}`,
        date,
        route: vehicle.routeCode === "—" ? `CX-${10 + Math.round(rng() * 20)}` : vehicle.routeCode,
        driver: driver?.full_name ?? "Unassigned",
        packages,
        miles: 72 + Math.round(rng() * 48),
        status: "completed" as const,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .reverse();

  return {
    vehicle,
    events,
    serviceHistory: events.filter((row) => row.event_type === "preventive" || row.event_type === "repair" || row.event_type === "inspection"),
    damageHistory: events.filter((row) => row.event_type === "damage").concat(
      incidents.map((incident) => ({
        id: incident.id,
        vehicle_id: vehicleId,
        station_id: incident.station_id,
        work_order_id: null,
        event_type: "damage" as const,
        occurred_at: incident.occurred_at,
        odometer_miles: vehicle.odometer_miles,
        title: `${incident.category} incident`,
        description: incident.description,
        downtime_hours: 0,
        technician: "Safety desk",
      })),
    ),
    orders,
    costs,
    costTotal: sum(costs.map((row) => row.amount)),
    history,
    downtime,
    routeHistory,
    inspection: latestInspection(db, vehicleId),
  };
}
