'use client';

import { useActionState } from 'react';
import { changeCartItemVariantAction } from '@/actions/cart-actions';
import { useActionStateToast } from '@/hooks/use-action-state-toast';
import type { ProductVariant } from '@/models/product/read';

/**
 * Changing a line's variant. With JavaScript the select submits itself on change;
 * without it, the `<noscript>` button does. Either way it is the same form posting
 * to the same action — and if the target variant is already in the cart, the API
 * merges the two lines.
 */
export function VariantSelect({
  itemId,
  current,
  alternatives,
  label,
}: {
  itemId: string;
  current: ProductVariant;
  alternatives: ProductVariant[];
  label: string;
}) {
  const [state, formAction, isPending] = useActionState(changeCartItemVariantAction, {
    success: false,
    message: '',
  });
  useActionStateToast(state);

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="itemId" value={itemId} />
      <label className="text-xs text-muted-foreground" htmlFor={`variant-${itemId}`}>
        {label}
      </label>
      <select
        id={`variant-${itemId}`}
        name="variantId"
        key={current.id}
        defaultValue={current.id}
        disabled={isPending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-8 rounded-md border bg-background px-2 text-sm disabled:opacity-60"
      >
        {alternatives.map((variant) => (
          <option key={variant.id} value={variant.id} disabled={!variant.inStock}>
            {variant.value}
            {variant.inStock ? '' : ' — sold out'}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="h-8 rounded-md border px-2 text-sm">
          Update
        </button>
      </noscript>
    </form>
  );
}
