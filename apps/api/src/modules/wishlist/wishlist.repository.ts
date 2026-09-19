import { prisma } from '../../lib/prisma.js';

const withProduct = {
  include: { product: { include: { variants: { orderBy: { sku: 'asc' as const } } } } },
} as const;

export const wishlistRepository = {
  findItems(userId: string) {
    return prisma.wishlistItem.findMany({
      where: { userId },
      ...withProduct,
      orderBy: { createdAt: 'desc' },
    });
  },

  findItem(userId: string, productId: string) {
    return prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
      ...withProduct,
    });
  },

  create(userId: string, productId: string) {
    return prisma.wishlistItem.create({ data: { userId, productId } });
  },

  delete(userId: string, productId: string) {
    return prisma.wishlistItem.deleteMany({ where: { userId, productId } });
  },
};

export type WishlistItemRecord = Awaited<ReturnType<typeof wishlistRepository.findItems>>[number];
