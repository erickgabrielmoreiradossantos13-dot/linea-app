import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  accent?: "brand" | "emerald" | "amber" | "violet";
}

const accentClasses: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
};

export function StatCard({ label, value, icon: Icon, hint, accent = "brand" }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", accentClasses[accent])}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
      </div>
      <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight text-ink-900">
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
