import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../lib/prisma.js';
import { api, loginAs } from '../../test/client.js';
import { createTestUser, resetDb, TEST_USER } from '../../test/db.js';
import { seedCatalogue } from '../../test/fixtures.js';

type Catalogue = Awaited<ReturnType<typeof seedCatalogue>>;

let token: string;
let cat: Catalogue;

beforeEach(async () => {
  await resetDb();
  await createTestUser();
  cat = await seedCatalogue();
  token = (await loginAs(TEST_USER.email, TEST_USER.password)).accessToken;
});

const authed = () => ({ Authorization: `Bearer ${token}` });
const add = (productId: string) =>
  api().post('/api/v1/wishlist/items').set(authed()).send({ productId });

describe('wishlist', () => {
  it('starts empty', async () => {
    const res = await api().get('/api/v1/wishlist').set(authed());
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ items: [], itemCount: 0 });
  });

  it('adds a product and is idempotent on repeat', async () => {
    const first = await add(cat.plain.id);
    expect(first.status).toBe(201);
    expect(first.body.data.itemCount).toBe(1);

    const again = await add(cat.plain.id);
    expect(again.status).toBe(201);
    expect(again.body.data.itemCount).toBe(1);
    expect(await prisma.wishlistItem.count()).toBe(1);
  });

  it('404s for an unknown product', async () => {
    const res = await add('nope');
    expect(res.status).toBe(404);
  });

  it('removes a product', async () => {
    await add(cat.plain.id);
    const res = await api().delete(`/api/v1/wishlist/items/${cat.plain.id}`).set(authed());
    expect(res.status).toBe(200);
    expect(res.body.data.itemCount).toBe(0);
  });

  it('moves a variantless product straight into the cart', async () => {
    await add(cat.plain.id);
    const res = await api()
      .post(`/api/v1/wishlist/items/${cat.plain.id}/move-to-cart`)
      .set(authed())
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.cart.items).toHaveLength(1);
    expect(res.body.data.cart.items[0].quantity).toBe(1);
    expect(res.body.data.wishlist.itemCount).toBe(0);
  });

  it('moves a product with variants when one is chosen', async () => {
    await add(cat.shirt.id);
    const res = await api()
      .post(`/api/v1/wishlist/items/${cat.shirt.id}/move-to-cart`)
      .set(authed())
      .send({ variantId: cat.variants.M.id });

    expect(res.status).toBe(200);
    expect(res.body.data.cart.items[0].variant.value).toBe('M');
    expect(res.body.data.wishlist.itemCount).toBe(0);
  });

  it('keeps the item on the wishlist if the cart add fails', async () => {
    await add(cat.shirt.id);
    const res = await api()
      .post(`/api/v1/wishlist/items/${cat.shirt.id}/move-to-cart`)
      .set(authed())
      .send({}); // variant required

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VARIANT_REQUIRED');
    expect(await prisma.wishlistItem.count()).toBe(1);
    expect(await prisma.cartItem.count()).toBe(0);
  });

  it('refuses to move a sold-out product and keeps it wished for', async () => {
    await add(cat.soldOut.id);
    const res = await api()
      .post(`/api/v1/wishlist/items/${cat.soldOut.id}/move-to-cart`)
      .set(authed())
      .send({});

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('OUT_OF_STOCK');
    expect(await prisma.wishlistItem.count()).toBe(1);
  });
});
