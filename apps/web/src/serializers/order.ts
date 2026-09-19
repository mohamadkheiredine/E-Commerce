import type { OrderDto, OrderItemDto, OrderStatus } from '@ecom/contracts';
import type { Order, OrderLine } from '@/models/order/read';
import { formatMoney } from '@/lib/utils/money';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: 'Order placed',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  CANCELLED: 'Cancelled',
};

const dateFormatter = new Intl.DateTimeFormat('en-AE', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function deserializeOrderLine(item: OrderItemDto): OrderLine {
  return {
    id: item.id,
    productId: item.productId,
    title: item.titleSnapshot,
    variantLabel: item.variantLabelSnapshot,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    displayUnitPrice: formatMoney(item.unitPrice),
    lineTotal: item.lineTotal,
    displayLineTotal: formatMoney(item.lineTotal),
  };
}

export function deserializeOrder(dto: OrderDto): Order {
  const lines = dto.items.map(deserializeOrderLine);
  const placedAt = new Date(dto.placedAt);
  return {
    id: dto.id,
    orderNumber: dto.orderNumber,
    status: dto.status,
    displayStatus: STATUS_LABELS[dto.status],
    lines,
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    subtotal: dto.subtotal,
    displaySubtotal: formatMoney(dto.subtotal),
    shipping: dto.shipping,
    displayShipping: dto.shipping === 0 ? 'Free' : formatMoney(dto.shipping),
    total: dto.total,
    displayTotal: formatMoney(dto.total),
    placedAt,
    displayPlacedAt: dateFormatter.format(placedAt),
  };
}
