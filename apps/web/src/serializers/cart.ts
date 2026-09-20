import {
  FREE_SHIPPING_THRESHOLD,
  type AddToCartBody,
  type AddToCartPayload,
  type CartDto,
  type CartItemDto,
  type ChangeCartItemVariantPayload,
  type PatchCartItemBody,
  type UpdateCartItemQuantityPayload,
} from '@ecom/contracts';
import type { Cart, CartLine } from '@/models/cart/read';
import { formatMoney } from '@/lib/utils/money';
import { LOW_STOCK_THRESHOLD, deserializeProduct, deserializeVariant } from '@/serializers/product';

export function deserializeCartLine(item: CartItemDto): CartLine {
  const product = deserializeProduct(item.product);
  const variant = item.variant ? deserializeVariant(item.variant, item.product.base_price) : null;

  return {
    id: item.id,
    quantity: item.quantity,
    product,
    variant,
    variantLabel: variant ? `${variant.type}: ${variant.value}` : null,
    unitPrice: item.unit_price,
    displayUnitPrice: formatMoney(item.unit_price),
    lineTotal: item.line_total,
    displayLineTotal: formatMoney(item.line_total),
    availableStock: item.available_stock,
    exceedsStock: item.quantity > item.available_stock,
    isLowStock: item.available_stock > 0 && item.available_stock < LOW_STOCK_THRESHOLD,
    alternatives: product.variants,
  };
}

export function deserializeCart(dto: CartDto): Cart {
  const lines = dto.items.map(deserializeCartLine);
  const gap = FREE_SHIPPING_THRESHOLD - dto.subtotal;

  return {
    lines,
    itemCount: dto.item_count,
    subtotal: dto.subtotal,
    displaySubtotal: formatMoney(dto.subtotal),
    shipping: dto.shipping,
    displayShipping: dto.shipping === 0 ? 'Free' : formatMoney(dto.shipping),
    isShippingFree: dto.shipping === 0,
    displayFreeShippingGap: dto.subtotal > 0 && gap > 0 ? formatMoney(gap) : null,
    total: dto.total,
    displayTotal: formatMoney(dto.total),
    isEmpty: lines.length === 0,
    hasProblems: lines.some((line) => line.exceedsStock || line.availableStock === 0),
  };
}

/*
 * Outbound: the server action's parsed FormData payload (camelCase, the form's field
 * names) → the API's request body (snake_case). The `itemId` fields are not part of
 * the body because they travel in the URL.
 */

export function serializeAddToCartBody(payload: AddToCartPayload): AddToCartBody {
  return {
    product_id: payload.productId,
    ...(payload.variantId ? { variant_id: payload.variantId } : {}),
    quantity: payload.quantity,
  };
}

export function serializeCartItemQuantityBody(
  payload: UpdateCartItemQuantityPayload,
): PatchCartItemBody {
  return { quantity: payload.quantity };
}

export function serializeCartItemVariantBody(
  payload: ChangeCartItemVariantPayload,
): PatchCartItemBody {
  return { variant_id: payload.variantId };
}
