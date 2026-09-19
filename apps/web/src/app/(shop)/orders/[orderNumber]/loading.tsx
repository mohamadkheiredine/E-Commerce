import { Skeleton } from '@/components/shared/skeleton';

export default function OrderLoading() {
  return (
    <section className="mx-auto max-w-3xl space-y-6" aria-busy aria-label="Loading order">
      <div className="flex flex-col items-center gap-3 py-4">
        <Skeleton className="size-14 rounded-full" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </section>
  );
}
