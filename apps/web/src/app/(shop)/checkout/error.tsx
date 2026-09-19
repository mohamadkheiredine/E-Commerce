'use client';

import ErrorCard from '@/components/layout/error-card';

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorCard title="Checkout" error={error} reset={reset} />;
}
