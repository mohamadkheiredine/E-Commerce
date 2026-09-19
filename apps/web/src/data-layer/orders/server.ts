import 'server-only';
import { cache } from 'react';
import { orderSchema } from '@ecom/contracts';
import { isApiClientError } from '@/lib/api/errors';
import { getUserOrRedirect } from '@/lib/auth/get-user-or-redirect';
import type { Order } from '@/models/order/read';
import { deserializeOrder } from '@/serializers/order';

export async function placeOrder(idempotencyKey: string): Promise<Order> {
  const { api } = await getUserOrRedirect();
  const dto = await api.post<unknown>('/orders', undefined, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return deserializeOrder(orderSchema.parse(dto));
}

export const fetchOrderByNumber = cache(async (orderNumber: string): Promise<Order | null> => {
  const { api } = await getUserOrRedirect();
  try {
    const dto = await api.get<unknown>(`/orders/${encodeURIComponent(orderNumber)}`);
    return deserializeOrder(orderSchema.parse(dto));
  } catch (error) {
    if (isApiClientError(error) && error.code === 'NOT_FOUND') return null;
    throw error;
  }
});
