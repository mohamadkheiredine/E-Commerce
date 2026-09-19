'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useActionState } from 'react';
import { ShoppingBag, X } from 'lucide-react';
import { moveToCartAction, removeFromWishlistAction } from '@/actions/wishlist-actions';
import { StockBadge } from '@/components/features/products/stock-badge';
import { Button } from '@/components/shared/button';
import { useActionStateToast } from '@/hooks/use-action-state-toast';
import type { WishlistItem as WishlistItemModel } from '@/models/wishlist/read';

/**
 * Move-to-cart for a product with variants needs a choice, so the form carries a
 * native `<select>`; a variantless product moves with one click. Both are plain
 * forms and both work without JavaScript.
 */
export function WishlistItem({ item }: { item: WishlistItemModel }) {
  const [moveState, moveAction, movePending] = useActionState(moveToCartAction, {
    success: false,
    message: '',
  });
  const [removeState, removeAction, removePending] = useActionState(removeFromWishlistAction, {
    success: false,
    message: '',
  });
  useActionStateToast(moveState);
  useActionStateToast(removeState);

  const { product } = item;
  const firstAvailable = product.variants.find((v) => v.inStock);

  return (
    <li className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-3 py-4 sm:grid-cols-[6rem_1fr_auto] sm:gap-x-5">
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-square overflow-hidden rounded-md bg-muted sm:row-span-2"
        aria-hidden
        tabIndex={-1}
      >
        <Image src={product.imageUrl} alt="" fill sizes="6rem" className="object-cover" />
      </Link>

      <div className="min-w-0">
        <Link href={`/products/${product.slug}`} className="font-medium hover:underline">
          {product.title}
        </Link>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {product.displayPriceFrom ? `from ${product.displayPriceFrom}` : product.displayPrice}
          <span className="mx-1.5">·</span>
          Added {item.displayAddedAt}
        </p>
        <StockBadge
          stock={product.totalStock}
          inStock={product.inStock}
          isLowStock={product.isLowStock}
          className="mt-2"
        />
      </div>

      <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1 sm:col-start-3 sm:row-span-2 sm:flex-col sm:items-end">
        <form action={moveAction} className="flex items-center gap-2">
          <input type="hidden" name="productId" value={product.id} />
          {product.hasVariants ? (
            <select
              name="variantId"
              defaultValue={firstAvailable?.id}
              aria-label={product.variantType ?? 'Option'}
              disabled={!product.inStock || movePending}
              className="h-9 rounded-md border bg-background px-2 text-sm disabled:opacity-60"
            >
              {product.variants.map((v) => (
                <option key={v.id} value={v.id} disabled={!v.inStock}>
                  {v.value}
                  {v.inStock ? '' : ' — sold out'}
                </option>
              ))}
            </select>
          ) : null}
          <Button
            type="submit"
            className="h-9 gap-1.5"
            isLoading={movePending}
            disabled={movePending || !product.inStock}
          >
            <ShoppingBag className="size-4" aria-hidden />
            {product.inStock ? 'Move to cart' : 'Sold out'}
          </Button>
        </form>

        <form action={removeAction}>
          <input type="hidden" name="productId" value={product.id} />
          <Button
            type="submit"
            variant="ghost"
            className="h-9 gap-1 px-2 text-muted-foreground hover:text-danger"
            aria-label={`Remove ${product.title} from wishlist`}
            isLoading={removePending}
            disabled={removePending}
          >
            <X className="size-4" aria-hidden />
            <span className="text-xs">Remove</span>
          </Button>
        </form>
      </div>
    </li>
  );
}
