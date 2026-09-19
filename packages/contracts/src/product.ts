import { z } from 'zod';
import { idSchema, minorUnitsSchema } from './common.js';

/**
 * A variant is a purchasable configuration of a product — "Size: Large", "Color: Graphite".
 *
 * `priceDelta` is signed and added to the product's `basePrice`, so a variant can cost
 * more or less than the default without duplicating the base price on every row.
 * Stock lives here rather than on the product because a product can be sold out in Large
 * while Medium is still available.
 */
export const variantSchema = z.object({
  id: idSchema,
  type: z.string(),
  value: z.string(),
  priceDelta: z.number().int(),
  stock: z.number().int().nonnegative(),
  sku: z.string(),
});
export type VariantDto = z.infer<typeof variantSchema>;

export const productSchema = z.object({
  id: idSchema,
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  basePrice: minorUnitsSchema,
  imageUrl: z.string(),
  category: z.string(),
  /**
   * Only meaningful for products with no variants. When `variants` is non-empty the
   * authoritative stock is per-variant, and this field is ignored — resolved in one
   * place by `availableStock()` so no call site has to branch on it.
   */
  stock: z.number().int().nonnegative(),
  variants: z.array(variantSchema),
});
export type ProductDto = z.infer<typeof productSchema>;

export const productListSchema = z.array(productSchema);

export const productSlugParamsSchema = z.object({
  slug: z.string().min(1, { error: 'Product slug is required' }),
});
