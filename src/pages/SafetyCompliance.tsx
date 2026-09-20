import { CheckCircle2, AlertTriangle } from "lucide-react";
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
import ChartCard from "../components/ChartCard";
import { complianceItems, safetyIncidents } from "../data/mockData";

const tooltipStyle = {
  backgroundColor: "#0f1626",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#e2e8f0",
};

export default function SafetyCompliance() {
  return (
    <div>
      <PageHeader
        title="Safety & Compliance"
        description="Incident tracking, near-miss reporting, and regulatory compliance status."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {complianceItems.map((item) => (
          <div key={item.label} className="card flex items-center gap-4 p-5">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                item.status === "ok"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-amber-500/15 text-amber-400"
              }`}
            >
              {item.status === "ok" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-xl font-semibold text-white">{item.value}</p>
              <p className="text-xs text-slate-400">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <ChartCard
          title="Incidents & Near-Misses"
          subtitle="Trailing 6 weeks"
          className="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={safetyIncidents} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Legend />
              <Bar dataKey="incidents" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Incidents" />
              <Bar dataKey="nearMiss" fill="#146eb4" radius={[4, 4, 0, 0]} name="Near-Misses" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
