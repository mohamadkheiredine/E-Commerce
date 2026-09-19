import { z } from 'zod';
import { idSchema, minorUnitsSchema, quantitySchema } from './common';
import { productSchema, variantSchema } from './product';

export const cartItemSchema = z.object({
  id: idSchema,
  quantity: z.number().int().positive(),
  product: productSchema,
  variant: variantSchema.nullable(),
  /** Resolved unit price: the product's basePrice plus the chosen variant's delta. */
  unitPrice: minorUnitsSchema,
  lineTotal: minorUnitsSchema,
  /** Stock available for this line's specific configuration, for clamping the stepper. */
  availableStock: z.number().int().nonnegative(),
});
export type CartItemDto = z.infer<typeof cartItemSchema>;

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  subtotal: minorUnitsSchema,
  shipping: minorUnitsSchema,
  total: minorUnitsSchema,
  itemCount: z.number().int().nonnegative(),
});
export type CartDto = z.infer<typeof cartSchema>;

/**
 * `FormData` delivers every value as a string, so the payload schemas coerce.
 * The matching `*FormSchema` variants keep real JS types for react-hook-form.
 *
 * `variantId` is optional because variantless products exist; the API rejects a
 * missing variantId for a product that has variants with VARIANT_REQUIRED rather
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

export const updateCartItemQuantityPayloadSchema = z.object({
  itemId: idSchema,
  quantity: z.preprocess((v) => (v === '' ? undefined : Number(v)), quantitySchema),
});
export type UpdateCartItemQuantityPayload = z.infer<typeof updateCartItemQuantityPayloadSchema>;

/**
 * Changing a line's variant is the interesting cart operation: the target variant may
 * already be present as a separate line, in which case the two must merge rather than
 * collide with the unique(userId, productId, variantId) constraint.
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
