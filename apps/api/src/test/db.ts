import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/password.js';

/** Empties every table, children first. Called from `beforeEach` so tests are independent. */
export async function resetDb(): Promise<void> {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

export const TEST_USER = {
  email: 'tester@shop.test',
  password: 'CorrectHorse1!',
  name: 'Test Shopper',
} as const;

export async function createTestUser(
  overrides: Partial<{ email: string; password: string; name: string }> = {},
) {
  const data = { ...TEST_USER, ...overrides };
  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash: await hashPassword(data.password),
    },
  });
}
