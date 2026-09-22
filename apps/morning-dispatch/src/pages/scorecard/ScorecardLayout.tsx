import { NavLink, Outlet } from "react-router-dom";
import { cn } from "../../lib/cn";

const tabs = [
  { to: "/scorecard", label: "Dashboard", end: true },
  { to: "/scorecard/stations", label: "Stations" },
  { to: "/scorecard/drivers", label: "Driver Impact" },
  { to: "/scorecard/routes", label: "Route Impact" },
  { to: "/scorecard/recommendations", label: "AI Recommendations" },
  { to: "/scorecard/forecast", label: "Forecasting" },
];

export default function ScorecardLayout() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-blue/15 text-slate-900 dark:bg-brand-blue/25 dark:text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white",
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
