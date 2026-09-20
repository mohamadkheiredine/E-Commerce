import type { ProductDto, VariantDto } from '@ecom/contracts';
import type { Product, ProductVariant } from '@/models/product/read';
import { formatMoney } from '@/lib/utils/money';

/** Under this many units, the UI warns. Shared with the cart serializer. */
export const LOW_STOCK_THRESHOLD = 5;

/**
 * Wire DTO → view model.
 *
 * The API speaks snake_case — the same names as the database columns — and the UI
 * speaks camelCase. This layer is the one place that knows both, exactly as the
 * serializers do in the codebase this project mirrors. It also derives the fields
 * the UI needs (`inStock`, `displayPrice`, "from" pricing) here, so no component
 * and no page reimplements the rule for what "low stock" means.
 *
 * `deserialize*` reads the wire; `serialize*` (in the cart and wishlist
 * serializers) writes it. Nothing outside `serializers/` touches a snake_case key.
 */
export function deserializeVariant(variant: VariantDto, basePrice: number): ProductVariant {
  const price = basePrice + variant.price_delta;
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
  const variants = dto.variants.map((v) => deserializeVariant(v, dto.base_price));

  const totalStock = hasVariants ? variants.reduce((sum, v) => sum + v.stock, 0) : dto.stock;

  const prices = variants.filter((v) => v.inStock).map((v) => v.price);
  const minPrice = prices.length ? Math.min(...prices) : dto.base_price;
  const pricesVary = hasVariants && new Set(variants.map((v) => v.price)).size > 1;

  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    description: dto.description,
    imageUrl: dto.image_url,
    category: dto.category,
    basePrice: dto.base_price,
    displayPrice: formatMoney(dto.base_price),
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
