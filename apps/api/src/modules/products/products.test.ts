import { beforeEach, describe, expect, it } from 'vitest';
import { api, loginAs } from '../../test/client.js';
import { createTestUser, resetDb, TEST_USER } from '../../test/db.js';
import { seedCatalogue } from '../../test/fixtures.js';

let token: string;

beforeEach(async () => {
  await resetDb();
  await createTestUser();
  await seedCatalogue();
  token = (await loginAs(TEST_USER.email, TEST_USER.password)).access_token;
});

const authed = () => ({ Authorization: `Bearer ${token}` });

describe('GET /api/v1/products', () => {
  it('requires authentication', async () => {
    const res = await api().get('/api/v1/products');
    expect(res.status).toBe(401);
  });

  it('lists every product with its variants', async () => {
    const res = await api().get('/api/v1/products').set(authed());

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);

    const shirt = res.body.data.find((p: { slug: string }) => p.slug === 'linen-shirt');
    expect(shirt.variants).toHaveLength(3);
    expect(shirt.variants.map((v: { value: string }) => v.value)).toEqual(['L', 'M', 'S']);
    expect(shirt).not.toHaveProperty('createdAt');
  });
});

describe('GET /api/v1/products/:slug', () => {
  it('returns one product', async () => {
    const res = await api().get('/api/v1/products/plain-bottle').set(authed());
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ slug: 'plain-bottle', stock: 5, variants: [] });
  });

  it('404s with the typed envelope for an unknown slug', async () => {
    const res = await api().get('/api/v1/products/does-not-exist').set(authed());
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
