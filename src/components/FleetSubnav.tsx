import { NavLink } from "react-router-dom";
import { cn } from "../lib/cn";

const items = [
  { to: "/fleet", label: "Dashboard", end: true },
  { to: "/fleet/dispatch", label: "Dispatch board" },
  { to: "/fleet/maintenance", label: "Maintenance" },
  { to: "/fleet/kpis", label: "Fleet KPIs" },
];

export default function FleetSubnav() {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-blue/15 text-slate-900 dark:bg-brand-blue/25 dark:text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white",
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}
