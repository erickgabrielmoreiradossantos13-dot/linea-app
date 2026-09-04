"use client";

import type { ReactNode } from "react";
import { cn, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { useCountUp } from "@/hooks/use-count-up";

type FormatType = "number" | "currency" | "percent";

interface StatCardProps {
  label: string;
  value: number;
  formatType: FormatType;
  icon: ReactNode;
  hint?: string;
  accent?: "brand" | "emerald" | "amber" | "violet";
  delay?: number;
}

const accentClasses: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
};

function formatValue(value: number, type: FormatType) {
  if (type === "currency") return formatCurrency(value);
  if (type === "percent") return formatPercent(value);
  return formatNumber(Math.round(value));
}

export function StatCard({
  label,
  value,
  formatType,
  icon,
  hint,
  accent = "brand",
  delay = 0,
}: StatCardProps) {
  const animated = useCountUp(value);

  return (
    <div
      className="group animate-fade-in-up rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110",
            accentClasses[accent]
          )}
        >
          {icon}
        </div>
      </div>
      <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-ink-900">
        {formatValue(animated, formatType)}
      </p>
      {hint && <p className="mt-2 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
