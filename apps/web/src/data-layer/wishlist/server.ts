import 'server-only';
import { cache } from 'react';
import {
  cartSchema,
  wishlistSchema,
  type AddToWishlistPayload,
  type MoveToCartPayload,
  type RemoveFromWishlistPayload,
} from '@ecom/contracts';
import { z } from 'zod';
import { getUserOrRedirect } from '@/lib/auth/get-user-or-redirect';
import type { Wishlist } from '@/models/wishlist/read';
import {
  deserializeWishlist,
  serializeAddToWishlistBody,
  serializeMoveToCartBody,
} from '@/serializers/wishlist';

/** Uncached for the same reason the cart is: user-scoped and mutated on every click. */
export const fetchWishlist = cache(async (): Promise<Wishlist> => {
  const { api } = await getUserOrRedirect();
  const dto = await api.get<unknown>('/wishlist');
  return deserializeWishlist(wishlistSchema.parse(dto));
});

export async function addToWishlist(payload: AddToWishlistPayload): Promise<Wishlist> {
  const { api } = await getUserOrRedirect();
  const dto = await api.post<unknown>('/wishlist/items', serializeAddToWishlistBody(payload));
  return deserializeWishlist(wishlistSchema.parse(dto));
}

export async function removeFromWishlist(payload: RemoveFromWishlistPayload): Promise<Wishlist> {
  const { api } = await getUserOrRedirect();
  const dto = await api.delete<unknown>(`/wishlist/items/${encodeURIComponent(payload.productId)}`);
  return deserializeWishlist(wishlistSchema.parse(dto));
}

const moveResultSchema = z.object({ cart: cartSchema, wishlist: wishlistSchema });

export async function moveWishlistItemToCart(payload: MoveToCartPayload): Promise<Wishlist> {
  const { api } = await getUserOrRedirect();
  const dto = await api.post<unknown>(
    `/wishlist/items/${encodeURIComponent(payload.productId)}/move-to-cart`,
    serializeMoveToCartBody(payload),
  );
  return deserializeWishlist(moveResultSchema.parse(dto).wishlist);
}
