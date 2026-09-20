import { NavLink, Outlet } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  DollarSign,
  LayoutDashboard,
  TrendingUp,
  Truck,
} from "lucide-react";
import type { ComponentType } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { to: "/", label: "Executive Dashboard", icon: LayoutDashboard },
  { to: "/operations", label: "Live Operations", icon: Activity },
  { to: "/drivers", label: "Driver Performance", icon: Truck },
  { to: "/financial", label: "Financial", icon: DollarSign },
  { to: "/safety", label: "Safety & Compliance", icon: AlertTriangle },
  { to: "/forecasting", label: "Forecasting", icon: TrendingUp },
];

export default function Layout() {
  return (
    <div className="flex h-full">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-ink-900/60 md:flex">
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-orange/15 text-brand-orange">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-white">DSP Command</p>
            <p className="text-xs text-slate-500">Operations Center</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-blue/20 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 text-xs text-slate-600">
          <p>Region: US-West</p>
          <p className="mt-1">Synthetic demo data</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/5 bg-ink-900/40 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-sm text-slate-300">Live · All systems operational</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 sm:inline">Shift Lead</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue/30 text-sm font-semibold text-white">
              SL
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
