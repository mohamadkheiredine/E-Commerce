import type { Metadata } from 'next';
import { ProductGrid } from '@/components/features/products/product-grid';
import { fetchProducts } from '@/data-layer/products/server';

export const metadata: Metadata = { title: 'Products' };

export default async function ProductsPage() {
  const products = await fetchProducts();

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">All products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </p>
        </div>
      </header>
      <ProductGrid products={products} />
    </section>
  );
}
