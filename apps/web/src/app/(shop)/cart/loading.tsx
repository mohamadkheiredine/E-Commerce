import { Skeleton } from '@/components/shared/skeleton';

export default function CartLoading() {
  return (
    <section className="space-y-6" aria-busy aria-label="Loading cart">
      <Skeleton className="h-8 w-40" />
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="divide-y">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="grid grid-cols-[5rem_1fr] gap-3 py-4 sm:grid-cols-[6rem_1fr_auto]"
            >
              <Skeleton className="aspect-square rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="col-span-2 h-9 w-full sm:col-span-1 sm:w-32" />
            </div>
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </section>
  );
}
