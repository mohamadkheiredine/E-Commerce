import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { StockBadge } from '@/components/features/products/stock-badge';
import type { Product } from '@/models/product/read';
import { cn } from '@/lib/utils/cn';

/**
 * Two columns from `md` up, stacked below. The purchase controls are passed in as
 * a slot so this component stays a pure presentation of the product and the form
 * (which owns its own state and server action) lives beside it.
 */
export function ProductDetail({ product, purchase }: { product: Product; purchase?: ReactNode }) {
  return (
    <article className="grid gap-6 md:grid-cols-2 md:gap-10 lg:gap-14">
      <div className="space-y-4">
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:hidden"
        >
          <ChevronLeft className="size-4" aria-hidden />
          All products
        </Link>
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className={cn('object-cover', !product.inStock && 'opacity-60 grayscale')}
            priority
          />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <Link
            href="/products"
            className="mb-3 hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:inline-flex"
          >
            <ChevronLeft className="size-4" aria-hidden />
            All products
          </Link>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {product.category}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {product.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-2xl font-semibold tabular-nums">
              {product.displayPriceFrom ? (
                <>
                  <span className="text-sm font-normal text-muted-foreground">from </span>
                  {product.displayPriceFrom}
                </>
              ) : (
                product.displayPrice
              )}
            </p>
            <StockBadge
              stock={product.totalStock}
              inStock={product.inStock}
              isLowStock={product.isLowStock}
              exact
            />
          </div>
        </div>

        {purchase ?? <VariantAvailability product={product} />}

        <section className="space-y-2 border-t pt-6">
          <h2 className="text-sm font-semibold">About this product</h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {product.description}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Category</dt>
            <dd>{product.category}</dd>
            <dt className="text-muted-foreground">Quantity in stock</dt>
            <dd className="tabular-nums">
              {product.hasVariants
                ? `${product.totalStock} across all options`
                : product.totalStock}
            </dd>
          </dl>
        </section>
      </div>
    </article>
  );
}

/** Read-only availability per option; replaced by the purchase form once the cart lands. */
function VariantAvailability({ product }: { product: Product }) {
  if (!product.hasVariants) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold">{product.variantType}</h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {product.variants.map((variant) => (
          <li
            key={variant.id}
            className={cn(
              'flex flex-col rounded-md border px-3 py-2 text-sm',
              !variant.inStock && 'border-dashed text-muted-foreground line-through',
            )}
          >
            <span className="font-medium">{variant.value}</span>
            <span className="text-xs tabular-nums text-muted-foreground no-underline">
              {variant.inStock ? `${variant.stock} in stock · ${variant.displayPrice}` : 'Sold out'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
