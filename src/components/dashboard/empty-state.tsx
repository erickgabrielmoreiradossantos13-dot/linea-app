import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-50 text-ink-400">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <p className="mt-4 text-sm font-medium text-ink-700">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-ink-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
