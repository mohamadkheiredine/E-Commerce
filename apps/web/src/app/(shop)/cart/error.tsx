'use client';

import ErrorCard from '@/components/layout/error-card';

export default function CartError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorCard title="Cart" error={error} reset={reset} />;
}
