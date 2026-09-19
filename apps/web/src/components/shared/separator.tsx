'use client';

import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '@/lib/utils/cn';
import { ComponentPropsWithoutRef, ComponentRef, Ref } from 'react';

type SeparatorRef = ComponentRef<typeof SeparatorPrimitive.Root>;

type SeparatorProps = ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & {
  ref?: Ref<SeparatorRef>;
};

export const Separator = ({
  className,
  orientation = 'horizontal',
  decorative = true,
  ref,
  ...props
}: SeparatorProps) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      className,
    )}
    {...props}
  />
);
