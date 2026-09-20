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
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import { chartPalette, costBreakdown, financials } from "../data/mockData";
import type { Kpi } from "../data/mockData";

const tooltipStyle = {
  backgroundColor: "#0f1626",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#e2e8f0",
};

const kpis: Kpi[] = [
  { label: "MTD Revenue", value: "$2.38M", delta: "+6.3%", trend: "up", hint: "vs. last month" },
  { label: "MTD Cost", value: "$1.74M", delta: "+2.9%", trend: "down", hint: "vs. last month" },
  { label: "Operating Margin", value: "26.9%", delta: "+1.8pp", trend: "up" },
  { label: "Cost / Package", value: "$3.41", delta: "-2.1%", trend: "up" },
];

export default function Financial() {
  return (
    <div>
      <PageHeader
        title="Financial Dashboard"
        description="Revenue, cost structure, and margin trends for the operation."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Revenue vs. Cost"
          subtitle="$M per month"
          className="lg:col-span-2 h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financials} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Legend />
              <Bar dataKey="revenue" fill="#ff9900" radius={[4, 4, 0, 0]} name="Revenue ($M)" />
              <Bar dataKey="cost" fill="#146eb4" radius={[4, 4, 0, 0]} name="Cost ($M)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cost Breakdown" subtitle="% of total spend" className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={costBreakdown}
                dataKey="value"
                nameKey="name"
                outerRadius={95}
                label={(entry) => `${entry.value}%`}
              >
                {costBreakdown.map((_, i) => (
                  <Cell key={i} fill={chartPalette[i % chartPalette.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
