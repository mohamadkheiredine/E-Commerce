import { z } from 'zod';
import { idSchema, minorUnitsSchema, quantitySchema } from './common';
import { productSchema, variantSchema } from './product';

export const cartItemSchema = z.object({
  id: idSchema,
  quantity: z.number().int().positive(),
  product: productSchema,
  variant: variantSchema.nullable(),
  /** Resolved unit price: the product's base_price plus the chosen variant's delta. */
  unit_price: minorUnitsSchema,
  line_total: minorUnitsSchema,
  /** Stock available for this line's specific configuration, for clamping the stepper. */
  available_stock: z.number().int().nonnegative(),
});
export type CartItemDto = z.infer<typeof cartItemSchema>;

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  subtotal: minorUnitsSchema,
  shipping: minorUnitsSchema,
  total: minorUnitsSchema,
  item_count: z.number().int().nonnegative(),
});
export type CartDto = z.infer<typeof cartSchema>;

/**
 * Three schemas per mutation, each for one boundary:
 *
 * - `*FormSchema`    — react-hook-form in the browser. Real JS types, friendly copy.
 * - `*PayloadSchema` — the server action parsing `FormData`, where every value is a
 *                      string, so these coerce. Keys are the form's field names.
 * - `*BodySchema`    — what crosses the wire to the API and what the API validates.
 *                      snake_case, like every other wire shape.
 *
 * The web app's serializers map payload → body; nothing else knows both shapes.
 *
 * `variantId` is optional because variantless products exist; the API rejects a
 * missing variant for a product that has variants with VARIANT_REQUIRED rather
 * than silently picking one.
 */
export const addToCartFormSchema = z.object({
  productId: idSchema,
  variantId: idSchema.optional(),
  quantity: quantitySchema,
});
export type AddToCartFormPayload = z.infer<typeof addToCartFormSchema>;

export const addToCartPayloadSchema = z.object({
  productId: idSchema,
  variantId: z.preprocess(
    (v) => (v === '' || v === 'undefined' ? undefined : v),
    idSchema.optional(),
  ),
  quantity: z.preprocess((v) => (v === '' || v === undefined ? 1 : Number(v)), quantitySchema),
});
export type AddToCartPayload = z.infer<typeof addToCartPayloadSchema>;

export const addToCartBodySchema = z
  .object({
    product_id: idSchema,
    variant_id: idSchema.optional(),
    quantity: quantitySchema,
  })
  .strict();
export type AddToCartBody = z.infer<typeof addToCartBodySchema>;

export const updateCartItemQuantityPayloadSchema = z.object({
  itemId: idSchema,
  quantity: z.preprocess((v) => (v === '' ? undefined : Number(v)), quantitySchema),
});
export type UpdateCartItemQuantityPayload = z.infer<typeof updateCartItemQuantityPayloadSchema>;

/**
 * Changing a line's variant is the interesting cart operation: the target variant may
 * already be present as a separate line, in which case the two must merge rather than
 * collide with the unique(user_id, product_id, variant_id) constraint.
 */
export const changeCartItemVariantPayloadSchema = z.object({
  itemId: idSchema,
  variantId: idSchema,
});
export type ChangeCartItemVariantPayload = z.infer<typeof changeCartItemVariantPayloadSchema>;

export const removeCartItemPayloadSchema = z.object({
  itemId: idSchema,
});
export type RemoveCartItemPayload = z.infer<typeof removeCartItemPayloadSchema>;

/** Route params for the item endpoints. */
export const cartItemIdParamsSchema = z.object({
  id: idSchema,
});

/** The API's PATCH body: change the quantity or the variant, never both at once. */
export const patchCartItemBodySchema = z.union([
  z.object({ quantity: quantitySchema }).strict(),
  z.object({ variant_id: idSchema }).strict(),
]);
export type PatchCartItemBody = z.infer<typeof patchCartItemBodySchema>;

/** Flat-rate shipping under the free-shipping threshold. Minor units. */
export const SHIPPING_FLAT_RATE = 2500;
export const FREE_SHIPPING_THRESHOLD = 50000;
