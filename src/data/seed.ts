export {
  TODAY,
  TOMORROW,
  WEEK_START,
  MONTH_START,
  stations,
  drivers,
  vehicles,
  routes,
  rescues,
  failedDeliveries,
  attendance,
  safetyEvents,
  inspections,
  incidents,
  coaching,
  financialDaily,
  scorecards,
  forecasts,
  hourlyProgress,
  DEMO_USERS,
  chartPalette,
} from "./seedCore";

export {
  maintenance,
  downtime,
  pto,
  discipline,
  payroll,
  expenses,
  importJobs,
} from "./operations";

export { maintenanceEvents, workOrders, vehicleStatusHistory, repairCosts } from "./fleetReadinessSeed";
export { recruiting, interviews, trainingRecords } from "./workforceSeed";

import type { SeedDatabase } from "../types/database";
import {
  stations,
  drivers,
  vehicles,
  routes,
  rescues,
  failedDeliveries,
  attendance,
  safetyEvents,
  inspections,
  incidents,
  coaching,
  financialDaily,
  scorecards,
  forecasts,
  hourlyProgress,
} from "./seedCore";
import { discipline, downtime, expenses, importJobs, maintenance, payroll, pto } from "./operations";
import { maintenanceEvents, repairCosts, vehicleStatusHistory, workOrders } from "./fleetReadinessSeed";
import { interviews, recruiting, trainingRecords } from "./workforceSeed";

export const seedDb: SeedDatabase = {
  stations,
  drivers,
  vehicles,
  routes,
  rescues,
  failedDeliveries,
  attendance,
  safetyEvents,
  inspections,
  incidents,
  coaching,
  financialDaily,
  scorecards,
  forecasts,
  hourlyProgress,
  maintenance,
  payroll,
  expenses,
  pto,
  discipline,
  downtime,
  importJobs,
  maintenanceEvents,
  workOrders,
  vehicleStatusHistory,
  repairCosts,
  recruiting,
  interviews,
  trainingRecords,
};
