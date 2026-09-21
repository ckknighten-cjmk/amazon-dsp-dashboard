import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, Truck } from "lucide-react";
import { DEMO_USERS } from "../data/seed";
import { useAuth } from "../lib/auth";
import { defaultPathFor, ROLE_LABELS } from "../lib/rbac";
import { cn } from "../lib/cn";

export default function Login() {
  const { user, login, loading, error, demoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("owner@dsp.local");
  const [password, setPassword] = useState("demo");
  const [localError, setLocalError] = useState<string | null>(null);

  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from !== "/login" ? from : defaultPathFor(user.role)} replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLocalError(null);
    try {
      const session = await login(email, password);
      navigate(defaultPathFor(session.role));
    } catch {
      setLocalError("Sign-in failed. Check the demo credentials or your Supabase user.");
    }
  }

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <section className="relative hidden flex-1 overflow-hidden bg-ink-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,153,0,0.18),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(20,110,180,0.25),transparent_40%)]" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange/20 text-brand-orange">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">Amazon DSP</p>
              <p className="text-xs text-slate-400">Operations Command Center</p>
            </div>
          </div>
          <h1 className="mt-16 max-w-md text-4xl font-semibold tracking-tight">
            Run the station like an executive operations floor.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-400">
            Live routes, scorecards, labor, safety, and staffing forecasts — with role-based access for owners,
            dispatch, safety, finance, and drivers.
          </p>
        </div>
        <ul className="relative grid max-w-md gap-3 text-sm text-slate-300">
          <li>Network DCR, attendance, and Amazon scorecard KPIs</li>
          <li>Rescue board, failed deliveries, and station pacing</li>
          <li>P&L: revenue, overtime, fuel, and vehicle cost</li>
        </ul>
      </section>

      <section className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-10 dark:bg-ink-950">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange/15 text-brand-orange">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">DSP Command</p>
                <p className="text-xs text-slate-500">Operations Center</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">
            {demoMode ? "Demo mode — use any preset role below. Password is demo." : "Use your Supabase credentials."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 block text-slate-600 dark:text-slate-300">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-brand-orange/40 focus:ring-2 dark:border-white/10 dark:bg-ink-900 dark:text-white"
                autoComplete="username"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-slate-600 dark:text-slate-300">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-brand-orange/40 focus:ring-2 dark:border-white/10 dark:bg-ink-900 dark:text-white"
                autoComplete="current-password"
                required
              />
            </label>
            {(localError || error) && (
              <p className="text-sm text-rose-500">{localError || error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-orange px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-orange-400 disabled:opacity-60"
            >
              <ShieldCheck className="h-4 w-4" />
              {loading ? "Signing in…" : "Enter command center"}
            </button>
          </form>

          {demoMode && (
            <div className="mt-8">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Demo roles</p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {DEMO_USERS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword(account.password);
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left transition",
                      email === account.email
                        ? "border-brand-orange/50 bg-brand-orange/10"
                        : "border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20",
                    )}
                  >
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{ROLE_LABELS[account.role]}</p>
                    <p className="text-xs text-slate-500">{account.email}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
