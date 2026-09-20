import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../components/PageHeader";
import ChartCard from "../components/ChartCard";
import { drivers, liveRouteProgress } from "../data/mockData";
import type { DriverStatus } from "../data/mockData";

const tooltipStyle = {
  backgroundColor: "#0f1626",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#e2e8f0",
};

const statusStyles: Record<DriverStatus["status"], string> = {
  "On Road": "bg-emerald-500/15 text-emerald-400",
  "At Station": "bg-sky-500/15 text-sky-400",
  Break: "bg-amber-500/15 text-amber-400",
  Delayed: "bg-rose-500/15 text-rose-400",
};

export default function LiveOperations() {
  const onRoad = drivers.filter((d) => d.status === "On Road").length;
  const delayed = drivers.filter((d) => d.status === "Delayed").length;

  return (
    <div>
      <PageHeader
        title="Live Operations Center"
        description="Real-time route progress and driver telemetry across active routes."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5">
          <p className="stat-label">Active Drivers</p>
          <p className="mt-2 text-3xl font-semibold text-white">{drivers.length}</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">On Road</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-400">{onRoad}</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">Delayed</p>
          <p className="mt-2 text-3xl font-semibold text-rose-400">{delayed}</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">Network On-Time</p>
          <p className="mt-2 text-3xl font-semibold text-white">96.3%</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <ChartCard
          title="Cumulative Route Progress"
          subtitle="Planned vs. delivered by hour"
          className="xl:col-span-3 h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={liveRouteProgress} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="planned" stroke="#146eb4" strokeWidth={2} dot={false} name="Planned" />
              <Line type="monotone" dataKey="delivered" stroke="#ff9900" strokeWidth={2} dot={false} name="Delivered" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="card xl:col-span-2 overflow-hidden">
          <div className="border-b border-white/5 px-5 py-4">
            <h3 className="text-sm font-semibold text-white">Driver Board</h3>
            <p className="text-xs text-slate-500">Live status feed</p>
          </div>
          <div className="max-h-[16.5rem] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-ink-900 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Driver</th>
                  <th className="px-3 py-2 font-medium">Route</th>
                  <th className="px-3 py-2 font-medium">Stops</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d.id} className="border-t border-white/5">
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{d.name}</p>
                      <p className="text-xs text-slate-500">{d.id}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-300">{d.route}</td>
                    <td className="px-3 py-3 text-slate-300">
                      {d.stopsCompleted}/{d.stopsTotal}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[d.status]}`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
