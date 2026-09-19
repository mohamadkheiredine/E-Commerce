import type { ProductDto, VariantDto } from '@ecom/contracts';
import type { Product, ProductVariant } from '@/models/product/read';
import { formatMoney } from '@/lib/utils/money';

/** Under this many units, the UI warns. Shared with the cart serializer. */
export const LOW_STOCK_THRESHOLD = 5;

/**
 * API DTO → view model.
 *
 * In the codebase this mirrors, the serializer layer turned snake_case rows into
 * camelCase domain objects. Here the API already speaks camelCase, so the layer's
 * job shifts to what it was always partly doing: deriving the fields the UI needs
 * (`inStock`, `displayPrice`, "from" pricing) in one place, so no component and no
 * page reimplements the rule for what "low stock" means.
 */
export function deserializeVariant(variant: VariantDto, basePrice: number): ProductVariant {
  const price = basePrice + variant.priceDelta;
  return {
    id: variant.id,
    type: variant.type,
    value: variant.value,
    sku: variant.sku,
    price,
    displayPrice: formatMoney(price),
    stock: variant.stock,
    inStock: variant.stock > 0,
    isLowStock: variant.stock > 0 && variant.stock < LOW_STOCK_THRESHOLD,
  };
}

export function deserializeProduct(dto: ProductDto): Product {
  const hasVariants = dto.variants.length > 0;
  const variants = dto.variants.map((v) => deserializeVariant(v, dto.basePrice));

  const totalStock = hasVariants ? variants.reduce((sum, v) => sum + v.stock, 0) : dto.stock;

  const prices = variants.filter((v) => v.inStock).map((v) => v.price);
  const minPrice = prices.length ? Math.min(...prices) : dto.basePrice;
  const pricesVary = hasVariants && new Set(variants.map((v) => v.price)).size > 1;

  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    description: dto.description,
    imageUrl: dto.imageUrl,
    category: dto.category,
    basePrice: dto.basePrice,
    displayPrice: formatMoney(dto.basePrice),
    displayPriceFrom: pricesVary ? formatMoney(minPrice) : null,
    hasVariants,
    variantType: hasVariants ? (dto.variants[0]?.type ?? null) : null,
    variants,
    totalStock,
    inStock: totalStock > 0,
    isLowStock: totalStock > 0 && totalStock < LOW_STOCK_THRESHOLD,
  };
}

export function deserializeProducts(dtos: ProductDto[]): Product[] {
  return dtos.map(deserializeProduct);
}
