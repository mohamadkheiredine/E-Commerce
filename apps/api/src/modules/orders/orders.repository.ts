import { prisma } from '../../lib/prisma.js';
import type { PrismaClient } from '../../generated/prisma/client.js';

type Db = Pick<PrismaClient, 'order' | 'orderItem' | 'product' | 'variant' | 'cartItem'>;

const withItems = { include: { items: { orderBy: { id: 'asc' as const } } } } as const;

export const ordersRepository = {
  findByIdempotencyKey(userId: string, idempotencyKey: string, db: Db = prisma) {
    return db.order.findFirst({ where: { userId, idempotencyKey }, ...withItems });
  },

  findByOrderNumber(userId: string, orderNumber: string) {
    return prisma.order.findFirst({ where: { userId, orderNumber }, ...withItems });
  },

  create(
    data: {
      userId: string;
      orderNumber: string;
      idempotencyKey: string;
      subtotal: number;
      shipping: number;
      total: number;
      items: {
        productId: string;
        titleSnapshot: string;
        variantLabelSnapshot: string | null;
        unitPrice: number;
        quantity: number;
        lineTotal: number;
      }[];
    },
    db: Db = prisma,
  ) {
    const { items, ...order } = data;
    return db.order.create({ data: { ...order, items: { create: items } }, ...withItems });
  },

  /**
   * Conditional decrement: the WHERE clause re-checks stock inside the transaction,
   * so two checkouts racing for the last unit cannot both succeed. If `count` comes
   * back 0, the stock moved since it was read and the caller aborts.
   */
  decrementProductStock(productId: string, quantity: number, db: Db = prisma) {
    return db.product.updateMany({
      where: { id: productId, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
  },

  decrementVariantStock(variantId: string, quantity: number, db: Db = prisma) {
    return db.variant.updateMany({
      where: { id: variantId, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
  },
};

export type OrderRecord = NonNullable<
  Awaited<ReturnType<typeof ordersRepository.findByOrderNumber>>
>;
