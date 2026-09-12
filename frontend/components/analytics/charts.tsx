"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/types";

const AXIS = { fontSize: 11, fill: "hsl(215 20% 60%)" };
const TOOLTIP = {
  contentStyle: {
    background: "hsl(222 44% 8%)",
    border: "1px solid hsl(217 33% 17%)",
    borderRadius: 10,
    fontSize: 12,
  },
  labelStyle: { color: "hsl(210 40% 96%)" },
};
const PRIORITY_COLORS = [
  "hsl(215 16% 50%)",
  "hsl(199 89% 52%)",
  "hsl(38 92% 55%)",
  "hsl(0 72% 55%)",
];

export function LineTrend({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 15%)" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} />
        <YAxis tickLine={false} axisLine={false} tick={AXIS} width={36} />
        <Tooltip {...TOOLTIP} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="hsl(199 89% 52%)"
          strokeWidth={2}
          dot={{ r: 3, fill: "hsl(199 89% 52%)" }}
          animationDuration={900}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PriorityBars({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 15%)" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} />
        <YAxis tickLine={false} axisLine={false} tick={AXIS} width={36} allowDecimals={false} />
        <Tooltip {...TOOLTIP} cursor={{ fill: "hsl(217 33% 12%)" }} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={800}>
          {data.map((_, i) => (
            <Cell key={i} fill={PRIORITY_COLORS[i % PRIORITY_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AreaTrend({
  data,
  unit = "",
}: {
  data: TrendPoint[];
  unit?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(186 94% 44%)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(186 94% 44%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 15%)" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} />
        <YAxis tickLine={false} axisLine={false} tick={AXIS} width={36} />
        <Tooltip {...TOOLTIP} formatter={(v: number) => [`${v}${unit}`, "Value"]} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="hsl(186 94% 44%)"
          strokeWidth={2}
          fill="url(#areaFill)"
          animationDuration={900}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
