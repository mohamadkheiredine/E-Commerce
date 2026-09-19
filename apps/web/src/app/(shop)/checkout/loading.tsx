import { Skeleton } from '@/components/shared/skeleton';

export default function CheckoutLoading() {
  return (
    <section className="mx-auto max-w-3xl space-y-6" aria-busy aria-label="Loading checkout">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-96 rounded-xl" />
    </section>
  );
}
