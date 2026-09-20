import type { LoginResponse, RefreshResponse, SignupResponse, UserDto } from '@ecom/contracts';
import { env } from '../../config/env.js';
import { Prisma } from '../../generated/prisma/client.js';
import {
  EmailTakenError,
  InvalidCredentialsError,
  SessionExpiredError,
  TokenReuseDetectedError,
  UnauthenticatedError,
} from '../../lib/errors.js';
import { signAccessToken } from '../../lib/jwt.js';
import { logger } from '../../lib/logger.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { generateRefreshToken, hashToken, newTokenFamily } from '../../lib/tokens.js';
import { authRepository } from './auth.repository.js';

/**
 * A replay of an already-rotated refresh token within this window is treated as a
 * race (two tabs refreshing at once), not as theft. Beyond it, it is theft.
 *
 * Without this, rotation schemes log honest users out whenever two requests refresh
 * concurrently — a well-known failure mode that hosted auth providers solve with the
 * same grace period.
 */
const REUSE_GRACE_MS = 10_000;

/**
 * Verifying against this when no user matches keeps the failure path's timing close
 * to the real-password path, so response time does not reveal whether an email is
 * registered. Computed once at startup.
 */
const DUMMY_HASH = await hashPassword('timing-equalisation-placeholder');

type UserRecord = Pick<UserDto, 'id' | 'email' | 'name'>;

/** The same normalisation login applies, so `Demo@Shop.test` and `demo@shop.test` are one account. */
const normaliseEmail = (email: string) => email.toLowerCase().trim();

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

async function issueTokenPair(user: UserRecord, family: string) {
  const accessToken = await signAccessToken({ sub: user.id, email: user.email, name: user.name });

  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  const record = await authRepository.createRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    family,
    expiresAt,
  });

  return { accessToken, refreshToken, record };
}

export const authService = {
  /**
   * Creates the account and signs it in, so the caller receives the same shape as
   * login and can set cookies without a second round trip.
   *
   * The pre-check gives a clean error in the common case; the catch handles the
   * race where two requests for the same email pass the check together and one of
   * them loses at the unique index. Both paths surface the identical error, so the
   * client cannot tell which one it hit.
   */
  async signup(input: { name: string; email: string; password: string }): Promise<SignupResponse> {
    const email = normaliseEmail(input.email);

    if (await authRepository.findUserByEmail(email)) {
      throw new EmailTakenError();
    }

    const passwordHash = await hashPassword(input.password);

    let user: UserRecord;
    try {
      user = await authRepository.createUser({ email, name: input.name, passwordHash });
    } catch (error) {
      if (isUniqueViolation(error)) throw new EmailTakenError();
      throw error;
    }

    const { accessToken, refreshToken } = await issueTokenPair(user, newTokenFamily());

    return { user, accessToken, refreshToken };
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await authRepository.findUserByEmail(normaliseEmail(email));

    // Same work, same error, whether the account exists or not.
    const valid = await verifyPassword(user?.passwordHash ?? DUMMY_HASH, password);
    if (!user || !valid) {
      throw new InvalidCredentialsError();
    }

    const { accessToken, refreshToken } = await issueTokenPair(user, newTokenFamily());

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    };
  },

  /**
   * Rotation with reuse detection.
   *
   * Every refresh retires the presented token and issues a new one in the same family.
   * If a token that has *already* been retired is presented again, someone other than
   * the current holder has it — the legitimate client would be using its successor.
   * The whole family is revoked, which also logs out the real user. That is the
   * intended trade-off: a forced re-login beats a silently persistent attacker.
   */
  async refresh(presentedToken: string): Promise<RefreshResponse> {
    const record = await authRepository.findRefreshTokenByHash(hashToken(presentedToken));

    if (!record) {
      throw new UnauthenticatedError('Invalid refresh token');
    }

    if (record.revokedAt) {
      // A token retired by rotation has a successor. One revoked deliberately — by
      // logout or by an earlier reuse detection — does not, and no grace applies to it.
      const retiredByRotation = record.replacedById !== null;
      if (!retiredByRotation) {
        throw new SessionExpiredError();
      }

      const sinceRotation = Date.now() - record.revokedAt.getTime();
      if (sinceRotation > REUSE_GRACE_MS) {
        logger.warn(
          { userId: record.userId, family: record.family },
          'Refresh token reuse detected; revoking family',
        );
        await authRepository.revokeFamily(record.family);
        throw new TokenReuseDetectedError();
      }
      // Inside the grace window: concurrent refresh, not theft. Fall through and
      // issue a fresh pair off this token as if it were still current.
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      throw new SessionExpiredError();
    }

    const next = await issueTokenPair(record.user, record.family);

    if (!record.revokedAt) {
      await authRepository.revokeRefreshToken(record.id, next.record.id);
    }

    return { accessToken: next.accessToken, refreshToken: next.refreshToken };
  },

  /**
   * Logout revokes the whole family, not just the presented token: "sign out" should
   * mean every token descended from this login stops working, including any the
   * client might still have in flight.
   */
  async logout(presentedToken: string | undefined): Promise<void> {
    if (!presentedToken) return;
    const record = await authRepository.findRefreshTokenByHash(hashToken(presentedToken));
    if (record) {
      await authRepository.revokeFamily(record.family);
    }
  },

  async me(userId: string): Promise<UserDto> {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new UnauthenticatedError();
    return user;
  },
};
