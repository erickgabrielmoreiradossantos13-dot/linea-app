"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { useCountUp } from "@/hooks/use-count-up";
import type { PeriodDelta } from "@/lib/dashboard";

type FormatType = "number" | "currency" | "percent";
type Accent = "violet" | "sky" | "emerald" | "orange" | "brand" | "red";

interface StatCardProps {
  label: string;
  value: number;
  formatType: FormatType;
  icon: ReactNode;
  hint?: string;
  accent?: Accent;
  delay?: number;
  /** Comparación vs. el periodo anterior (30 días). Si se omite, no se muestra. */
  delta?: PeriodDelta;
  /** Para métricas sin integración real todavía (p. ej. Visibilidad en Google). */
  notConnected?: boolean;
  notConnectedLabel?: string;
}

const ACCENT_STYLES: Record<Accent, { wash: string; border: string; icon: string }> = {
  violet: {
    wash: "from-violet-500/[0.07] via-violet-500/[0.02]",
    border: "border-l-violet-400",
    icon: "bg-violet-500/10 text-violet-600",
  },
  sky: {
    wash: "from-sky-500/[0.07] via-sky-500/[0.02]",
    border: "border-l-sky-400",
    icon: "bg-sky-500/10 text-sky-600",
  },
  emerald: {
    wash: "from-emerald-500/[0.07] via-emerald-500/[0.02]",
    border: "border-l-emerald-400",
    icon: "bg-emerald-500/10 text-emerald-600",
  },
  orange: {
    wash: "from-orange-500/[0.07] via-orange-500/[0.02]",
    border: "border-l-orange-400",
    icon: "bg-orange-500/10 text-orange-600",
  },
  brand: {
    wash: "from-brand-500/[0.07] via-brand-500/[0.02]",
    border: "border-l-brand-400",
    icon: "bg-brand-500/10 text-brand-600",
  },
  red: {
    wash: "from-red-500/[0.07] via-red-500/[0.02]",
    border: "border-l-red-400",
    icon: "bg-red-500/10 text-red-600",
  },
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
  const style = ACCENT_STYLES[accent];

  return (
    <div
      className={cn(
        "group animate-fade-in-up rounded-2xl border border-ink-100 border-l-[3px] bg-gradient-to-br to-white to-60% p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover",
        style.wash,
        style.border
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3",
            style.icon
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
