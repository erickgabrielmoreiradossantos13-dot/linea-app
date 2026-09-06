import { CheckCircle2, CircleDot, Circle, CalendarClock } from "lucide-react";
import type { ImprovementPlanItem, PlanPriority } from "@/lib/types";
import { PLAN_CATEGORY_LABELS, PLAN_PRIORITY_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const PRIORITY_DOT: Record<PlanPriority, string> = {
  alta: "bg-red-500",
  media: "bg-orange-400",
  baja: "bg-ink-300",
};

const GROUPS: { statuses: ImprovementPlanItem["status"][]; label: string; icon: typeof CheckCircle2; iconColor: string }[] = [
  { statuses: ["en_progreso"], label: "Estamos trabajando en esto", icon: CircleDot, iconColor: "text-brand-600" },
  {
    statuses: ["recomendado", "planificado"],
    label: "Recomendado / planificado",
    icon: Circle,
    iconColor: "text-ink-300",
  },
  { statuses: ["completado"], label: "Completado", icon: CheckCircle2, iconColor: "text-emerald-600" },
];

function PlanItemRow({ item }: { item: ImprovementPlanItem }) {
  const isDone = item.status === "completado";

  return (
    <li className="border-b border-ink-100 py-3 last:border-0">
      <div className="flex items-start gap-2">
        <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", PRIORITY_DOT[item.priority])} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-[15px] font-medium", isDone ? "text-ink-400 line-through" : "text-ink-900")}>
              {item.title}
            </span>
            {item.category && (
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">
                {PLAN_CATEGORY_LABELS[item.category]}
              </span>
            )}
          </div>
          {item.description && !isDone && (
            <p className="mt-1 text-sm text-ink-500">{item.description}</p>
          )}
          {item.impact && !isDone && (
            <p className="mt-1 text-sm text-ink-500">
              <span className="font-medium text-ink-700">Impacto: </span>
              {item.impact}
            </p>
          )}
          {isDone && item.result && <p className="mt-1 text-sm text-ink-500">{item.result}</p>}
          {item.target_date && !isDone && (
            <p className="mt-1 text-xs text-ink-400">Previsto para {formatDate(item.target_date)}</p>
          )}
        </div>
        <span className="shrink-0 text-xs font-medium text-ink-400">{PLAN_PRIORITY_LABELS[item.priority]}</span>
      </div>
    </li>
  );
}

interface PlanChecklistProps {
  items: ImprovementPlanItem[];
  nextReviewDate: string | null;
}

export function PlanChecklist({ items, nextReviewDate }: PlanChecklistProps) {
  const visible = items.filter((item) => item.status !== "descartado");

  return (
    <div>
      {GROUPS.map((group) => {
        const groupItems = visible.filter((item) => group.statuses.includes(item.status));
        if (groupItems.length === 0) return null;
        const Icon = group.icon;

        return (
          <div key={group.label} className="mb-5 last:mb-0">
            <div className="mb-1 flex items-center gap-2">
              <Icon className={cn("h-4 w-4", group.iconColor)} strokeWidth={2} />
              <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-400">{group.label}</h4>
            </div>
            <ul>
              {groupItems.map((item) => (
                <PlanItemRow key={item.id} item={item} />
              ))}
            </ul>
          </div>
        );
      })}

      {nextReviewDate && (
        <div className="mt-2 flex items-center gap-2 border-t border-ink-100 pt-4 text-sm text-ink-500">
          <CalendarClock className="h-4 w-4 text-ink-400" />
          Próxima revisión: <span className="font-medium text-ink-700">{formatDate(nextReviewDate)}</span>
        </div>
      )}
    </div>
  );
}
