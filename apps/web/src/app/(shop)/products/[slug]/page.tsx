import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/features/products/product-detail';
import { fetchProductBySlug } from '@/data-layer/products/server';

type Props = PageProps<'/products/[slug]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  return { title: product?.title ?? 'Product' };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
