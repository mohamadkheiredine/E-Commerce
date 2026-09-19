'use client';

import ErrorCard from '@/components/layout/error-card';

export default function OrderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorCard title="Order" error={error} reset={reset} />;
}
