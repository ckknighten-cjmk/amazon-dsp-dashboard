import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import ChartCard from "../components/ChartCard";
import { useData } from "../lib/data";
import { buildFleetReadiness } from "../lib/fleetReadiness";
import { useChartStyles } from "../lib/chart";
import { cn } from "../lib/cn";
import { chartPalette } from "../data/seed";
import { formatDate, formatNumber, formatUsd } from "../lib/format";
import { workOrderPriorityClass, workOrderStatusClass } from "../lib/statusStyles";

export default function FleetMaintenance() {
  const { filtered } = useData();
  const view = buildFleetReadiness(filtered);
  const chart = useChartStyles();

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5">
          <p className="stat-label">Open work orders</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{view.openWorkOrders.length}</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">PM overdue / due</p>
          <p className="mt-2 text-3xl font-semibold text-amber-600 dark:text-amber-400">
            {view.pmSchedule.filter((row) => row.pmOverdue || row.milesRemaining <= 750).length}
          </p>
        </div>
        <div className="card p-5">
          <p className="stat-label">Downtime hours</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{formatNumber(view.downtimeHours, 1)}h</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">MTD repair cost</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{formatUsd(view.repairTotal)}</p>
        </div>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Preventive maintenance schedule</h3>
          <p className="text-xs text-slate-500">Next service miles, due date, and open PM work orders</p>
        </div>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Van</th>
              <th className="px-3 py-2 font-medium">Odometer</th>
              <th className="px-3 py-2 font-medium">Next PM</th>
              <th className="px-3 py-2 font-medium">Miles left</th>
              <th className="px-3 py-2 font-medium">Due</th>
              <th className="px-5 py-2 font-medium">Work order</th>
            </tr>
          </thead>
          <tbody>
            {view.pmSchedule.map((row) => (
              <tr key={row.id} className="border-t border-slate-200 dark:border-white/5">
                <td className="px-5 py-3">
                  <Link to={`/fleet/vehicles/${row.id}`} className="font-medium text-slate-900 hover:text-brand-blue dark:text-white">
                    {row.van_id}
                  </Link>
                  <p className="text-xs text-slate-500">{row.stationCode}</p>
                </td>
                <td className="px-3 py-3 tabular-nums">{formatNumber(row.odometer_miles)} mi</td>
                <td className="px-3 py-3 tabular-nums">{formatNumber(row.next_service_miles)} mi</td>
                <td className="px-3 py-3 tabular-nums">
                  <span className={cn(row.milesRemaining <= 750 && "text-amber-600 dark:text-amber-400")}>
                    {formatNumber(row.milesRemaining)} mi
                  </span>
                </td>
                <td className="px-3 py-3">{formatDate(row.dueDate)}</td>
                <td className="px-5 py-3 text-slate-500">{row.pmWorkOrder ?? "Cadence only"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card overflow-x-auto">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Open work orders</h3>
            <p className="text-xs text-slate-500">Priority, shop, and due date</p>
          </div>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">WO</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {view.openWorkOrders.map((order) => {
                const van = view.rows.find((row) => row.id === order.vehicle_id);
                return (
                  <tr key={order.id} className="border-t border-slate-200 dark:border-white/5">
                    <td className="px-5 py-3">
                      <Link to={`/fleet/vehicles/${order.vehicle_id}`} className="font-medium text-slate-900 hover:text-brand-blue dark:text-white">
                        {order.wo_number}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {van?.van_id} · due {formatDate(order.due_at)}
                      </p>
                    </td>
                    <td className="px-3 py-3 capitalize">{order.type}</td>
                    <td className="px-3 py-3">
                      <span className={cn("badge capitalize", workOrderPriorityClass[order.priority])}>{order.priority}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn("badge capitalize", workOrderStatusClass[order.status])}>{order.status.replace("_", " ")}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card overflow-x-auto">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-white/5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Repair history</h3>
            <p className="text-xs text-slate-500">Closed work orders</p>
          </div>
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2 font-medium">WO</th>
                <th className="px-3 py-2 font-medium">Shop</th>
                <th className="px-3 py-2 font-medium">Hours</th>
                <th className="px-5 py-2 font-medium">Closed</th>
              </tr>
            </thead>
            <tbody>
              {view.repairHistory.map((order) => {
                const van = view.rows.find((row) => row.id === order.vehicle_id);
                return (
                  <tr key={order.id} className="border-t border-slate-200 dark:border-white/5">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{order.wo_number}</p>
                      <p className="text-xs text-slate-500">
                        {van?.van_id} · {order.title}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-slate-500">{order.shop}</td>
                    <td className="px-3 py-3 tabular-nums">{order.actual_hours ?? order.estimated_hours}h</td>
                    <td className="px-5 py-3">{order.completed_at ? formatDate(order.completed_at) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Repair costs" subtitle="MTD by category" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={view.costByCategory} dataKey="value" nameKey="name" outerRadius={90} label={(entry) => formatUsd(Number(entry.value))}>
                {view.costByCategory.map((_, index) => (
                  <Cell key={index} fill={chartPalette[index % chartPalette.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={chart.tooltip} formatter={(value) => formatUsd(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Vehicle downtime" subtitle="Hours by reason" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={view.downtimeByReason} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis dataKey="name" stroke={chart.axis} fontSize={12} />
              <YAxis stroke={chart.axis} fontSize={12} />
              <Tooltip contentStyle={chart.tooltip} cursor={{ fill: chart.cursor }} />
              <Legend />
              <Bar dataKey="hours" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Hours" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
