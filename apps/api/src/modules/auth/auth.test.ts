import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../lib/prisma.js';
import { hashToken } from '../../lib/tokens.js';
import { api, loginAs } from '../../test/client.js';
import { createTestUser, resetDb, TEST_USER } from '../../test/db.js';

beforeEach(async () => {
  await resetDb();
  await createTestUser();
});

describe('POST /api/v1/auth/login', () => {
  it('returns the user and a token pair for valid credentials', async () => {
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ email: TEST_USER.email, name: TEST_USER.name });
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(typeof res.body.data.refreshToken).toBe('string');
  });

  it('persists the refresh token hashed, never in plaintext', async () => {
    const { refreshToken } = await loginAs(TEST_USER.email, TEST_USER.password);
    const rows = await prisma.refreshToken.findMany();

    expect(rows).toHaveLength(1);
    expect(rows[0]?.tokenHash).toBe(hashToken(refreshToken));
    expect(rows[0]?.tokenHash).not.toBe(refreshToken);
  });

  it('rejects a wrong password with INVALID_CREDENTIALS', async () => {
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects an unknown email with the identical response, so accounts cannot be enumerated', async () => {
    const [wrongPassword, unknownEmail] = await Promise.all([
      api().post('/api/v1/auth/login').send({ email: TEST_USER.email, password: 'wrong' }),
      api().post('/api/v1/auth/login').send({ email: 'nobody@shop.test', password: 'wrong' }),
    ]);

    expect(unknownEmail.status).toBe(wrongPassword.status);
    expect(unknownEmail.body.error.code).toBe(wrongPassword.body.error.code);
    expect(unknownEmail.body.error.message).toBe(wrongPassword.body.error.message);
  });

  it('is case-insensitive on email', async () => {
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email.toUpperCase(), password: TEST_USER.password });
    expect(res.status).toBe(200);
  });

  it('returns field-level details for a malformed body', async () => {
    const res = await api().post('/api/v1/auth/login').send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toHaveProperty('email');
    expect(res.body.error.details).toHaveProperty('password');
    expect(typeof res.body.requestId).toBe('string');
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns the caller for a valid access token', async () => {
    const { accessToken } = await loginAs(TEST_USER.email, TEST_USER.password);
    const res = await api().get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ email: TEST_USER.email, name: TEST_USER.name });
  });

  it('rejects a missing token with UNAUTHENTICATED', async () => {
    const res = await api().get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects a tampered token', async () => {
    const { accessToken } = await loginAs(TEST_USER.email, TEST_USER.password);
    const tampered = accessToken.slice(0, -4) + 'AAAA';
    const res = await api().get('/api/v1/auth/me').set('Authorization', `Bearer ${tampered}`);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/refresh — rotation', () => {
  it('issues a new pair and retires the presented token', async () => {
    const first = await loginAs(TEST_USER.email, TEST_USER.password);

    const res = await api().post('/api/v1/auth/refresh').send({ refreshToken: first.refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.refreshToken).not.toBe(first.refreshToken);
    expect(res.body.data.accessToken).not.toBe(first.accessToken);

    const old = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(first.refreshToken) },
    });
    const next = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(res.body.data.refreshToken) },
    });
    expect(old?.revokedAt).not.toBeNull();
    expect(old?.replacedById).toBe(next?.id);
    expect(next?.revokedAt).toBeNull();
    expect(next?.family).toBe(old?.family);
  });

  it('tolerates a replay inside the grace window (two tabs refreshing at once)', async () => {
    const first = await loginAs(TEST_USER.email, TEST_USER.password);

    const tabA = await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first.refreshToken });
    const tabB = await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first.refreshToken });

    expect(tabA.status).toBe(200);
    expect(tabB.status).toBe(200);
    // Both tabs hold valid, distinct tokens; nobody got logged out.
    expect(tabB.body.data.refreshToken).not.toBe(tabA.body.data.refreshToken);
    const stillValid = await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tabA.body.data.refreshToken });
    expect(stillValid.status).toBe(200);
  });

  it('treats a replay outside the grace window as theft and revokes the whole family', async () => {
    const first = await loginAs(TEST_USER.email, TEST_USER.password);
    const rotated = await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first.refreshToken });
    expect(rotated.status).toBe(200);

    // Move the revocation into the past, beyond the grace window.
    await prisma.refreshToken.update({
      where: { tokenHash: hashToken(first.refreshToken) },
      data: { revokedAt: new Date(Date.now() - 60_000) },
    });

    const replay = await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first.refreshToken });
    expect(replay.status).toBe(401);
    expect(replay.body.error.code).toBe('TOKEN_REUSE_DETECTED');

    // The legitimate successor is dead too — that is the point.
    const successor = await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: rotated.body.data.refreshToken });
    expect(successor.status).toBe(401);

    const live = await prisma.refreshToken.count({ where: { revokedAt: null } });
    expect(live).toBe(0);
  });

  it('rejects an expired refresh token with SESSION_EXPIRED', async () => {
    const first = await loginAs(TEST_USER.email, TEST_USER.password);
    await prisma.refreshToken.update({
      where: { tokenHash: hashToken(first.refreshToken) },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await api().post('/api/v1/auth/refresh').send({ refreshToken: first.refreshToken });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('SESSION_EXPIRED');
  });

  it('rejects an unknown refresh token', async () => {
    const res = await api().post('/api/v1/auth/refresh').send({ refreshToken: 'not-a-real-token' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('revokes the whole family so the refresh token stops working', async () => {
    const session = await loginAs(TEST_USER.email, TEST_USER.password);

    const res = await api()
      .post('/api/v1/auth/logout')
      .send({ refreshToken: session.refreshToken });
    expect(res.status).toBe(204);

    const after = await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: session.refreshToken });
    expect(after.status).toBe(401);
  });

  it('is a no-op without a token rather than an error', async () => {
    const res = await api().post('/api/v1/auth/logout').send({});
    expect(res.status).toBe(204);
  });
});
