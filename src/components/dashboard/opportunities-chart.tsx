"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDateShort, formatNumber } from "@/lib/utils";

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
    <div className="overflow-hidden rounded-lg border border-ink-100 bg-white shadow-popover">
      <div className="h-1 bg-brand-500" />
      <div className="px-3 py-2">
        <p className="text-xs font-medium text-ink-400">{formatDateShort(point.date)}</p>
        <p className="text-sm font-semibold text-ink-900">{point.count} oportunidades</p>
      </div>
    </div>
  );
}

export function OpportunitiesChart({ data }: OpportunitiesChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs text-ink-500">
        <span className="h-2 w-2 rounded-full bg-brand-500" />
        Oportunidades
        <span className="ml-auto tabular-nums text-ink-400">{formatNumber(total)} en total</span>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="opportunitiesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f4611a" stopOpacity={0.4} />
              <stop offset="45%" stopColor="#f4611a" stopOpacity={0.14} />
              <stop offset="100%" stopColor="#f4611a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#232833" strokeDasharray="4 4" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateShort}
            tick={{ fontSize: 11, fill: "#747c89" }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#747c89" }}
            axisLine={false}
            tickLine={false}
            width={28}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#363c4a", strokeDasharray: 4 }} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#ff7a35"
            strokeWidth={2.25}
            fill="url(#opportunitiesGradient)"
            activeDot={{ r: 5, stroke: "#12151c", strokeWidth: 2 }}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
