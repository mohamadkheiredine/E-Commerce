'use client';

import { startTransition, useActionState, useOptimistic } from 'react';
import { Minus, Plus } from 'lucide-react';
import { updateCartItemQuantityAction } from '@/actions/cart-actions';
import { IconButton } from '@/components/shared/icon-button';
import { useActionStateToast } from '@/hooks/use-action-state-toast';
import { cn } from '@/lib/utils/cn';

/**
 * One form, two submit buttons. Each button carries `name="quantity"` and the value
 * it would set, so a JavaScript-free browser submits exactly the right number — the
 * submitter's name/value pair is part of the form data by HTML's own rules.
 *
 * With JavaScript the submit is intercepted, the new quantity is shown
 * *optimistically* while the action runs, and React rolls it back on its own if
 * the action fails (useOptimistic resets to the real value once the transition
 * settles). No manual rollback code.
 */
export function QuantityControls({
  itemId,
  quantity,
  max,
  className,
}: {
  itemId: string;
  quantity: number;
  max: number;
  className?: string;
}) {
  const [state, formAction, isPending] = useActionState(updateCartItemQuantityAction, {
    success: false,
    message: '',
  });
  useActionStateToast(state, { successToast: false });

  const [optimisticQuantity, setOptimisticQuantity] = useOptimistic(quantity);

  return (
    <form
      action={formAction}
      onSubmit={(evt) => {
        evt.preventDefault();
        const submitter = (evt.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const formData = new FormData(evt.currentTarget, submitter);
        const next = Number(formData.get('quantity'));
        startTransition(() => {
          setOptimisticQuantity(next);
          formAction(formData);
        });
      }}
      className={cn('inline-flex items-center rounded-md border bg-background', className)}
      aria-label="Quantity"
    >
      <input type="hidden" name="itemId" value={itemId} />
      <IconButton
        type="submit"
        name="quantity"
        value={optimisticQuantity - 1}
        variant="ghost"
        size="md"
        className="rounded-r-none"
        aria-label="Decrease quantity"
        disabled={isPending || optimisticQuantity <= 1}
      >
        <Minus className="size-4" aria-hidden />
      </IconButton>
      <output
        className={cn(
          'min-w-10 text-center text-sm font-medium tabular-nums',
          isPending && 'text-muted-foreground',
        )}
        aria-live="polite"
      >
        {optimisticQuantity}
      </output>
      <IconButton
        type="submit"
        name="quantity"
        value={optimisticQuantity + 1}
        variant="ghost"
        size="md"
        className="rounded-l-none"
        aria-label="Increase quantity"
        disabled={isPending || optimisticQuantity >= max}
      >
        <Plus className="size-4" aria-hidden />
      </IconButton>
    </form>
  );
}
