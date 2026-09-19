'use client';

import { startTransition, useActionState, useOptimistic } from 'react';
import { Heart } from 'lucide-react';
import { addToWishlistAction, removeFromWishlistAction } from '@/actions/wishlist-actions';
import { Button } from '@/components/shared/button';
import { useActionStateToast } from '@/hooks/use-action-state-toast';
import { cn } from '@/lib/utils/cn';

/**
 * A toggle rendered as whichever form applies right now: the "add" form when the
 * product is not wished for, the "remove" form when it is. Without JavaScript the
 * page re-renders with the other form after the post; with it, the heart flips
 * optimistically and React reverts it if the action fails.
 */
export function WishlistButton({
  productId,
  isWished,
  className,
}: {
  productId: string;
  isWished: boolean;
  className?: string;
}) {
  const [addState, addAction, addPending] = useActionState(addToWishlistAction, {
    success: false,
    message: '',
  });
  const [removeState, removeAction, removePending] = useActionState(removeFromWishlistAction, {
    success: false,
    message: '',
  });
  useActionStateToast(addState);
  useActionStateToast(removeState);

  const [optimisticWished, setOptimisticWished] = useOptimistic(isWished);
  const pending = addPending || removePending;
  const formAction = optimisticWished ? removeAction : addAction;

  return (
    <form
      action={formAction}
      onSubmit={(evt) => {
        evt.preventDefault();
        const formData = new FormData(evt.currentTarget);
        startTransition(() => {
          setOptimisticWished(!optimisticWished);
          formAction(formData);
        });
      }}
      className={cn('contents', className)}
    >
      <input type="hidden" name="productId" value={productId} />
      <Button
        type="submit"
        variant="outlined"
        className="h-11 gap-2 sm:h-10"
        aria-pressed={optimisticWished}
        aria-label={optimisticWished ? 'Remove from wishlist' : 'Add to wishlist'}
        disabled={pending}
      >
        <Heart
          className={cn('size-4 transition-colors', optimisticWished && 'fill-current text-danger')}
          aria-hidden
        />
        {optimisticWished ? 'Saved' : 'Wishlist'}
      </Button>
    </form>
  );
}
