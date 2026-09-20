import { z } from 'zod';
import { idSchema, minorUnitsSchema } from './common';

export const ORDER_STATUSES = ['PLACED', 'CONFIRMED', 'SHIPPED', 'CANCELLED'] as const;
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

/**
 * Order lines snapshot what was bought rather than joining back to the live catalogue.
 *
 * If a product is renamed or repriced tomorrow, an order placed today must still show
 * what the customer actually agreed to pay. Orders are immutable records; only the
 * `product_id` is kept as a soft reference for "buy it again" style links.
 */
export const orderItemSchema = z.object({
  id: idSchema,
  product_id: idSchema,
  title_snapshot: z.string(),
  variant_label_snapshot: z.string().nullable(),
  unit_price: minorUnitsSchema,
  quantity: z.number().int().positive(),
  line_total: minorUnitsSchema,
});
export type OrderItemDto = z.infer<typeof orderItemSchema>;

export const orderSchema = z.object({
  id: idSchema,
  order_number: z.string(),
  status: orderStatusSchema,
  items: z.array(orderItemSchema),
  subtotal: minorUnitsSchema,
  shipping: minorUnitsSchema,
  total: minorUnitsSchema,
  placed_at: z.string(),
});
export type OrderDto = z.infer<typeof orderSchema>;

/**
 * Placing an order takes no body beyond an idempotency key: the server reads the
 * authenticated user's cart rather than trusting a client-supplied line list, which
 * is what stops a crafted request from ordering at a price the client chose.
 *
 * The key makes a double-submitted checkout return the original order instead of
 * charging twice — the client generates it once per checkout attempt.
 */
export const placeOrderPayloadSchema = z.object({
  idempotencyKey: z.string().min(8, { error: 'Missing idempotency key' }),
});
export type PlaceOrderPayload = z.infer<typeof placeOrderPayloadSchema>;

export const orderNumberParamsSchema = z.object({
  orderNumber: z.string().min(1, { error: 'Order number is required' }),
});
