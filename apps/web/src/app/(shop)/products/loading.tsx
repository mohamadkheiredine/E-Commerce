import { Skeleton } from '@/components/shared/skeleton';

export default function ProductsLoading() {
  return (
    <section aria-busy aria-label="Loading products">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-3 h-4 w-72" />
    </section>
  );
}
