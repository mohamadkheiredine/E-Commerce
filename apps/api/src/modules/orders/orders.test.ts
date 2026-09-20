import { randomUUID } from 'node:crypto';
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
const addToCart = (body: Record<string, unknown>) =>
  api().post('/api/v1/cart/items').set(authed()).send(body);
const place = (key = randomUUID()) =>
  api().post('/api/v1/orders').set(authed()).set('Idempotency-Key', key).send();

describe('POST /api/v1/orders', () => {
  it('places an order: snapshots lines, decrements stock, clears the cart', async () => {
    await addToCart({ product_id: cat.plain.id, quantity: 2 }); // 9,900 each, stock 5
    await addToCart({ product_id: cat.shirt.id, variant_id: cat.variants.S.id, quantity: 1 }); // 30,000, stock 3

    const res = await place();

    expect(res.status).toBe(201);
    const order = res.body.data;
    expect(order.order_number).toMatch(/^ATL-[A-Z0-9]+-[A-Z0-9]{4}$/);
    expect(order.status).toBe('PLACED');
    expect(order.items).toHaveLength(2);
    expect(order.subtotal).toBe(49800);
    expect(order.shipping).toBe(2500);
    expect(order.total).toBe(52300);

    const shirtLine = order.items.find(
      (i: { product_id: string }) => i.product_id === cat.shirt.id,
    );
    expect(shirtLine).toMatchObject({
      title_snapshot: 'Linen Shirt',
      variant_label_snapshot: 'Size: S',
      unit_price: 30000,
      quantity: 1,
      line_total: 30000,
    });

    // Stock moved.
    const plain = await prisma.product.findUnique({ where: { id: cat.plain.id } });
    const small = await prisma.variant.findUnique({ where: { id: cat.variants.S.id } });
    expect(plain?.stock).toBe(3);
    expect(small?.stock).toBe(2);

    // Cart is empty.
    expect(await prisma.cartItem.count()).toBe(0);
  });

  it('is idempotent: the same key returns the same order and places nothing new', async () => {
    await addToCart({ product_id: cat.plain.id, quantity: 1 });
    const key = randomUUID();

    const first = await place(key);
    const second = await place(key);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.data.order_number).toBe(first.body.data.order_number);
    expect(await prisma.order.count()).toBe(1);

    const plain = await prisma.product.findUnique({ where: { id: cat.plain.id } });
    expect(plain?.stock).toBe(4); // decremented once, not twice
  });

  it('refuses an empty cart', async () => {
    const res = await place();
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CART_EMPTY');
    expect(await prisma.order.count()).toBe(0);
  });

  it('refuses when stock dropped after the item was carted, and writes nothing', async () => {
    await addToCart({ product_id: cat.plain.id, quantity: 3 });
    await addToCart({ product_id: cat.shirt.id, variant_id: cat.variants.M.id, quantity: 2 });

    // Someone else bought most of the plain bottles in the meantime.
    await prisma.product.update({ where: { id: cat.plain.id }, data: { stock: 1 } });

    const res = await place();

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
    expect(res.body.error.message).toMatch(/Only 1/);

    // Nothing partial: no order, no decrements, cart intact.
    expect(await prisma.order.count()).toBe(0);
    const m = await prisma.variant.findUnique({ where: { id: cat.variants.M.id } });
    expect(m?.stock).toBe(10);
    expect(await prisma.cartItem.count()).toBe(2);
  });

  it('requires an Idempotency-Key header', async () => {
    await addToCart({ product_id: cat.plain.id, quantity: 1 });
    const res = await api().post('/api/v1/orders').set(authed()).send();
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('frees shipping above the threshold', async () => {
    await addToCart({ product_id: cat.shirt.id, variant_id: cat.variants.M.id, quantity: 2 }); // 60,000
    const res = await place();
    expect(res.body.data.shipping).toBe(0);
    expect(res.body.data.total).toBe(60000);
  });
});

describe('GET /api/v1/orders/:order_number', () => {
  it('returns the order to its owner', async () => {
    await addToCart({ product_id: cat.plain.id, quantity: 1 });
    const placed = await place();

    const res = await api().get(`/api/v1/orders/${placed.body.data.order_number}`).set(authed());

    expect(res.status).toBe(200);
    expect(res.body.data.order_number).toBe(placed.body.data.order_number);
  });

  it("is a 404 for another user's order", async () => {
    await addToCart({ product_id: cat.plain.id, quantity: 1 });
    const placed = await place();

    await createTestUser({ email: 'other@shop.test' });
    const other = (await loginAs('other@shop.test', TEST_USER.password)).access_token;

    const res = await api()
      .get(`/api/v1/orders/${placed.body.data.order_number}`)
      .set('Authorization', `Bearer ${other}`);

    expect(res.status).toBe(404);
  });
});
