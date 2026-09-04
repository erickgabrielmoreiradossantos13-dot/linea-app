import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-2 h-6 w-72" />
      <Skeleton className="mb-6 h-4 w-96" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="mt-6 h-5 w-48" />
      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl xl:col-span-2" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
