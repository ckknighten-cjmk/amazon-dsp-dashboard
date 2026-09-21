import type { AppRole } from "../types/database";

export interface NavItemConfig {
  to: string;
  label: string;
  roles: AppRole[];
}

export const ALL_ROLES: AppRole[] = [
  "owner",
  "operations_manager",
  "dispatcher",
  "safety_manager",
  "finance",
  "driver",
];

export const NAV_ITEMS: NavItemConfig[] = [
  {
    to: "/",
    label: "Executive",
    roles: ["owner", "operations_manager", "safety_manager", "finance"],
  },
  {
    to: "/dispatch",
    label: "Morning Dispatch",
    roles: ["owner", "operations_manager", "dispatcher"],
  },
  {
    to: "/operations",
    label: "Live Operations",
    roles: ["owner", "operations_manager", "dispatcher"],
  },
  {
    to: "/drivers",
    label: "Driver Performance",
    roles: ["owner", "operations_manager", "dispatcher", "safety_manager", "driver"],
  },
  {
    to: "/financial",
    label: "Financial",
    roles: ["owner", "finance"],
  },
  {
    to: "/safety",
    label: "Safety & Compliance",
    roles: ["owner", "operations_manager", "safety_manager"],
  },
  {
    to: "/forecasting",
    label: "Forecasting",
    roles: ["owner", "operations_manager", "finance"],
  },
  {
    to: "/fleet",
    label: "Fleet Readiness",
    roles: ["owner", "operations_manager", "dispatcher", "safety_manager", "finance"],
  },
  {
    to: "/scorecard",
    label: "Scorecard Intelligence",
    roles: ["owner", "operations_manager", "safety_manager"],
  },
  {
    to: "/routes",
    label: "Routes",
    roles: ["owner", "operations_manager", "dispatcher", "finance"],
  },
  {
    to: "/insights",
    label: "AI Insights",
    roles: ["owner", "operations_manager", "dispatcher", "safety_manager", "finance"],
  },
  {
    to: "/imports",
    label: "Imports",
    roles: ["owner", "operations_manager", "finance"],
  },
  {
    to: "/workforce",
    label: "Workforce",
    roles: ["owner", "operations_manager", "dispatcher", "safety_manager", "finance", "driver"],
  },
];

export const WORKFORCE_TABS: NavItemConfig[] = [
  {
    to: "/workforce/attendance",
    label: "Attendance",
    roles: ["owner", "operations_manager", "dispatcher", "safety_manager", "driver"],
  },
  {
    to: "/workforce/pto",
    label: "PTO Calendar",
    roles: ["owner", "operations_manager", "dispatcher", "driver"],
  },
  {
    to: "/workforce/staffing",
    label: "Staffing Forecast",
    roles: ["owner", "operations_manager", "dispatcher", "finance"],
  },
  {
    to: "/workforce/recruiting",
    label: "Recruiting Pipeline",
    roles: ["owner", "operations_manager"],
  },
  {
    to: "/workforce/lifecycle",
    label: "Driver Lifecycle",
    roles: ["owner", "operations_manager", "safety_manager", "driver"],
  },
];

export const ROLE_LABELS: Record<AppRole, string> = {
  owner: "DSP Owner",
  operations_manager: "Operations Manager",
  dispatcher: "Dispatcher",
  safety_manager: "Safety Manager",
  finance: "Finance",
  driver: "Driver",
};

export function canAccess(role: AppRole, path: string): boolean {
  const normalized = path === "" ? "/" : path;
  if (normalized === "/workforce" || normalized.startsWith("/workforce/")) {
    if (normalized === "/workforce") {
      return WORKFORCE_TABS.some((tab) => tab.roles.includes(role));
    }
    const tab = WORKFORCE_TABS.find((item) => normalized === item.to || normalized.startsWith(`${item.to}/`));
    return tab ? tab.roles.includes(role) : false;
  }
  const item = NAV_ITEMS.find((nav) =>
    nav.to === "/" ? normalized === "/" : normalized === nav.to || normalized.startsWith(`${nav.to}/`),
  );
  if (!item) return role === "owner";
  return item.roles.includes(role);
}

export function workforceTabsFor(role: AppRole): NavItemConfig[] {
  return WORKFORCE_TABS.filter((item) => item.roles.includes(role));
}

export function navItemsFor(role: AppRole): NavItemConfig[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function defaultPathFor(role: AppRole): string {
  return navItemsFor(role)[0]?.to ?? "/";
}
