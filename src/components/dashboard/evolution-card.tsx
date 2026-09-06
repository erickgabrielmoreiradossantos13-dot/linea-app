import Link from "next/link";
import { CheckCircle2, CircleDot, Circle, ArrowRight } from "lucide-react";
import type { ImprovementPlanItem } from "@/lib/types";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Sparkles } from "lucide-react";

interface EvolutionCardProps {
  items: ImprovementPlanItem[];
}

/**
 * Resumen condensado del plan de mejora para el Home: refuerza que la web
 * sigue evolucionando después de publicarse. El detalle completo vive en
 * /dashboard/plan; aquí solo mostramos lo último completado, lo que está en
 * curso y lo siguiente previsto.
 */
export function EvolutionCard({ items }: EvolutionCardProps) {
  const completed = items
    .filter((i) => i.status === "completado")
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 2);
  const inProgress = items.filter((i) => i.status === "en_progreso").slice(0, 1);
  const next = items
    .filter((i) => i.status === "planificado" || i.status === "recomendado")
    .sort((a, b) => a.position - b.position)
    .slice(0, 1);

  const rows = [
    ...completed.map((item) => ({ item, icon: CheckCircle2, color: "text-emerald-600", textColor: "text-ink-400 line-through" })),
    ...inProgress.map((item) => ({ item, icon: CircleDot, color: "text-brand-600", textColor: "text-ink-900" })),
    ...next.map((item) => ({ item, icon: Circle, color: "text-ink-300", textColor: "text-ink-600" })),
  ];

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Todavía no hay un plan de mejora activo"
        description="En cuanto tu gestor de Línea Sur empiece a trabajar en mejoras, las verás aparecer aquí."
      />
    );
  }

  return (
    <div>
      <ul className="space-y-2.5">
        {rows.map(({ item, icon: Icon, color, textColor }) => (
          <li key={item.id} className="flex items-center gap-2.5">
            <Icon className={`h-4 w-4 shrink-0 ${color}`} strokeWidth={2} />
            <span className={`text-sm ${textColor}`}>{item.title}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/dashboard/plan"
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        Ver plan completo <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
