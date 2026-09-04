import { cn } from "@/lib/utils";

export function LineaMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900",
        className
      )}
    >
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M2 9.5L5.5 6.5L8 8.5L12 3"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="3" r="1.35" fill="white" />
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
