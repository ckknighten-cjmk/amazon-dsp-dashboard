import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import { useData } from "../lib/data";
import { buildSafety } from "../lib/aggregations";
import { useChartStyles } from "../lib/chart";
import { cn } from "../lib/cn";
import { inspectionClass, severityClass } from "../lib/statusStyles";
import { formatPct } from "../lib/format";

export default function SafetyCompliance() {
  const { filtered } = useData();
  const view = buildSafety(filtered);
  const chart = useChartStyles();

  return (
    <div>
      <PageHeader
        title="Safety & Compliance"
        description="Vehicle inspections, speeding, seatbelt compliance, and incident tracking."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {view.kpis.map((kpi) => (
          <StatCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Events by type" subtitle="Trailing period" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={view.byType} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis dataKey="type" stroke={chart.axis} fontSize={11} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis stroke={chart.axis} fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={chart.tooltip} cursor={{ fill: chart.cursor }} />
              <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Events" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Incidents vs. Mentor events" subtitle="Weekly" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={view.weekly} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis dataKey="week" stroke={chart.axis} fontSize={12} />
              <YAxis stroke={chart.axis} fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={chart.tooltip} cursor={{ fill: chart.cursor }} />
              <Legend />
              <Bar dataKey="incidents" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Incidents" />
              <Bar dataKey="events" fill="#146eb4" radius={[4, 4, 0, 0]} name="Safety events" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card overflow-x-auto">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Vehicle inspections</h3>
            <p className="text-xs text-slate-500">Pre-trip results · seatbelt network {formatPct(view.seatbeltPct)}</p>
          </div>
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Van</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-5 py-2 font-medium">Defects</th>
              </tr>
            </thead>
            <tbody>
              {view.inspections.map((row) => {
                const vehicle = filtered.vehicles.find((v) => v.id === row.vehicle_id);
                const driver = filtered.drivers.find((d) => d.id === row.driver_id);
                return (
                  <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{vehicle?.van_id}</p>
                      <p className="text-xs text-slate-500">{driver?.full_name}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("badge capitalize", inspectionClass[row.status])}>{row.status}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{row.defects.length ? row.defects.join(", ") : "None"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card overflow-x-auto">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Speeding events</h3>
            <p className="text-xs text-slate-500">Posted vs. observed</p>
          </div>
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Driver</th>
                <th className="px-3 py-2 font-medium">Speed</th>
                <th className="px-3 py-2 font-medium">Limit</th>
                <th className="px-5 py-2 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody>
              {view.speeding.map((event) => {
                const driver = filtered.drivers.find((d) => d.id === event.driver_id);
                return (
                  <tr key={event.id} className="border-t border-slate-200 dark:border-white/5">
                    <td className="px-5 py-3">{driver?.full_name}</td>
                    <td className="px-3 py-3 tabular-nums">{event.speed_mph} mph</td>
                    <td className="px-3 py-3 tabular-nums">{event.speed_limit_mph}</td>
                    <td className="px-5 py-3">
                      <span className={cn("badge capitalize", severityClass[event.severity])}>{event.severity}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Incident tracking</h3>
          <p className="text-xs text-slate-500">Collisions, property, injury, cargo, yard</p>
        </div>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Severity</th>
              <th className="px-3 py-2 font-medium">Description</th>
              <th className="px-5 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {view.incidents.map((incident) => (
              <tr key={incident.id} className="border-t border-slate-200 dark:border-white/5">
                <td className="px-5 py-3 whitespace-nowrap">{incident.occurred_at.replace("T", " ").slice(0, 16)}</td>
                <td className="px-3 py-3 capitalize">{incident.category}</td>
                <td className="px-3 py-3">
                  <span className={cn("badge capitalize", severityClass[incident.severity])}>{incident.severity}</span>
                </td>
                <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{incident.description}</td>
                <td className="px-5 py-3 capitalize">{incident.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
