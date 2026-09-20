import { z } from 'zod';
import { idSchema } from './common';
import { productSchema } from './product';

export const wishlistItemSchema = z.object({
  id: idSchema,
  product: productSchema,
  added_at: z.string(),
});
export type WishlistItemDto = z.infer<typeof wishlistItemSchema>;

export const wishlistSchema = z.object({
  items: z.array(wishlistItemSchema),
  item_count: z.number().int().nonnegative(),
});
export type WishlistDto = z.infer<typeof wishlistSchema>;

export const addToWishlistPayloadSchema = z.object({
  productId: idSchema,
});
export type AddToWishlistPayload = z.infer<typeof addToWishlistPayloadSchema>;

export const addToWishlistBodySchema = z.object({ product_id: idSchema }).strict();
export type AddToWishlistBody = z.infer<typeof addToWishlistBodySchema>;

export const removeFromWishlistPayloadSchema = z.object({
  productId: idSchema,
});
export type RemoveFromWishlistPayload = z.infer<typeof removeFromWishlistPayloadSchema>;

/**
 * Moving to the cart is one operation rather than add-then-remove, so a failure
 * part-way cannot leave the item in both lists or neither.
 */
export const moveToCartPayloadSchema = z.object({
  productId: idSchema,
  variantId: z.preprocess(
    (v) => (v === '' || v === 'undefined' ? undefined : v),
    idSchema.optional(),
  ),
});
export type MoveToCartPayload = z.infer<typeof moveToCartPayloadSchema>;

export const wishlistProductIdParamsSchema = z.object({
  productId: idSchema,
});

/** API body for move-to-cart; the product comes from the path. */
export const moveToCartBodySchema = z.object({ variant_id: idSchema.optional() }).strict();
export type MoveToCartBody = z.infer<typeof moveToCartBodySchema>;
