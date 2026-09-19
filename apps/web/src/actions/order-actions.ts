'use server';

import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { placeOrderPayloadSchema } from '@ecom/contracts';
import { placeOrder } from '@/data-layer/orders/server';
import { PRODUCTS_TAG } from '@/data-layer/products/server';
import { handleApiError } from '@/lib/api/handle-api-error';
import type { FormState } from '@/models/form-state';

/**
 * The one action that redirects rather than returning — the same shape as the
 * reference codebase's create/edit actions: try/catch around the work, then
 * cache invalidation and `redirect()` *outside* the try, because redirect() works
 * by throwing and must not be swallowed by the catch.
 *
 * Stock changed, so the shared catalogue cache is stale. `updateTag` (Next 16) expires
 * it *and* refreshes within this same request, so the confirmation page and the next
 * product view show the new stock immediately. `revalidateTag(tag, 'max')` was tried
 * first and is the wrong tool here: it is stale-while-revalidate, so the buyer would
 * see the pre-purchase count once more before the background refresh landed.
 */
export async function placeOrderAction(_: FormState, data: FormData): Promise<FormState> {
  const formData = Object.fromEntries(data);
  let orderNumber: string;

  try {
    const parsed = placeOrderPayloadSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        message: 'Invalid form data',
        issues: parsed.error.issues.map((issue) => issue.message),
      };
    }
    const order = await placeOrder(parsed.data.idempotencyKey);
    orderNumber = order.orderNumber;
  } catch (error) {
    console.error('Error placing order:', error);
    return {
      success: false,
      message: 'Could not place your order.',
      issues: [handleApiError(error)],
    };
  }

  updateTag(PRODUCTS_TAG);
  redirect(`/orders/${encodeURIComponent(orderNumber)}`);
}
