import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div>
      <Skeleton className="mb-2 h-6 w-56" />
      <Skeleton className="mb-6 h-4 w-80" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: cards }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
