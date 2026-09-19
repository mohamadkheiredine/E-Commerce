'use client';

import { Minus, Plus } from 'lucide-react';
import { IconButton } from '@/components/shared/icon-button';
import { cn } from '@/lib/utils/cn';

interface Props {
  value: number;
  increase: () => void;
  decrease: () => void;
  min: number;
  max: number;
  className?: string;
  /** Announced to screen readers alongside the value, e.g. "Quantity". */
  label?: string;
}

/**
 * A controlled stepper for client-side quantity state — used on the product page
 * before the value is committed via a hidden input in the add-to-cart form.
 *
 * The cart page does NOT use this: there, quantity changes are individual `<form>`
 * submissions so they work without JavaScript.
 */
const CounterInput = ({
  value,
  increase,
  decrease,
  min,
  max,
  className,
  label = 'Quantity',
}: Props) => {
  return (
    <div
      className={cn('inline-flex items-center rounded-md border bg-background', className)}
      role="group"
      aria-label={label}
    >
      {/* type="button" so these never submit an enclosing form */}
      <IconButton
        type="button"
        variant="ghost"
        size="md"
        className="rounded-r-none rounded-l-md"
        onClick={decrease}
        aria-label={`Decrease ${label.toLowerCase()}`}
        disabled={value <= min}
      >
        <Minus className="size-4" aria-hidden />
      </IconButton>
      <span
        className="min-w-10 select-none text-center text-sm font-medium tabular-nums"
        aria-live="polite"
      >
        {value}
      </span>
      <IconButton
        type="button"
        variant="ghost"
        size="md"
        className="rounded-l-none rounded-r-md"
        onClick={increase}
        aria-label={`Increase ${label.toLowerCase()}`}
        disabled={value >= max}
      >
        <Plus className="size-4" aria-hidden />
      </IconButton>
    </div>
  );
};

export default CounterInput;
