import 'server-only';
import { cache } from 'react';
import { productListSchema, productSchema } from '@ecom/contracts';
import { withUserCache } from '@/data-layer/user-cache';
import { isApiClientError } from '@/lib/api/errors';
import type { Product } from '@/models/product/read';
import { deserializeProduct, deserializeProducts } from '@/serializers/product';

export const PRODUCTS_TAG = 'products';

/**
 * The catalogue is shared and changes rarely, so it is cached across users and
 * invalidated by tag when stock moves (checkout calls `revalidateTag`).
 *
 * `cache()` from React dedupes within one render; `withUserCache` persists across
 * requests. Both, as in the codebase this mirrors.
 */
export const fetchProducts = withUserCache(
  [PRODUCTS_TAG],
  cache(async (api): Promise<Product[]> => {
    const dto = await api.get<unknown>('/products');
    return deserializeProducts(productListSchema.parse(dto));
  }),
  { tags: [PRODUCTS_TAG], scope: 'shared', revalidate: 60 },
);

/**
 * Returns null for an unknown slug so the page can call `notFound()` and render the
 * route's not-found UI, rather than throwing into the error boundary.
 */
export const fetchProductBySlug = withUserCache(
  [PRODUCTS_TAG, 'by-slug'],
  cache(async (api, _user, slug: string): Promise<Product | null> => {
    try {
      const dto = await api.get<unknown>(`/products/${encodeURIComponent(slug)}`);
      return deserializeProduct(productSchema.parse(dto));
    } catch (error) {
      if (isApiClientError(error) && error.code === 'NOT_FOUND') return null;
      throw error;
    }
  }),
  { tags: [PRODUCTS_TAG], scope: 'shared', revalidate: 60 },
);
