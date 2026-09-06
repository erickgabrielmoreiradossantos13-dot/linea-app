import Link from "next/link";
import { AlertTriangle, AlertCircle, Sparkles, Lightbulb, ArrowRight } from "lucide-react";
import type { OpportunityInsight } from "@/lib/insights";
import { cn } from "@/lib/utils";

const PRIORITY_META: Record<
  OpportunityInsight["priority"],
  { label: string; icon: typeof AlertTriangle; badge: string; iconWrap: string; wash: string; border: string }
> = {
  alta: {
    label: "Alta prioridad",
    icon: AlertTriangle,
    badge: "bg-red-50 text-red-700",
    iconWrap: "bg-red-500/10 text-red-600",
    wash: "from-red-500/[0.04]",
    border: "border-l-red-400",
  },
  atencion: {
    label: "Atención",
    icon: AlertCircle,
    badge: "bg-orange-50 text-orange-700",
    iconWrap: "bg-orange-500/10 text-orange-600",
    wash: "from-orange-500/[0.04]",
    border: "border-l-orange-400",
  },
  oportunidad: {
    label: "Oportunidad",
    icon: Lightbulb,
    badge: "bg-violet-50 text-violet-700",
    iconWrap: "bg-violet-500/10 text-violet-600",
    wash: "from-violet-500/[0.04]",
    border: "border-l-violet-400",
  },
  mejora: {
    label: "Mejora positiva",
    icon: Sparkles,
    badge: "bg-emerald-50 text-emerald-700",
    iconWrap: "bg-emerald-500/10 text-emerald-600",
    wash: "from-emerald-500/[0.04]",
    border: "border-l-emerald-400",
  },
};

export function OpportunityCard({ insight }: { insight: OpportunityInsight }) {
  const meta = PRIORITY_META[insight.priority];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "rounded-2xl border border-ink-100 border-l-[3px] bg-gradient-to-br to-white to-60% p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover",
        meta.wash,
        meta.border
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", meta.iconWrap)}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", meta.badge)}>
              {meta.label}
            </span>
            {insight.illustrative && (
              <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-[11px] font-medium text-ink-500">
                Ejemplo ilustrativo
              </span>
            )}
          </div>
          <p className="mt-2 text-[15px] font-semibold text-ink-900">{insight.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">{insight.explanation}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-700">
            <span className="font-medium">Recomendación: </span>
            {insight.recommendation}
          </p>
          {insight.impact && (
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              <span className="font-medium text-ink-700">Impacto: </span>
              {insight.impact}
            </p>
          )}

          {insight.actions && insight.actions.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {insight.actions.map((action) => (
                <Link
                  key={action.href + action.label}
                  href={action.href}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
                >
                  {action.label} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
