import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../components/PageHeader";
import ChartCard from "../components/ChartCard";
import { useData } from "../lib/data";
import { buildDriverPerformance } from "../lib/aggregations";
import { useChartStyles } from "../lib/chart";
import { formatPct } from "../lib/format";
import { cn } from "../lib/cn";
import { attendanceClass, driverStatusClass, driverStatusLabel, severityClass } from "../lib/statusStyles";
import { useAuth } from "../lib/auth";

export default function DriverPerformance() {
  const { filtered } = useData();
  const { user } = useAuth();
  const view = buildDriverPerformance(filtered);
  const chart = useChartStyles();
  const selfOnly = user?.role === "driver";

  return (
    <div>
      <PageHeader
        title={selfOnly ? "My scorecard" : "Driver Performance"}
        description="Scorecards, rankings, coaching recommendations, safety events, and attendance."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="On-time % by driver" subtitle="Current operating week" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={view.ranked} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis type="number" domain={[85, 100]} stroke={chart.axis} fontSize={12} />
              <YAxis type="category" dataKey="full_name" stroke={chart.axis} fontSize={11} width={110} />
              <Tooltip contentStyle={chart.tooltip} cursor={{ fill: chart.cursor }} />
              <Bar dataKey="on_time_pct" fill="#ff9900" radius={[0, 4, 4, 0]} name="On-Time %" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Rankings</h3>
            <p className="text-xs text-slate-500">Composite of DCR, safety, attendance, on-time</p>
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white text-xs uppercase tracking-wide text-slate-500 dark:bg-ink-900">
                <tr>
                  <th className="px-5 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Driver</th>
                  <th className="px-3 py-2 font-medium">DCR</th>
                  <th className="px-3 py-2 font-medium">Safety</th>
                  <th className="px-5 py-2 font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {view.ranked.map((driver, index) => (
                  <tr key={driver.id} className="border-t border-slate-200 dark:border-white/5">
                    <td className="px-5 py-2 text-slate-500">{index + 1}</td>
                    <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{driver.full_name}</td>
                    <td className="px-3 py-2 tabular-nums">{formatPct(driver.dcr)}</td>
                    <td className="px-3 py-2 tabular-nums">{driver.safety_score}</td>
                    <td className="px-5 py-2 tabular-nums text-emerald-600 dark:text-emerald-400">
                      {driver.composite.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Driver scorecards</h3>
          <p className="text-xs text-slate-500">FICO, DCR, DPMO, seatbelt, attendance</p>
        </div>
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Driver</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">FICO</th>
              <th className="px-3 py-2 font-medium">DCR</th>
              <th className="px-3 py-2 font-medium">On-time</th>
              <th className="px-3 py-2 font-medium">DPMO</th>
              <th className="px-3 py-2 font-medium">Seatbelt</th>
              <th className="px-5 py-2 font-medium">Attendance</th>
            </tr>
          </thead>
          <tbody>
            {view.ranked.map((driver) => (
              <tr key={driver.id} className="border-t border-slate-200 dark:border-white/5">
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-900 dark:text-white">{driver.full_name}</p>
                  <p className="text-xs text-slate-500">{driver.employee_code}</p>
                </td>
                <td className="px-3 py-3">
                  <span className={cn("badge", driverStatusClass[driver.status])}>{driverStatusLabel[driver.status]}</span>
                </td>
                <td className="px-3 py-3 tabular-nums">{driver.fico_score}</td>
                <td className="px-3 py-3 tabular-nums">{formatPct(driver.dcr)}</td>
                <td className="px-3 py-3 tabular-nums">{formatPct(driver.on_time_pct)}</td>
                <td className="px-3 py-3 tabular-nums">{driver.dpmo}</td>
                <td className="px-3 py-3 tabular-nums">{formatPct(driver.seatbelt_pct)}</td>
                <td className="px-5 py-3 tabular-nums">{formatPct(driver.attendance_pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Coaching recommendations</h3>
            <p className="text-xs text-slate-500">Open actions from quality, safety, and reliability</p>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-white/5">
            {view.coaching.map((item) => {
              const driver = view.ranked.find((d) => d.id === item.driver_id);
              return (
                <li key={item.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {driver?.full_name ?? item.driver_id} · {item.category}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.recommendation}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.metric}</p>
                    </div>
                    <span
                      className={cn(
                        "badge",
                        item.completed_at ? "badge-success" : item.priority === "high" ? "badge-danger" : item.priority === "medium" ? "badge-warning" : "badge-info",
                      )}
                    >
                      {item.completed_at ? "Done" : item.priority}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card overflow-x-auto">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Safety events</h3>
            <p className="text-xs text-slate-500">Speeding, seatbelt, distraction, and following distance</p>
          </div>
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">Driver</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Detail</th>
                <th className="px-5 py-2 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody>
              {view.safetyEvents.map((event) => {
                const driver = view.ranked.find((d) => d.id === event.driver_id) ?? filtered.drivers.find((d) => d.id === event.driver_id);
                return (
                  <tr key={event.id} className="border-t border-slate-200 dark:border-white/5">
                    <td className="px-5 py-3">{driver?.full_name ?? event.driver_id}</td>
                    <td className="px-3 py-3 capitalize">{event.event_type.replace(/_/g, " ")}</td>
                    <td className="px-3 py-3 text-slate-500">
                      {event.speed_mph ? `${event.speed_mph} in ${event.speed_limit_mph}` : event.notes}
                    </td>
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
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Attendance tracking</h3>
          <p className="text-xs text-slate-500">Current Amazon week</p>
        </div>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Driver</th>
              {view.weekDates.map((date) => (
                <th key={date} className="px-2 py-2 font-medium">
                  {date.slice(5)}
                </th>
              ))}
              <th className="px-5 py-2 font-medium">Reliability</th>
            </tr>
          </thead>
          <tbody>
            {view.attendanceSummary.map((row) => (
              <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">
                <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{row.name}</td>
                {row.days.map((day) => (
                  <td key={day.id} className="px-2 py-3">
                    <span className={cn("badge capitalize", attendanceClass[day.status])}>{day.status.replace("_", " ")}</span>
                  </td>
                ))}
                <td className="px-5 py-3 tabular-nums">{formatPct(row.pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
