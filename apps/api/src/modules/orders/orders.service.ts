import { randomInt } from 'node:crypto';
import { orderStatusSchema, type OrderDto } from '@ecom/contracts';
import { CartEmptyError, InsufficientStockError, NotFoundError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { availableStock, resolveUnitPrice } from '../../lib/stock.js';
import { cartRepository } from '../cart/cart.repository.js';
import { computeShipping } from '../cart/cart.service.js';
import { ordersRepository, type OrderRecord } from './orders.repository.js';

function toOrderDto(order: OrderRecord): OrderDto {
  return {
    id: order.id,
    order_number: order.orderNumber,
    status: orderStatusSchema.parse(order.status),
    items: order.items.map((item) => ({
      id: item.id,
      product_id: item.productId,
      title_snapshot: item.titleSnapshot,
      variant_label_snapshot: item.variantLabelSnapshot,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      line_total: item.lineTotal,
    })),
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    placed_at: order.placedAt.toISOString(),
  };
}

/** Human-friendly, non-sequential, unique enough: ATL-<base36 time>-<4 random>. */
function generateOrderNumber(): string {
  const time = Date.now().toString(36).toUpperCase();
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity
  let suffix = '';
  for (let i = 0; i < 4; i += 1) suffix += alphabet[randomInt(alphabet.length)];
  return `ATL-${time}-${suffix}`;
}

export const ordersService = {
  /**
   * Checkout is one transaction: re-validate every line against *current* stock,
   * decrement it, write the order and its snapshot lines, empty the cart. Any
   * failure rolls all of it back — there is no state where stock has been taken
   * but no order exists, or an order exists but the cart still holds the items.
   *
   * The idempotency key makes a double submit safe: the second request finds the
   * order the first one created and returns it instead of placing another.
   */
  async placeOrder(userId: string, idempotencyKey: string): Promise<OrderDto> {
    const existing = await ordersRepository.findByIdempotencyKey(userId, idempotencyKey);
    if (existing) {
      logger.info(
        { userId, orderNumber: existing.orderNumber },
        'Idempotent replay of place-order',
      );
      return toOrderDto(existing);
    }

    const order = await prisma.$transaction(async (tx) => {
      const items = await cartRepository.findItems(userId, tx);
      if (items.length === 0) throw new CartEmptyError();

      // Validate everything before touching anything, so the error names the first
      // real problem rather than a partial decrement.
      for (const item of items) {
        const available = availableStock(item.product, item.variantId);
        if (item.quantity > available) {
          throw new InsufficientStockError(item.product.title, available);
        }
      }

      for (const item of items) {
        const result = item.variantId
          ? await ordersRepository.decrementVariantStock(item.variantId, item.quantity, tx)
          : await ordersRepository.decrementProductStock(item.productId, item.quantity, tx);

        // The conditional update refused: stock changed between the read and the
        // write (a concurrent checkout). Abort; the transaction rolls back.
        if (result.count === 0) {
          throw new InsufficientStockError(
            item.product.title,
            availableStock(item.product, item.variantId),
          );
        }
      }

      const lines = items.map((item) => {
        const unitPrice = resolveUnitPrice(item.product, item.variant);
        return {
          productId: item.productId,
          titleSnapshot: item.product.title,
          variantLabelSnapshot: item.variant ? `${item.variant.type}: ${item.variant.value}` : null,
          unitPrice,
          quantity: item.quantity,
          lineTotal: unitPrice * item.quantity,
        };
      });

      const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
      const shipping = computeShipping(subtotal);

      const created = await ordersRepository.create(
        {
          userId,
          orderNumber: generateOrderNumber(),
          idempotencyKey,
          subtotal,
          shipping,
          total: subtotal + shipping,
          items: lines,
        },
        tx,
      );

      await cartRepository.deleteAll(userId, tx);

      return created;
    });

    logger.info({ userId, orderNumber: order.orderNumber, total: order.total }, 'Order placed');
    return toOrderDto(order);
  },

  async getByOrderNumber(userId: string, orderNumber: string): Promise<OrderDto> {
    const order = await ordersRepository.findByOrderNumber(userId, orderNumber);
    if (!order) throw new NotFoundError('Order');
    return toOrderDto(order);
  },
};
