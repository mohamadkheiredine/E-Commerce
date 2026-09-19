'use client';

import { useActionState } from 'react';
import { Lock } from 'lucide-react';
import { placeOrderAction } from '@/actions/order-actions';
import { Button } from '@/components/shared/button';
import { useActionStateToast } from '@/hooks/use-action-state-toast';

/**
 * The idempotency key is minted by the server component that renders this form
 * and travels as a hidden field. Submitting twice — a double click, a retry after
 * a timeout — sends the same key, and the API returns the original order instead
 * of placing a second one. Reloading the page mints a new key, which is correct:
 * that is a new attempt.
 *
 * No `onSubmit` interception here on purpose: the action redirects on success,
 * and there is nothing client-side to validate. The plainest possible form.
 */
export function PlaceOrderForm({
  idempotencyKey,
  total,
}: {
  idempotencyKey: string;
  total: string;
}) {
  const [state, formAction, isPending] = useActionState(placeOrderAction, {
    success: false,
    message: '',
  });
  useActionStateToast(state);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      {!state.success && state.issues?.length ? (
        <ul
          role="alert"
          className="rounded-md border border-danger/40 bg-destructive-light px-3 py-2 text-sm text-danger"
        >
          {state.issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}

      <Button
        type="submit"
        className="h-12 w-full gap-2 text-base sm:h-11"
        isLoading={isPending}
        disabled={isPending}
      >
        <Lock className="size-4" aria-hidden />
        {isPending ? 'Placing order…' : `Place order · ${total}`}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        This is a demo. No payment is taken.
      </p>
    </form>
  );
}
