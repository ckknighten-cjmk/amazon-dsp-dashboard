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
import ChartCard from "../../components/ChartCard";
import StatCard from "../../components/StatCard";
import { useData } from "../../lib/data";
import { buildAttendanceDashboard } from "../../lib/workforce";
import { useChartStyles } from "../../lib/chart";
import { formatPct } from "../../lib/format";
import { cn } from "../../lib/cn";
import { attendanceClass } from "../../lib/statusStyles";

export default function AttendanceDashboard() {
  const { filtered } = useData();
  const view = buildAttendanceDashboard(filtered);
  const chart = useChartStyles();

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {view.kpis.map((kpi) => (
          <StatCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <ChartCard title="Week mix" subtitle="Present, late, call-out, no-show, PTO" className="h-80 xl:col-span-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={view.trend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis dataKey="day" stroke={chart.axis} fontSize={12} />
              <YAxis stroke={chart.axis} fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={chart.tooltip} />
              <Legend />
              <Bar dataKey="present" stackId="a" fill="#10b981" name="Present" />
              <Bar dataKey="late" stackId="a" fill="#f59e0b" name="Late" />
              <Bar dataKey="pto" stackId="a" fill="#0ea5e9" name="PTO" />
              <Bar dataKey="call_out" stackId="a" fill="#f43f5e" name="Call-out" />
              <Bar dataKey="no_show" stackId="a" fill="#7f1d1d" name="No-show" />
              <Bar dataKey="absent" stackId="a" fill="#64748b" name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="card overflow-hidden xl:col-span-2">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Exceptions this week</h3>
            <p className="text-xs text-slate-500">Late, call-out, no-show, and today's PTO</p>
          </div>
          <ul className="max-h-80 divide-y divide-slate-200 overflow-auto dark:divide-white/5">
            {view.exceptions.length === 0 && (
              <li className="px-5 py-6 text-sm text-slate-500">No reliability exceptions in this filter.</li>
            )}
            {view.exceptions.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{row.driverName}</p>
                  <p className="text-xs text-slate-500">
                    {row.stationCode} · {row.service_date}
                  </p>
                </div>
                <span className={cn("badge capitalize", attendanceClass[row.status])}>{row.status.replace("_", " ")}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Roster reliability</h3>
          <p className="text-xs text-slate-500">Current Amazon week · call-outs and no-shows sort to the top</p>
        </div>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Driver</th>
              {view.weekDates.map((date) => (
                <th key={date} className="px-2 py-2 font-medium">
                  {date.slice(5)}
                </th>
              ))}
              <th className="px-3 py-2 font-medium">Missed</th>
              <th className="px-5 py-2 font-medium">Reliability</th>
            </tr>
          </thead>
          <tbody>
            {view.driverRows.map((row) => (
              <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-900 dark:text-white">{row.full_name}</p>
                  <p className="text-xs text-slate-500">
                    {row.stationCode} · {row.employee_code}
                  </p>
                </td>
                {row.days.map((day, index) => (
                  <td key={view.weekDates[index]} className="px-2 py-3">
                    {day ? (
                      <span className={cn("badge capitalize", attendanceClass[day.status])}>
                        {day.status.replace("_", " ")}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                ))}
                <td className="px-3 py-3 tabular-nums">{row.missed}</td>
                <td className="px-5 py-3 tabular-nums">{formatPct(row.attendance_pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
