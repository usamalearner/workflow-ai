"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/types";

export function ProductivityChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="saved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(199 89% 52%)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(199 89% 52%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "hsl(215 20% 60%)" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "hsl(215 20% 60%)" }}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(222 44% 8%)",
            border: "1px solid hsl(217 33% 17%)",
            borderRadius: 10,
            fontSize: 12,
          }}
          labelStyle={{ color: "hsl(210 40% 96%)" }}
          formatter={(v: number) => [`${v} hrs`, "Time saved"]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="hsl(199 89% 52%)"
          strokeWidth={2}
          fill="url(#saved)"
          animationDuration={900}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
