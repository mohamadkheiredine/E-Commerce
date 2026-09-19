import { Skeleton } from '@/components/shared/skeleton';

export default function ProductLoading() {
  return (
    <div
      className="grid gap-6 md:grid-cols-2 md:gap-10 lg:gap-14"
      aria-busy
      aria-label="Loading product"
    >
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="space-y-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-3/4" />
        <div className="flex gap-3">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-12 w-20" />
          <Skeleton className="h-12 w-20" />
          <Skeleton className="h-12 w-20" />
        </div>
        <div className="space-y-2 border-t pt-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}
