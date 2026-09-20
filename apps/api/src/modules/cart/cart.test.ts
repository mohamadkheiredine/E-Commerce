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
  token = (await loginAs(TEST_USER.email, TEST_USER.password)).access_token;
});

const authed = () => ({ Authorization: `Bearer ${token}` });
const getCart = () => api().get('/api/v1/cart').set(authed());
const add = (body: Record<string, unknown>) =>
  api().post('/api/v1/cart/items').set(authed()).send(body);
const patch = (id: string, body: Record<string, unknown>) =>
  api().patch(`/api/v1/cart/items/${id}`).set(authed()).send(body);

describe('GET /api/v1/cart', () => {
  it('starts empty with zero totals', async () => {
    const res = await getCart();
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ items: [], subtotal: 0, shipping: 0, total: 0, item_count: 0 });
  });
});

describe('POST /api/v1/cart/items', () => {
  it('adds a variantless product', async () => {
    const res = await add({ product_id: cat.plain.id, quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0]).toMatchObject({
      quantity: 2,
      variant: null,
      unit_price: 9900,
      line_total: 19800,
      available_stock: 5,
    });
    expect(res.body.data.item_count).toBe(2);
  });

  it('adds a specific variant and prices it with the delta', async () => {
    const res = await add({ product_id: cat.shirt.id, variant_id: cat.variants.M.id, quantity: 1 });

    expect(res.status).toBe(201);
    expect(res.body.data.items[0].variant.value).toBe('M');
    expect(res.body.data.items[0].unit_price).toBe(30000);
  });

  it('refuses a product that has variants when none is chosen', async () => {
    const res = await add({ product_id: cat.shirt.id, quantity: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VARIANT_REQUIRED');
  });

  it('refuses a variant that belongs to a different product', async () => {
    const res = await add({ product_id: cat.plain.id, variant_id: cat.variants.M.id, quantity: 1 });
    // plain has no variants, so the variant is silently irrelevant — but a shirt
    // variant on a shirt of the wrong id is not:
    expect(res.status).toBe(201);

    const wrong = await add({ product_id: cat.shirt.id, variant_id: 'not-a-variant', quantity: 1 });
    expect(wrong.status).toBe(400);
    expect(wrong.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('refuses an out-of-stock product', async () => {
    const res = await add({ product_id: cat.soldOut.id, quantity: 1 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('OUT_OF_STOCK');
  });

  it('refuses a sold-out variant even when siblings are available', async () => {
    const res = await add({ product_id: cat.shirt.id, variant_id: cat.variants.L.id, quantity: 1 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('OUT_OF_STOCK');
  });

  it('refuses more than the available stock, naming the limit', async () => {
    const res = await add({ product_id: cat.plain.id, quantity: 6 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
    expect(res.body.error.message).toMatch(/Only 5/);
  });

  it('increments the existing line when the same configuration is added again', async () => {
    await add({ product_id: cat.plain.id, quantity: 2 });
    const res = await add({ product_id: cat.plain.id, quantity: 1 });

    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].quantity).toBe(3);
  });

  it('checks stock against the combined quantity, not just the increment', async () => {
    await add({ product_id: cat.plain.id, quantity: 4 });
    const res = await add({ product_id: cat.plain.id, quantity: 2 }); // 6 > 5

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
  });

  it('keeps different variants of the same product as separate lines', async () => {
    await add({ product_id: cat.shirt.id, variant_id: cat.variants.S.id, quantity: 1 });
    const res = await add({ product_id: cat.shirt.id, variant_id: cat.variants.M.id, quantity: 1 });

    expect(res.body.data.items).toHaveLength(2);
  });
});

describe('PATCH /api/v1/cart/items/:id — quantity', () => {
  it('updates the quantity and recomputes totals', async () => {
    const added = await add({ product_id: cat.plain.id, quantity: 1 });
    const id = added.body.data.items[0].id;

    const res = await patch(id, { quantity: 3 });

    expect(res.status).toBe(200);
    expect(res.body.data.items[0].quantity).toBe(3);
    expect(res.body.data.subtotal).toBe(29700);
  });

  it('refuses a quantity above stock', async () => {
    const added = await add({ product_id: cat.plain.id, quantity: 1 });
    const res = await patch(added.body.data.items[0].id, { quantity: 99 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
  });

  it('rejects a body that sets both quantity and variant', async () => {
    const added = await add({ product_id: cat.plain.id, quantity: 1 });
    const res = await patch(added.body.data.items[0].id, {
      quantity: 2,
      variant_id: cat.variants.M.id,
    });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/v1/cart/items/:id — variant change', () => {
  it('switches the line to another variant when no line for it exists', async () => {
    const added = await add({
      product_id: cat.shirt.id,
      variant_id: cat.variants.S.id,
      quantity: 2,
    });
    const id = added.body.data.items[0].id;

    const res = await patch(id, { variant_id: cat.variants.M.id });

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0]).toMatchObject({ id, quantity: 2 });
    expect(res.body.data.items[0].variant.value).toBe('M');
  });

  it('MERGES into the existing line when the target variant is already in the cart', async () => {
    await add({ product_id: cat.shirt.id, variant_id: cat.variants.M.id, quantity: 3 });
    const s = await add({ product_id: cat.shirt.id, variant_id: cat.variants.S.id, quantity: 2 });
    const sLineId = s.body.data.items.find(
      (i: { variant: { value: string } }) => i.variant.value === 'S',
    ).id;
    expect(s.body.data.items).toHaveLength(2);

    const res = await patch(sLineId, { variant_id: cat.variants.M.id });

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].variant.value).toBe('M');
    expect(res.body.data.items[0].quantity).toBe(5);

    // The S line is gone from the database, not just the response.
    expect(await prisma.cartItem.count()).toBe(1);
  });

  it('refuses a merge that would exceed the target variant stock, leaving both lines intact', async () => {
    await add({ product_id: cat.shirt.id, variant_id: cat.variants.S.id, quantity: 2 }); // S has 3
    const m = await add({ product_id: cat.shirt.id, variant_id: cat.variants.M.id, quantity: 2 });
    const mLineId = m.body.data.items.find(
      (i: { variant: { value: string } }) => i.variant.value === 'M',
    ).id;

    const res = await patch(mLineId, { variant_id: cat.variants.S.id }); // 2 + 2 = 4 > 3

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
    expect(await prisma.cartItem.count()).toBe(2);
  });

  it('refuses switching to a sold-out variant', async () => {
    const added = await add({
      product_id: cat.shirt.id,
      variant_id: cat.variants.S.id,
      quantity: 1,
    });
    const res = await patch(added.body.data.items[0].id, { variant_id: cat.variants.L.id });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('OUT_OF_STOCK');
  });

  it('refuses a variant from another product', async () => {
    const added = await add({
      product_id: cat.shirt.id,
      variant_id: cat.variants.S.id,
      quantity: 1,
    });
    const res = await patch(added.body.data.items[0].id, { variant_id: 'some-other-variant' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('refuses a variant change on a variantless product', async () => {
    const added = await add({ product_id: cat.plain.id, quantity: 1 });
    const res = await patch(added.body.data.items[0].id, { variant_id: cat.variants.M.id });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v1/cart/items/:id', () => {
  it('removes the line', async () => {
    const added = await add({ product_id: cat.plain.id, quantity: 1 });
    const res = await api()
      .delete(`/api/v1/cart/items/${added.body.data.items[0].id}`)
      .set(authed());

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
  });

  it("cannot touch another user's line", async () => {
    const added = await add({ product_id: cat.plain.id, quantity: 1 });
    const id = added.body.data.items[0].id;

    await createTestUser({ email: 'other@shop.test' });
    const other = (await loginAs('other@shop.test', TEST_USER.password)).access_token;

    const res = await api()
      .delete(`/api/v1/cart/items/${id}`)
      .set('Authorization', `Bearer ${other}`);

    expect(res.status).toBe(404);
    expect(await prisma.cartItem.count()).toBe(1);
  });
});

describe('totals', () => {
  it('charges flat shipping under the threshold and none above it', async () => {
    const small = await add({ product_id: cat.plain.id, quantity: 1 }); // 9,900
    expect(small.body.data.shipping).toBe(2500);
    expect(small.body.data.total).toBe(12400);

    const large = await add({
      product_id: cat.shirt.id,
      variant_id: cat.variants.M.id,
      quantity: 2,
    }); // + 60,000
    expect(large.body.data.subtotal).toBe(69900);
    expect(large.body.data.shipping).toBe(0);
    expect(large.body.data.total).toBe(69900);
  });
});
