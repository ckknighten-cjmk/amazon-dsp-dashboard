import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  TrendingUp,
  Truck,
  X,
} from "lucide-react";
import type { ComponentType } from "react";
import { useAuth } from "../lib/auth";
import { useData } from "../lib/data";
import { navItemsFor, ROLE_LABELS } from "../lib/rbac";
import { cn } from "../lib/cn";
import { TODAY } from "../data/seed";
import { formatDate } from "../lib/format";
import ThemeToggle from "./ThemeToggle";

const icons: Record<string, ComponentType<{ className?: string }>> = {
  "/": LayoutDashboard,
  "/operations": Activity,
  "/drivers": Truck,
  "/financial": DollarSign,
  "/safety": AlertTriangle,
  "/forecasting": TrendingUp,
};

export default function Layout() {
  const { user, logout, demoMode } = useAuth();
  const { db, stationId, setStationId, source } = useData();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  const items = navItemsFor(user.role);

  const nav = (
    <nav className="flex-1 space-y-1 px-3 py-2">
      {items.map(({ to, label }) => {
        const Icon = icons[to] ?? LayoutDashboard;
        return (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-blue/15 text-slate-900 dark:bg-brand-blue/20 dark:text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white",
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-full">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white/80 dark:border-white/5 dark:bg-ink-900/60 md:flex">
        <Brand />
        {nav}
        <div className="px-6 py-4 text-xs text-slate-500">
          <p>Operating day {formatDate(TODAY)}</p>
          <p className="mt-1">{source === "supabase" ? "Supabase connected" : "Synthetic demo data"}</p>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button className="absolute inset-0 bg-slate-900/50" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative z-50 flex h-full w-72 flex-col bg-white dark:bg-ink-900">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button
                type="button"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 dark:border-white/5 dark:bg-ink-900/40 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 md:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="truncate text-sm text-slate-600 dark:text-slate-300">Live · Command Center</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {user.role !== "driver" && (
              <label className="hidden sm:block">
                <span className="sr-only">Station</span>
                <select
                  value={stationId}
                  onChange={(event) => setStationId(event.target.value as "all" | string)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 dark:border-white/10 dark:bg-ink-800 dark:text-slate-200"
                >
                  <option value="all">All stations</option>
                  {db.stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.code} · {station.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {demoMode && (
              <span className="hidden rounded-full bg-brand-orange/15 px-2.5 py-1 text-[11px] font-medium text-brand-orange lg:inline">
                Demo
              </span>
            )}
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{user.fullName}</p>
              <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue/20 text-sm font-semibold text-brand-blue dark:text-white">
              {user.initials}
            </div>
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-6 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-orange/15 text-brand-orange">
        <Truck className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold leading-tight text-slate-900 dark:text-white">DSP Command</p>
        <p className="text-xs text-slate-500">Operations Center</p>
      </div>
    </div>
  );
}
