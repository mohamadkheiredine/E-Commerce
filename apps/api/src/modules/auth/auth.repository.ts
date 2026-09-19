import { prisma } from '../../lib/prisma.js';

/**
 * The only file in this module that touches Prisma. The service layer above it
 * reasons about tokens and families; this layer reasons about rows.
 */
export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });
  },

  createRefreshToken(data: { userId: string; tokenHash: string; family: string; expiresAt: Date }) {
    return prisma.refreshToken.create({ data });
  },

  findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  },

  /** Marks a token as spent and records its successor, so the chain is auditable. */
  revokeRefreshToken(id: string, replacedById?: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date(), replacedById: replacedById ?? null },
    });
  },

  /** Revokes every token descended from one login. Used on logout and on reuse detection. */
  revokeFamily(family: string) {
    return prisma.refreshToken.updateMany({
      where: { family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  /** Housekeeping so the table does not grow without bound. Safe to run any time. */
  deleteExpiredTokens() {
    return prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  },
};
