'use client';

import { startTransition, useActionState, useRef, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { z } from 'zod';
import { addToCartFormSchema } from '@ecom/contracts';
import { addToCartAction } from '@/actions/cart-actions';
import { StockBadge } from '@/components/features/products/stock-badge';
import { Button } from '@/components/shared/button';
import { IconButton } from '@/components/shared/icon-button';
import { useActionStateToast } from '@/hooks/use-action-state-toast';
import { cn } from '@/lib/utils/cn';
import type { Product } from '@/models/product/read';

/**
 * The client-side schema is the shared one plus the rule the shared schema cannot
 * express on its own: a variant is required *when the product has variants*. The
 * API enforces the same rule (VARIANT_REQUIRED), so the no-JS path is covered too.
 */
const makeSchema = (hasVariants: boolean) =>
  addToCartFormSchema.refine((v) => !hasVariants || Boolean(v.variantId), {
    error: 'Choose an option first',
    path: ['variantId'],
  });

type FormValues = z.infer<typeof addToCartFormSchema>;

/**
 * Progressive enhancement, layer by layer:
 *
 * - No JS: the radios, the number input and the submit button are plain HTML. The
 *   browser posts them; the server action validates; the page re-renders with any
 *   issues listed inline.
 * - With JS: the same inputs are watched to show the selected variant's price and
 *   stock, cap the quantity, and enable the +/- buttons. Submission goes through
 *   react-hook-form for instant validation, then dispatches the identical FormData.
 */
export function AddToCartForm({ product, wishlist }: { product: Product; wishlist?: ReactNode }) {
  const [state, formAction, isPending] = useActionState(addToCartAction, {
    success: false,
    message: '',
  });
  useActionStateToast(state);

  const firstAvailable = product.variants.find((v) => v.inStock);

  const form = useForm<FormValues>({
    resolver: zodResolver(makeSchema(product.hasVariants)),
    defaultValues: {
      productId: product.id,
      variantId: firstAvailable?.id,
      quantity: 1,
    },
  });

  const formRef = useRef<HTMLFormElement>(null);

  // useWatch rather than form.watch: the latter is opaque to the React Compiler, which
  // then declines to optimise the whole component.
  const selectedVariantId = useWatch({ control: form.control, name: 'variantId' });
  const quantity = useWatch({ control: form.control, name: 'quantity' });
  const selected = product.variants.find((v) => v.id === selectedVariantId) ?? null;

  const available = product.hasVariants ? (selected?.stock ?? 0) : product.totalStock;
  const canBuy = available > 0;
  const displayPrice = selected ? selected.displayPrice : product.displayPrice;

  const setQuantity = (next: number) =>
    form.setValue('quantity', Math.min(Math.max(1, next), Math.max(1, available)), {
      shouldValidate: true,
    });

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(evt) => {
        evt.preventDefault();
        form.handleSubmit(() => {
          const formData = new FormData(formRef.current!);
          startTransition(() => formAction(formData));
        })(evt);
      }}
      className="space-y-5"
      noValidate
    >
      <input type="hidden" name="productId" value={product.id} />

      {product.hasVariants ? (
        <fieldset>
          <legend className="text-sm font-semibold">
            {product.variantType}
            {selected ? (
              <span className="ml-2 font-normal text-muted-foreground">— {selected.value}</span>
            ) : null}
          </legend>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup">
            {product.variants.map((variant) => {
              const checked = variant.id === selectedVariantId;
              return (
                <label
                  key={variant.id}
                  className={cn(
                    'relative flex cursor-pointer select-none flex-col rounded-md border px-3 py-2 text-sm transition-colors',
                    'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                    checked && 'border-primary bg-primary text-primary-foreground',
                    !variant.inStock && 'cursor-not-allowed border-dashed opacity-60',
                  )}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    value={variant.id}
                    disabled={!variant.inStock}
                    {...form.register('variantId')}
                    onChange={(e) => {
                      form.register('variantId').onChange(e);
                      setQuantity(quantity);
                    }}
                  />
                  <span className="font-medium">{variant.value}</span>
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      checked ? 'text-primary-foreground/80' : 'text-muted-foreground',
                    )}
                  >
                    {variant.inStock ? variant.displayPrice : 'Sold out'}
                  </span>
                </label>
              );
            })}
          </div>
          {form.formState.errors.variantId ? (
            <p className="mt-2 text-sm text-danger">{form.formState.errors.variantId.message}</p>
          ) : null}
        </fieldset>
      ) : null}

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="quantity" className="text-sm font-semibold">
            Quantity
          </label>
          <div className="mt-2 inline-flex items-center rounded-md border bg-background">
            <IconButton
              type="button"
              variant="ghost"
              className="rounded-r-none"
              aria-label="Decrease quantity"
              onClick={() => setQuantity(quantity - 1)}
              disabled={!canBuy || quantity <= 1}
            >
              <Minus className="size-4" aria-hidden />
            </IconButton>
            <input
              id="quantity"
              type="number"
              inputMode="numeric"
              min={1}
              max={Math.max(1, available)}
              disabled={!canBuy}
              className="h-10 w-14 border-x bg-transparent text-center text-sm font-medium tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              {...form.register('quantity', { valueAsNumber: true })}
            />
            <IconButton
              type="button"
              variant="ghost"
              className="rounded-l-none"
              aria-label="Increase quantity"
              onClick={() => setQuantity(quantity + 1)}
              disabled={!canBuy || quantity >= available}
            >
              <Plus className="size-4" aria-hidden />
            </IconButton>
          </div>
        </div>

        <div className="pb-1">
          <p className="text-2xl font-semibold tabular-nums">{displayPrice}</p>
          <StockBadge
            stock={available}
            inStock={canBuy}
            isLowStock={canBuy && available < 5}
            exact
            className="mt-1"
          />
        </div>
      </div>

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

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          className="h-11 flex-1 gap-2 sm:h-10"
          isLoading={isPending}
          disabled={isPending || !canBuy}
        >
          <ShoppingBag className="size-4" aria-hidden />
          {canBuy ? 'Add to cart' : 'Out of stock'}
        </Button>
        {wishlist}
      </div>
    </form>
  );
}
