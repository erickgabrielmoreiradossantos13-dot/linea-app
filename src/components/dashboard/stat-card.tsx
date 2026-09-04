"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { useCountUp } from "@/hooks/use-count-up";
import type { PeriodDelta } from "@/lib/dashboard";

type FormatType = "number" | "currency" | "percent";

interface StatCardProps {
  label: string;
  value: number;
  formatType: FormatType;
  icon: ReactNode;
  hint?: string;
  accent?: "brand" | "emerald" | "amber" | "violet";
  delay?: number;
  /** Comparación vs. el periodo anterior (30 días). Si se omite, no se muestra. */
  delta?: PeriodDelta;
  /** Para métricas sin integración real todavía (p. ej. Visibilidad en Google). */
  notConnected?: boolean;
  notConnectedLabel?: string;
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

function DeltaBadge({ delta }: { delta: PeriodDelta }) {
  if (delta.percent === null) {
    return <span className="text-xs font-medium text-ink-400">Sin datos del mes anterior</span>;
  }

  const isUp = delta.direction === "up";
  const isFlat = delta.direction === "flat";
  const Icon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;
  const color = isFlat ? "text-ink-400" : isUp ? "text-emerald-600" : "text-red-500";

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", color)}>
      <Icon className="h-3.5 w-3.5" />
      {isFlat ? "Sin cambios" : `${delta.percent > 0 ? "+" : ""}${Math.round(delta.percent * 100)}%`}
      <span className="font-normal text-ink-400">vs. mes anterior</span>
    </span>
  );
}

export function StatCard({
  label,
  value,
  formatType,
  icon,
  hint,
  accent = "brand",
  delay = 0,
  delta,
  notConnected = false,
  notConnectedLabel = "Aún no conectado",
}: StatCardProps) {
  const animated = useCountUp(notConnected ? 0 : value);

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

      {notConnected ? (
        <>
          <p className="mt-3 text-lg font-semibold leading-none text-ink-300">—</p>
          <p className="mt-2 text-xs text-ink-400">{notConnectedLabel}</p>
        </>
      ) : (
        <>
          <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-ink-900">
            {formatValue(animated, formatType)}
          </p>
          {delta ? (
            <div className="mt-2">
              <DeltaBadge delta={delta} />
            </div>
          ) : (
            hint && <p className="mt-2 text-xs text-ink-400">{hint}</p>
          )}
        </>
      )}
    </div>
  );
}
