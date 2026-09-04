"use client";

import { useEffect, useState } from "react";
import type { TrafficSource } from "@/lib/types";
import { TRAFFIC_SOURCE_LABELS } from "@/lib/types";
import { formatNumber, formatPercent } from "@/lib/utils";

interface TrafficSourcesProps {
  data: { source: TrafficSource; count: number; percentage: number }[];
}

const BAR_COLORS: Record<TrafficSource, string> = {
  google: "bg-brand-500",
  google_maps: "bg-teal-500",
  instagram: "bg-violet-500",
  facebook: "bg-sky-500",
  directo: "bg-emerald-500",
  referido: "bg-amber-500",
};

export function TrafficSources({ data }: TrafficSourcesProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={item.source}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-ink-700">{TRAFFIC_SOURCE_LABELS[item.source]}</span>
            <span className="tabular-nums text-ink-400">
              {formatNumber(item.count)} · {formatPercent(item.percentage)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className={`h-full rounded-full ${BAR_COLORS[item.source]}`}
              style={{
                width: mounted ? `${Math.max(item.percentage * 100, 2)}%` : "0%",
                transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                transitionDelay: `${index * 70}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
