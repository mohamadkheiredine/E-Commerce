import { prisma } from '../../lib/prisma.js';
import type { PrismaClient } from '../../generated/prisma/client.js';

/** A transaction client or the root client — the repository does not care which. */
type Db = Pick<PrismaClient, 'cartItem'>;

const withProductAndVariant = {
  include: {
    product: { include: { variants: { orderBy: { sku: 'asc' as const } } } },
    variant: true,
  },
} as const;

export const cartRepository = {
  findItems(userId: string, db: Db = prisma) {
    return db.cartItem.findMany({
      where: { userId },
      ...withProductAndVariant,
      orderBy: { createdAt: 'asc' },
    });
  },

  /** Scoped by user in the query itself, so one user's item id is a 404 for another. */
  findItem(userId: string, id: string, db: Db = prisma) {
    return db.cartItem.findFirst({ where: { id, userId }, ...withProductAndVariant });
  },

  /**
   * The line for an exact (user, product, variant) configuration. Done as findFirst
   * rather than through the unique constraint because SQLite treats NULL variantIds
   * as distinct, so the constraint alone would not catch a variantless duplicate.
   */
  findLine(userId: string, productId: string, variantId: string | null, db: Db = prisma) {
    return db.cartItem.findFirst({ where: { userId, productId, variantId } });
  },

  create(
    data: { userId: string; productId: string; variantId: string | null; quantity: number },
    db: Db = prisma,
  ) {
    return db.cartItem.create({ data });
  },

  update(id: string, data: { quantity?: number; variantId?: string }, db: Db = prisma) {
    return db.cartItem.update({ where: { id }, data });
  },

  delete(id: string, db: Db = prisma) {
    return db.cartItem.delete({ where: { id } });
  },

  deleteAll(userId: string, db: Db = prisma) {
    return db.cartItem.deleteMany({ where: { userId } });
  },
};

export type CartItemRecord = Awaited<ReturnType<typeof cartRepository.findItems>>[number];
