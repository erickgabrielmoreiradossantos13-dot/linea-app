import type { TrafficSource } from "@/lib/types";
import { TRAFFIC_SOURCE_LABELS } from "@/lib/types";
import { formatNumber, formatPercent } from "@/lib/utils";

interface TrafficSourcesProps {
  data: { source: TrafficSource; count: number; percentage: number }[];
}

const BAR_COLORS: Record<TrafficSource, string> = {
  google: "bg-brand-500",
  instagram: "bg-violet-500",
  facebook: "bg-sky-500",
  directo: "bg-emerald-500",
  referido: "bg-amber-500",
};

export function TrafficSources({ data }: TrafficSourcesProps) {
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.source}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-ink-700">{TRAFFIC_SOURCE_LABELS[item.source]}</span>
            <span className="text-ink-400">
              {formatNumber(item.count)} · {formatPercent(item.percentage)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className={`h-full rounded-full ${BAR_COLORS[item.source]}`}
              style={{ width: `${Math.max(item.percentage * 100, 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
