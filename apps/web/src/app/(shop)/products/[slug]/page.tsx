import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AddToCartForm } from '@/components/features/cart/add-to-cart-form';
import { ProductDetail } from '@/components/features/products/product-detail';
import { WishlistButton } from '@/components/features/wishlist/wishlist-button';
import { fetchProductBySlug } from '@/data-layer/products/server';
import { fetchWishlist } from '@/data-layer/wishlist/server';

type Props = PageProps<'/products/[slug]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  return { title: product?.title ?? 'Product' };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  // Independent reads, so they run in parallel rather than one after the other.
  const [product, wishlist] = await Promise.all([fetchProductBySlug(slug), fetchWishlist()]);
  if (!product) notFound();

  return (
    <ProductDetail
      product={product}
      purchase={
        <AddToCartForm
          product={product}
          wishlist={
            <WishlistButton productId={product.id} isWished={wishlist.productIds.has(product.id)} />
          }
        />
      }
    />
  );
}
