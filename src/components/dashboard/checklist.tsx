import { CheckCircle2, Circle, Settings2 } from "lucide-react";
import type { ChecklistItem, ChecklistStatus } from "@/lib/google";
import { cn } from "@/lib/utils";

const STATUS_META: Record<ChecklistStatus, { icon: typeof CheckCircle2; color: string }> = {
  done: { icon: CheckCircle2, color: "text-emerald-600" },
  pending: { icon: Circle, color: "text-ink-300" },
  managed: { icon: Settings2, color: "text-brand-500" },
};

export function Checklist({ items }: { items: ChecklistItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const meta = STATUS_META[item.status];
        const Icon = meta.icon;
        return (
          <li key={item.id} className="flex items-start gap-2.5">
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", meta.color)} strokeWidth={2} />
            <div>
              <p className={cn("text-sm font-medium", item.status === "done" ? "text-ink-900" : "text-ink-700")}>
                {item.label}
              </p>
              <p className="mt-0.5 text-xs text-ink-400">{item.note}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
