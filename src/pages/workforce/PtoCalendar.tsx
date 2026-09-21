import ChartCard from "../../components/ChartCard";
import StatCard from "../../components/StatCard";
import { useData } from "../../lib/data";
import { buildPtoCalendar } from "../../lib/workforce";
import { cn } from "../../lib/cn";
import { ptoClass } from "../../lib/statusStyles";

export default function PtoCalendar() {
  const { filtered } = useData();
  const view = buildPtoCalendar(filtered);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {view.kpis.map((kpi) => (
          <StatCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <ChartCard title={view.monthLabel} subtitle="Approved, taken, and pending PTO · Monday start" className="mt-4">
        <div className="grid grid-cols-7 gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="px-2 py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {view.cells.map((cell) => (
            <div
              key={cell.date}
              className={cn(
                "min-h-[108px] rounded-lg border p-2",
                cell.inMonth
                  ? "border-slate-200 bg-white dark:border-white/10 dark:bg-ink-900/40"
                  : "border-transparent bg-slate-50 text-slate-400 dark:bg-white/[0.02]",
                cell.isToday && "ring-1 ring-brand-orange/70",
                cell.coverageRisk && "border-rose-300 dark:border-rose-500/40",
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("text-xs tabular-nums", cell.isToday ? "font-semibold text-brand-orange" : "")}>
                  {cell.date.slice(8)}
                </span>
                {cell.coverageRisk && <span className="badge badge-danger">Risk</span>}
              </div>
              <ul className="mt-1 space-y-1">
                {cell.entries.slice(0, 3).map((entry) => (
                  <li key={`${entry.id}-${cell.date}`} className="truncate text-[11px] text-slate-700 dark:text-slate-300">
                    <span className={cn("badge mr-1 capitalize", ptoClass[entry.status])}>{entry.pto_type}</span>
                    {entry.driverName.split(" ")[0]}
                  </li>
                ))}
                {cell.entries.length > 3 && (
                  <li className="text-[11px] text-slate-500">+{cell.entries.length - 3} more</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </ChartCard>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card overflow-x-auto">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Pending review</h3>
            <p className="text-xs text-slate-500">Ops needs to approve or deny before launch plans lock</p>
          </div>
          <RequestTable rows={view.requests.filter((row) => row.status === "pending")} empty="No pending PTO." />
        </div>
        <div className="card overflow-x-auto">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Upcoming / on the board</h3>
            <p className="text-xs text-slate-500">Approved and taken requests that still overlap the horizon</p>
          </div>
          <RequestTable rows={view.upcoming.map((row) => ({
            ...row,
            driverName: view.requests.find((item) => item.id === row.id)?.driverName ?? row.driver_id,
            stationCode: view.requests.find((item) => item.id === row.id)?.stationCode ?? "",
          }))} empty="No upcoming PTO." />
        </div>
      </div>
    </div>
  );
}

function RequestTable({
  rows,
  empty,
}: {
  rows: Array<{
    id: string;
    driverName: string;
    stationCode: string;
    pto_type: string;
    status: "pending" | "approved" | "denied" | "taken";
    start_date: string;
    end_date: string;
    hours: number;
    notes: string;
  }>;
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="px-5 py-6 text-sm text-slate-500">{empty}</p>;
  }
  return (
    <table className="w-full min-w-[480px] text-left text-sm">
      <thead className="text-xs uppercase tracking-wide text-slate-500">
        <tr>
          <th className="px-5 py-2 font-medium">Driver</th>
          <th className="px-3 py-2 font-medium">Type</th>
          <th className="px-3 py-2 font-medium">Dates</th>
          <th className="px-5 py-2 font-medium">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">
            <td className="px-5 py-3">
              <p className="font-medium text-slate-900 dark:text-white">{row.driverName}</p>
              <p className="text-xs text-slate-500">
                {row.stationCode} · {row.hours}h · {row.notes}
              </p>
            </td>
            <td className="px-3 py-3 capitalize">{row.pto_type}</td>
            <td className="px-3 py-3 text-xs">
              {row.start_date} → {row.end_date}
            </td>
            <td className="px-5 py-3">
              <span className={cn("badge capitalize", ptoClass[row.status])}>{row.status}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
