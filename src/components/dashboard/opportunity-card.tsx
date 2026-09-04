import { AlertTriangle, Sparkles, Search } from "lucide-react";
import type { OpportunityInsight } from "@/lib/insights";
import { cn } from "@/lib/utils";

const PRIORITY_META: Record<
  OpportunityInsight["priority"],
  { label: string; icon: typeof AlertTriangle; badge: string; iconWrap: string }
> = {
  alta: {
    label: "Alta prioridad",
    icon: AlertTriangle,
    badge: "bg-red-50 text-red-700",
    iconWrap: "bg-red-50 text-red-600",
  },
  mejora: {
    label: "Mejora positiva",
    icon: Sparkles,
    badge: "bg-emerald-50 text-emerald-700",
    iconWrap: "bg-emerald-50 text-emerald-600",
  },
  seo_demo: {
    label: "Oportunidad SEO",
    icon: Search,
    badge: "bg-brand-50 text-brand-700",
    iconWrap: "bg-brand-50 text-brand-600",
  },
};

export function OpportunityCard({ insight }: { insight: OpportunityInsight }) {
  const meta = PRIORITY_META[insight.priority];
  const Icon = meta.icon;

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-start gap-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", meta.iconWrap)}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", meta.badge)}>
              {meta.label}
            </span>
            {insight.priority === "seo_demo" && (
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
        </div>
      </div>
    </div>
  );
}
