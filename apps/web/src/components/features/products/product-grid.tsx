import { PackageOpen } from 'lucide-react';
import { ProductCard } from '@/components/features/products/product-card';
import type { Product } from '@/models/product/read';

/**
 * 2 columns on phones, 3 on tablets, 4 on laptops, 5 on wide screens. The first
 * row's images are `priority` so the largest contentful paint is not lazy-loaded.
 */
export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
        <PackageOpen className="size-10 text-muted-foreground" aria-hidden />
        <p className="font-medium">Nothing to show yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          The catalogue is empty. If you are running this locally, seed the database with{' '}
          <code className="rounded bg-muted px-1 py-0.5">npm run db:seed</code>.
        </p>
      </div>
    );
  }

  return (
    <ul
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5"
      aria-label="Products"
    >
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < 4} />
        </li>
      ))}
    </ul>
  );
}
