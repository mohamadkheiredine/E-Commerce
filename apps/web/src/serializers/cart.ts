import { FREE_SHIPPING_THRESHOLD, type CartDto, type CartItemDto } from '@ecom/contracts';
import type { Cart, CartLine } from '@/models/cart/read';
import { formatMoney } from '@/lib/utils/money';
import { LOW_STOCK_THRESHOLD, deserializeProduct, deserializeVariant } from '@/serializers/product';

export function deserializeCartLine(item: CartItemDto): CartLine {
  const product = deserializeProduct(item.product);
  const variant = item.variant ? deserializeVariant(item.variant, item.product.basePrice) : null;

  return {
    id: item.id,
    quantity: item.quantity,
    product,
    variant,
    variantLabel: variant ? `${variant.type}: ${variant.value}` : null,
    unitPrice: item.unitPrice,
    displayUnitPrice: formatMoney(item.unitPrice),
    lineTotal: item.lineTotal,
    displayLineTotal: formatMoney(item.lineTotal),
    availableStock: item.availableStock,
    exceedsStock: item.quantity > item.availableStock,
    isLowStock: item.availableStock > 0 && item.availableStock < LOW_STOCK_THRESHOLD,
    alternatives: product.variants,
  };
}

export function deserializeCart(dto: CartDto): Cart {
  const lines = dto.items.map(deserializeCartLine);
  const gap = FREE_SHIPPING_THRESHOLD - dto.subtotal;

  return {
    lines,
    itemCount: dto.itemCount,
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
