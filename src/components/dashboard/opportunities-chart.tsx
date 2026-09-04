"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDateShort } from "@/lib/utils";

interface OpportunitiesChartProps {
  data: { date: string; count: number }[];
}

interface TooltipPayloadItem {
  value: number;
  payload: { date: string; count: number };
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-ink-100 bg-white px-3 py-2 shadow-popover">
      <p className="text-xs font-medium text-ink-400">{formatDateShort(point.date)}</p>
      <p className="text-sm font-semibold text-ink-900">{point.count} oportunidades</p>
    </div>
  );
}

export function OpportunitiesChart({ data }: OpportunitiesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="opportunitiesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5b63f0" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#5b63f0" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#eeeef0" strokeDasharray="4 4" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateShort}
          tick={{ fontSize: 11, fill: "#8b8b9a" }}
          axisLine={false}
          tickLine={false}
          minTickGap={28}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#8b8b9a" }}
          axisLine={false}
          tickLine={false}
          width={28}
          allowDecimals={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#c3caff", strokeDasharray: 4 }} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#4640d6"
          strokeWidth={2.25}
          fill="url(#opportunitiesGradient)"
          activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2 }}
          animationDuration={900}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
