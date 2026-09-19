'use client';

import { Button } from '@/components/shared/button';
import { ShieldX } from 'lucide-react';
import { PageLayout } from '@/components/layout/page-layout';

/**
 * The one error UI, re-used by every route's `error.tsx`.
 *
 * Next passes `reset` to error boundaries so the user can retry the failed segment
 * without a full reload; `digest` is the server-side error id that lets a developer
 * find the matching log line when a user reports "it said Digest: 1234".
 */
const ErrorCard = ({
  title,
  error,
  reset,
}: {
  title?: string;
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  return (
    <PageLayout>
      <PageLayout.Header>
        <PageLayout.Title>{title ?? 'Something went wrong'}</PageLayout.Title>
      </PageLayout.Header>
      <PageLayout.Content className="min-h-[50vh] flex w-full flex-col items-center justify-center">
        <ShieldX className="h-16 w-16 text-destructive mb-4" aria-hidden />
        <div className="w-full text-destructive mb-7 flex flex-col items-center gap-8 @container/error-card">
          <p className="@lg/error-card:max-w-[70%] text-center">{error.message}</p>
          {error.digest && (
            <p className="text-sm text-muted-foreground">Reference: {error.digest}</p>
          )}
        </div>
        <Button variant="outlined" onClick={() => reset()}>
          Try again
        </Button>
      </PageLayout.Content>
    </PageLayout>
  );
};

export default ErrorCard;
