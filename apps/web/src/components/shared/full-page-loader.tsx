'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface FullPageLoaderProps {
  message?: string;
  className?: string;
}

export function FullPageLoader({
  message = 'Loading...',
  className,
}: Readonly<FullPageLoaderProps>) {
  return (
    <div
      className={cn(
        'flex h-svh w-full flex-col items-center justify-center gap-4 text-muted-foreground',
        className,
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
