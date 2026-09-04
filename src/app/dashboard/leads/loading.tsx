import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-2 h-6 w-40" />
      <Skeleton className="mb-6 h-4 w-72" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
