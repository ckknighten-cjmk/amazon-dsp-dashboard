import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../lib/auth";
import { cn } from "../../lib/cn";
import { workforceTabsFor } from "../../lib/rbac";

export default function WorkforceLayout() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return null;

  const tabs = workforceTabsFor(user.role);
  const home = tabs[0]?.to ?? "/";
  const onTab = tabs.some((tab) => location.pathname === tab.to);

  if (location.pathname === "/workforce" || !onTab) {
    return <Navigate to={home} replace />;
  }

  return (
    <div>
      <PageHeader
        title="Workforce Management Center"
        description="Attendance, PTO, call-outs, no-shows, open routes, staffing shortages, recruiting, interviews, training, and driver onboarding / offboarding."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
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
