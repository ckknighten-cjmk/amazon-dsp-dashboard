import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/scorecard", label: "Dashboard", end: true },
  { to: "/scorecard/drivers", label: "Driver Impact", end: false },
  { to: "/scorecard/routes", label: "Route Impact", end: false },
  { to: "/scorecard/recommendations", label: "AI Recommendations", end: false },
  { to: "/scorecard/forecast", label: "Forecasting", end: false },
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
              `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-orange/15 text-brand-orange"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              }`
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
