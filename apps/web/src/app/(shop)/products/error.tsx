'use client';

import ErrorCard from '@/components/layout/error-card';

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorCard title="Products" error={error} reset={reset} />;
}
