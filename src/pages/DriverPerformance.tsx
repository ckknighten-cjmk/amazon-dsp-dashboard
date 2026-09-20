import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import PageHeader from "../components/PageHeader";
import ChartCard from "../components/ChartCard";
import { driverPerformance, drivers } from "../data/mockData";

const tooltipStyle = {
  backgroundColor: "#0f1626",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#e2e8f0",
};

export default function DriverPerformance() {
  const ranked = [...drivers].sort((a, b) => b.onTimePct - a.onTimePct);

  return (
    <div>
      <PageHeader
        title="Driver Performance"
        description="On-time delivery rates and defects-per-million-opportunities (DPMO) by driver."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="On-Time % by Driver" subtitle="Current shift" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={driverPerformance}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis type="number" domain={[85, 100]} stroke="#64748b" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={70} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="onTime" fill="#ff9900" radius={[0, 4, 4, 0]} name="On-Time %" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Quality vs. Reliability" subtitle="DPMO vs. on-time %" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                type="number"
                dataKey="onTime"
                name="On-Time %"
                domain={[88, 100]}
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis type="number" dataKey="dpmo" name="DPMO" stroke="#64748b" fontSize={12} />
              <ZAxis range={[120, 120]} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={driverPerformance} fill="#00a8b5" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="card mt-4 overflow-hidden">
        <div className="border-b border-white/5 px-5 py-4">
          <h3 className="text-sm font-semibold text-white">Leaderboard</h3>
          <p className="text-xs text-slate-500">Ranked by on-time rate</p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2 font-medium">Rank</th>
              <th className="px-3 py-2 font-medium">Driver</th>
              <th className="px-3 py-2 font-medium">Route</th>
              <th className="px-3 py-2 font-medium">Completion</th>
              <th className="px-5 py-2 font-medium">On-Time %</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((d, i) => (
              <tr key={d.id} className="border-t border-white/5">
                <td className="px-5 py-3 text-slate-400">#{i + 1}</td>
                <td className="px-3 py-3 font-medium text-white">{d.name}</td>
                <td className="px-3 py-3 text-slate-300">{d.route}</td>
                <td className="px-3 py-3 text-slate-300">
                  {Math.round((d.stopsCompleted / d.stopsTotal) * 100)}%
                </td>
                <td className="px-5 py-3 text-emerald-400">{d.onTimePct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
