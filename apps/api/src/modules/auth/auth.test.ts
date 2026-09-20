import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../lib/prisma.js';
import { hashToken } from '../../lib/tokens.js';
import { api, loginAs } from '../../test/client.js';
import { createTestUser, resetDb, TEST_USER } from '../../test/db.js';

beforeEach(async () => {
  await resetDb();
  await createTestUser();
});

describe('POST /api/v1/auth/signup', () => {
  const NEW_USER = { name: 'New Shopper', email: 'new@shop.test', password: 'AnotherHorse2!' };

  it('creates the account and returns the user, without issuing a session', async () => {
    const res = await api().post('/api/v1/auth/signup').send(NEW_USER);

    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ email: NEW_USER.email, name: NEW_USER.name });
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(res.body.data).not.toHaveProperty('accessToken');
    expect(res.body.data).not.toHaveProperty('refreshToken');

    // No refresh token row was minted on the side; sessions come from /login only.
    expect(await prisma.refreshToken.count()).toBe(0);
  });

  it('stores the password hashed and the new account can log in with it', async () => {
    await api().post('/api/v1/auth/signup').send(NEW_USER);

    const row = await prisma.user.findUnique({ where: { email: NEW_USER.email } });
    expect(row?.passwordHash).toBeDefined();
    expect(row?.passwordHash).not.toBe(NEW_USER.password);
    expect(row?.passwordHash.startsWith('$argon2id$')).toBe(true);

    const login = await api()
      .post('/api/v1/auth/login')
      .send({ email: NEW_USER.email, password: NEW_USER.password });
    expect(login.status).toBe(200);
  });

  it('normalises the email so the account can be found regardless of case', async () => {
    const res = await api()
      .post('/api/v1/auth/signup')
      .send({ ...NEW_USER, email: 'New@Shop.TEST' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(NEW_USER.email);
  });

  it('rejects an email that is already registered with EMAIL_TAKEN', async () => {
    const res = await api()
      .post('/api/v1/auth/signup')
      .send({ ...NEW_USER, email: TEST_USER.email });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
    expect(await prisma.user.count()).toBe(1);
  });

  it('treats the duplicate check as case-insensitive', async () => {
    const res = await api()
      .post('/api/v1/auth/signup')
      .send({ ...NEW_USER, email: TEST_USER.email.toUpperCase() });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('rejects a password shorter than the floor with a field-level detail', async () => {
    const res = await api()
      .post('/api/v1/auth/signup')
      .send({ ...NEW_USER, password: 'short1' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toHaveProperty('password');
    expect(await prisma.user.count()).toBe(1);
  });

  it('rejects a blank name and a malformed email', async () => {
    const res = await api()
      .post('/api/v1/auth/signup')
      .send({ name: '   ', email: 'not-an-email', password: NEW_USER.password });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toHaveProperty('name');
    expect(res.body.error.details).toHaveProperty('email');
  });

  it('does not accept a confirmPassword field — that is a form concern, not an API one', async () => {
    // Extra keys are stripped rather than rejected; the point is that the API never
    // depends on the client having compared two fields.
    const res = await api()
      .post('/api/v1/auth/signup')
      .send({ ...NEW_USER, confirmPassword: 'something-else' });
    expect(res.status).toBe(201);
  });

  it('survives two simultaneous sign-ups for the same email: exactly one wins', async () => {
    const [a, b] = await Promise.all([
      api().post('/api/v1/auth/signup').send(NEW_USER),
      api().post('/api/v1/auth/signup').send(NEW_USER),
    ]);

    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([201, 409]);
    expect(await prisma.user.count({ where: { email: NEW_USER.email } })).toBe(1);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns the user and a token pair for valid credentials', async () => {
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ email: TEST_USER.email, name: TEST_USER.name });
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(typeof res.body.data.access_token).toBe('string');
    expect(typeof res.body.data.refresh_token).toBe('string');
  });

  it('persists the refresh token hashed, never in plaintext', async () => {
    const { refresh_token: refreshToken } = await loginAs(TEST_USER.email, TEST_USER.password);
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
    const { access_token: accessToken } = await loginAs(TEST_USER.email, TEST_USER.password);
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
    const { access_token: accessToken } = await loginAs(TEST_USER.email, TEST_USER.password);
    const tampered = accessToken.slice(0, -4) + 'AAAA';
    const res = await api().get('/api/v1/auth/me').set('Authorization', `Bearer ${tampered}`);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/refresh — rotation', () => {
  it('issues a new pair and retires the presented token', async () => {
    const first = await loginAs(TEST_USER.email, TEST_USER.password);

    const res = await api()
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: first.refresh_token });

    expect(res.status).toBe(200);
    expect(res.body.data.refresh_token).not.toBe(first.refresh_token);
    expect(res.body.data.access_token).not.toBe(first.access_token);

    const old = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(first.refresh_token) },
    });
    const next = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(res.body.data.refresh_token) },
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
      .send({ refresh_token: first.refresh_token });
    const tabB = await api()
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: first.refresh_token });

    expect(tabA.status).toBe(200);
    expect(tabB.status).toBe(200);
    // Both tabs hold valid, distinct tokens; nobody got logged out.
    expect(tabB.body.data.refresh_token).not.toBe(tabA.body.data.refresh_token);
    const stillValid = await api()
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: tabA.body.data.refresh_token });
    expect(stillValid.status).toBe(200);
  });

  it('treats a replay outside the grace window as theft and revokes the whole family', async () => {
    const first = await loginAs(TEST_USER.email, TEST_USER.password);
    const rotated = await api()
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: first.refresh_token });
    expect(rotated.status).toBe(200);

    // Move the revocation into the past, beyond the grace window.
    await prisma.refreshToken.update({
      where: { tokenHash: hashToken(first.refresh_token) },
      data: { revokedAt: new Date(Date.now() - 60_000) },
    });

    const replay = await api()
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: first.refresh_token });
    expect(replay.status).toBe(401);
    expect(replay.body.error.code).toBe('TOKEN_REUSE_DETECTED');

    // The legitimate successor is dead too — that is the point.
    const successor = await api()
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: rotated.body.data.refresh_token });
    expect(successor.status).toBe(401);

    const live = await prisma.refreshToken.count({ where: { revokedAt: null } });
    expect(live).toBe(0);
  });

  it('rejects an expired refresh token with SESSION_EXPIRED', async () => {
    const first = await loginAs(TEST_USER.email, TEST_USER.password);
    await prisma.refreshToken.update({
      where: { tokenHash: hashToken(first.refresh_token) },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await api()
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: first.refresh_token });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('SESSION_EXPIRED');
  });

  it('rejects an unknown refresh token', async () => {
    const res = await api()
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: 'not-a-real-token' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('revokes the whole family so the refresh token stops working', async () => {
    const session = await loginAs(TEST_USER.email, TEST_USER.password);

    const res = await api()
      .post('/api/v1/auth/logout')
      .send({ refresh_token: session.refresh_token });
    expect(res.status).toBe(204);

    const after = await api()
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: session.refresh_token });
    expect(after.status).toBe(401);
  });

  it('is a no-op without a token rather than an error', async () => {
    const res = await api().post('/api/v1/auth/logout').send({});
    expect(res.status).toBe(204);
  });
});
