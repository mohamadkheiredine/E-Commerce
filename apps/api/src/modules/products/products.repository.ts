import { prisma } from '../../lib/prisma.js';

const withVariants = {
  include: { variants: { orderBy: { sku: 'asc' as const } } },
} as const;

export const productsRepository = {
  findAll() {
    return prisma.product.findMany({ ...withVariants, orderBy: { createdAt: 'asc' } });
  },

  findBySlug(slug: string) {
    return prisma.product.findUnique({ where: { slug }, ...withVariants });
  },

  findById(id: string) {
    return prisma.product.findUnique({ where: { id }, ...withVariants });
  },
};

export type ProductRecord = NonNullable<Awaited<ReturnType<typeof productsRepository.findBySlug>>>;
