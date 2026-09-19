'use client';

import ErrorCard from '@/components/layout/error-card';

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorCard title="Product" error={error} reset={reset} />;
}
