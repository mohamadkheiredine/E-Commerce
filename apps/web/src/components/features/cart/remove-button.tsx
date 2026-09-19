'use client';

import { useActionState } from 'react';
import { Trash2 } from 'lucide-react';
import { removeCartItemAction } from '@/actions/cart-actions';
import { Button } from '@/components/shared/button';
import { useActionStateToast } from '@/hooks/use-action-state-toast';

export function RemoveButton({ itemId, title }: { itemId: string; title: string }) {
  const [state, formAction, isPending] = useActionState(removeCartItemAction, {
    success: false,
    message: '',
  });
  useActionStateToast(state);

  return (
    <form action={formAction}>
      <input type="hidden" name="itemId" value={itemId} />
      <Button
        type="submit"
        variant="ghost"
        className="h-10 gap-1.5 px-2 text-muted-foreground hover:text-danger"
        aria-label={`Remove ${title} from cart`}
        isLoading={isPending}
        disabled={isPending}
      >
        <Trash2 className="size-4" aria-hidden />
        <span className="text-xs">Remove</span>
      </Button>
    </form>
  );
}
