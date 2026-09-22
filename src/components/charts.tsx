"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { routeStatusLabel } from "@/lib/format";
import type { RouteStatus } from "@/lib/types";

const STATUS_COLOR: Record<RouteStatus, string> = {
  not_started: "var(--muted-foreground)",
  no_progress: "var(--poor)",
  in_progress: "var(--great)",
  completed: "var(--fantastic)",
  rescued: "var(--fair)",
};

export function VolumeChart({
  data,
}: {
  data: { label: string; delivered: number; assigned: number }[];
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="assigned"
            name="Assigned"
            stroke="var(--muted-foreground)"
            fill="var(--muted)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="delivered"
            name="Delivered"
            stroke="var(--primary)"
            fill="color-mix(in oklch, var(--primary) 28%, transparent)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RouteStatusChart({
  data,
}: {
  data: { status: RouteStatus; count: number }[];
}) {
  const rows = data.map((d) => ({
    ...d,
    label: routeStatusLabel[d.status],
  }));
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="count" name="Routes" radius={[6, 6, 0, 0]}>
            {rows.map((row) => (
              <Cell key={row.status} fill={STATUS_COLOR[row.status]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
