import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/shared/card';
import { StockBadge } from '@/components/features/products/stock-badge';
import type { Product } from '@/models/product/read';
import { cn } from '@/lib/utils/cn';

/**
 * The whole card is one link — a large, obvious tap target on mobile — with the
 * title as the accessible name. Everything else inside is presentational.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring">
      <Link
        href={`/products/${product.slug}`}
        className="absolute inset-0 z-10 rounded-[inherit] outline-none"
        aria-label={product.title}
      />

      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <Image
          src={product.imageUrl}
          alt=""
          fill
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className={cn(
            'object-cover transition-transform duration-300 group-hover:scale-[1.03]',
            !product.inStock && 'opacity-60 grayscale',
          )}
          priority={priority}
        />
      </div>

      <div className="flex flex-col gap-1.5 p-3 sm:p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {product.category}
        </p>
        <h2 className="line-clamp-2 text-sm font-medium leading-snug sm:text-base">
          {product.title}
        </h2>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-base font-semibold tabular-nums sm:text-lg">
            {product.displayPriceFrom ? (
              <>
                <span className="text-xs font-normal text-muted-foreground">from </span>
                {product.displayPriceFrom}
              </>
            ) : (
              product.displayPrice
            )}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <StockBadge
            stock={product.totalStock}
            inStock={product.inStock}
            isLowStock={product.isLowStock}
          />
          {product.hasVariants ? (
            <span className="text-xs text-muted-foreground">
              {product.variants.length} {product.variantType?.toLowerCase() ?? 'option'}s
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
