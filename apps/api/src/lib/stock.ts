/**
 * Stock lives in one of two places depending on the product: on the product row for
 * variantless products, on the variant row otherwise. Every caller that needs "how
 * many can I sell of this?" goes through here, so that rule exists exactly once.
 */
type StockedProduct = { stock: number; variants: { id: string; stock: number }[] };

export function hasVariants(product: { variants: unknown[] }): boolean {
  return product.variants.length > 0;
}

export function availableStock(product: StockedProduct, variantId: string | null): number {
  if (!hasVariants(product)) return product.stock;
  const variant = product.variants.find((v) => v.id === variantId);
  return variant?.stock ?? 0;
}

/** For a listing badge: the product is buyable if any configuration is in stock. */
export function totalStock(product: StockedProduct): number {
  return hasVariants(product)
    ? product.variants.reduce((sum, v) => sum + v.stock, 0)
    : product.stock;
}

/** Unit price for a configuration: base plus the variant's signed delta. */
export function resolveUnitPrice(
  product: { basePrice: number },
  variant: { priceDelta: number } | null,
): number {
  return product.basePrice + (variant?.priceDelta ?? 0);
}
