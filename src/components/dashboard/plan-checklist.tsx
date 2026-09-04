import { CheckCircle2, CircleDot, Circle, CalendarClock } from "lucide-react";
import type { ImprovementPlanItem } from "@/lib/types";
import { PLAN_STATUS_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_META: Record<
  ImprovementPlanItem["status"],
  { icon: typeof CheckCircle2; color: string; textColor: string }
> = {
  completado: { icon: CheckCircle2, color: "text-emerald-600", textColor: "text-ink-400 line-through" },
  en_progreso: { icon: CircleDot, color: "text-brand-600", textColor: "text-ink-900" },
  pendiente: { icon: Circle, color: "text-ink-300", textColor: "text-ink-600" },
};

interface PlanChecklistProps {
  items: ImprovementPlanItem[];
  nextReviewDate: string | null;
}

export function PlanChecklist({ items, nextReviewDate }: PlanChecklistProps) {
  return (
    <div>
      <ul className="space-y-3">
        {items.map((item) => {
          const meta = STATUS_META[item.status];
          const Icon = meta.icon;

          return (
            <li key={item.id} className="flex items-center gap-3">
              <Icon className={cn("h-5 w-5 shrink-0", meta.color)} strokeWidth={2} />
              <span className={cn("text-[15px]", meta.textColor)}>{item.title}</span>
              <span className="ml-auto shrink-0 text-xs font-medium text-ink-400">
                {PLAN_STATUS_LABELS[item.status]}
              </span>
            </li>
          );
        })}
      </ul>

      {nextReviewDate && (
        <div className="mt-5 flex items-center gap-2 border-t border-ink-100 pt-4 text-sm text-ink-500">
          <CalendarClock className="h-4 w-4 text-ink-400" />
          Próxima revisión: <span className="font-medium text-ink-700">{formatDate(nextReviewDate)}</span>
        </div>
      )}
    </div>
  );
}
