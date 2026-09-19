'use client';

import ErrorCard from '@/components/layout/error-card';

export default function WishlistError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorCard title="Wishlist" error={error} reset={reset} />;
}
