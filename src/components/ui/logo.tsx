import { cn } from "@/lib/utils";

export function LineaMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900",
        className
      )}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 12L7 2L12 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.5 8H9.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function LineaLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LineaMark />
      <span className="text-[15px] font-semibold tracking-tight text-ink-900">
        Línea App
      </span>
    </div>
  );
}
