import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { QuantityControls } from '@/components/features/cart/quantity-controls';
import { RemoveButton } from '@/components/features/cart/remove-button';
import { VariantSelect } from '@/components/features/cart/variant-select';
import type { CartLine as CartLineModel } from '@/models/cart/read';
import { cn } from '@/lib/utils/cn';

/**
 * One line of the cart. Under `sm` it is a stacked card — image beside the title,
 * controls in a row below; from `sm` up it spreads across a row. No table: tables
 * do not reflow, and a cart on a phone is the place that matters most.
 */
export function CartLine({ line }: { line: CartLineModel }) {
  const problem = line.availableStock === 0 ? 'sold-out' : line.exceedsStock ? 'short' : null;

  return (
    <li
      className={cn(
        'grid grid-cols-[5rem_1fr] gap-x-3 gap-y-3 py-4 sm:grid-cols-[6rem_1fr_auto] sm:gap-x-5',
        problem && 'rounded-md bg-warning-light/60 px-3 -mx-3',
      )}
    >
      <Link
        href={`/products/${line.product.slug}`}
        className="relative aspect-square overflow-hidden rounded-md bg-muted sm:row-span-2"
        aria-hidden
        tabIndex={-1}
      >
        <Image src={line.product.imageUrl} alt="" fill sizes="6rem" className="object-cover" />
      </Link>

      <div className="min-w-0">
        <Link href={`/products/${line.product.slug}`} className="font-medium hover:underline">
          {line.product.title}
        </Link>
        <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
          {line.displayUnitPrice}
          {line.quantity > 1 ? ` × ${line.quantity}` : ''}
        </p>

        {line.variant && line.product.variantType ? (
          <div className="mt-2">
            <VariantSelect
              itemId={line.id}
              current={line.variant}
              alternatives={line.alternatives}
              label={line.product.variantType}
            />
          </div>
        ) : null}

        {problem ? (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-warning-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {problem === 'sold-out'
              ? 'This item sold out after you added it. Remove it to check out.'
              : `Only ${line.availableStock} left in stock — reduce the quantity to check out.`}
          </p>
        ) : null}
      </div>

      <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:col-start-3 sm:row-span-2 sm:flex-col sm:items-end sm:justify-start">
        <p className="text-base font-semibold tabular-nums sm:text-lg">{line.displayLineTotal}</p>
        <div className="flex items-center gap-2">
          <QuantityControls
            itemId={line.id}
            quantity={line.quantity}
            max={Math.max(line.quantity, line.availableStock)}
          />
          <RemoveButton itemId={line.id} title={line.product.title} />
        </div>
      </div>
    </li>
  );
}
