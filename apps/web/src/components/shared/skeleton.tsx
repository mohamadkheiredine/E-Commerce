import { cn } from '@/lib/utils/cn';
import { HTMLAttributes } from 'react';

function Skeleton({ className, ...props }: Readonly<HTMLAttributes<HTMLDivElement>>) {
  return <div className={cn('animate-pulse rounded-md bg-primary/10', className)} {...props} />;
}

export { Skeleton };
