import 'server-only';
import { cache } from 'react';
import {
  cartSchema,
  type AddToCartPayload,
  type ChangeCartItemVariantPayload,
  type RemoveCartItemPayload,
  type UpdateCartItemQuantityPayload,
} from '@ecom/contracts';
import { getUserOrRedirect } from '@/lib/auth/get-user-or-redirect';
import type { Cart } from '@/models/cart/read';
import {
  deserializeCart,
  serializeAddToCartBody,
  serializeCartItemQuantityBody,
  serializeCartItemVariantBody,
} from '@/serializers/cart';

/**
 * The cart is deliberately NOT wrapped in `withUserCache`. It is user-scoped and
 * changes on every interaction; caching it keyed by user buys nothing (the API call
 * is a local SQLite read) and adds a stale-cart failure mode. React's `cache()` still
 * dedupes the layout's badge and the page's list within one render.
 *
 * Mutations return the updated cart and call `refresh()` from the action so the
 * router re-renders the route and its layout — which is how the header badge stays
 * right without any client-side state.
 */
export const fetchCart = cache(async (): Promise<Cart> => {
  const { api } = await getUserOrRedirect();
  const dto = await api.get<unknown>('/cart');
  return deserializeCart(cartSchema.parse(dto));
});

export async function addToCart(payload: AddToCartPayload): Promise<Cart> {
  const { api } = await getUserOrRedirect();
  const dto = await api.post<unknown>('/cart/items', serializeAddToCartBody(payload));
  return deserializeCart(cartSchema.parse(dto));
}

export async function updateCartItemQuantity(
  payload: UpdateCartItemQuantityPayload,
): Promise<Cart> {
  const { api } = await getUserOrRedirect();
  const dto = await api.patch<unknown>(
    `/cart/items/${encodeURIComponent(payload.itemId)}`,
    serializeCartItemQuantityBody(payload),
  );
  return deserializeCart(cartSchema.parse(dto));
}

export async function changeCartItemVariant(payload: ChangeCartItemVariantPayload): Promise<Cart> {
  const { api } = await getUserOrRedirect();
  const dto = await api.patch<unknown>(
    `/cart/items/${encodeURIComponent(payload.itemId)}`,
    serializeCartItemVariantBody(payload),
  );
  return deserializeCart(cartSchema.parse(dto));
}

export async function removeCartItem(payload: RemoveCartItemPayload): Promise<Cart> {
  const { api } = await getUserOrRedirect();
  const dto = await api.delete<unknown>(`/cart/items/${encodeURIComponent(payload.itemId)}`);
  return deserializeCart(cartSchema.parse(dto));
}
