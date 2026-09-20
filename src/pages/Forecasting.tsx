import {
  Area,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../components/PageHeader";
import ChartCard from "../components/ChartCard";
import { forecast } from "../data/mockData";

const tooltipStyle = {
  backgroundColor: "#0f1626",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#e2e8f0",
};

export default function Forecasting() {
  const band = forecast.map((d) => ({ ...d, range: [d.lower, d.upper] as [number, number] }));

  return (
    <div>
      <PageHeader
        title="Forecasting"
        description="Projected delivery volume with confidence bands for capacity planning."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="stat-label">Next 7d Forecast</p>
          <p className="mt-2 text-3xl font-semibold text-white">134.6K</p>
          <p className="mt-1 text-xs text-slate-500">packages</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">Peak Day</p>
          <p className="mt-2 text-3xl font-semibold text-brand-orange">Sat</p>
          <p className="mt-1 text-xs text-slate-500">~21,200 packages</p>
        </div>
        <div className="card p-5">
          <p className="stat-label">Model Confidence</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-400">92%</p>
          <p className="mt-1 text-xs text-slate-500">MAPE 4.8%</p>
        </div>
      </div>

      <div className="mt-4">
        <ChartCard
          title="Volume Forecast"
          subtitle="Actuals, forecast, and 90% confidence band"
          className="h-96"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={band} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#146eb4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#146eb4" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} domain={[16000, 23000]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Area
                type="monotone"
                dataKey="range"
                stroke="none"
                fill="url(#band)"
                name="90% CI"
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#ff9900"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
                name="Actual"
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#00a8b5"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Forecast"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
