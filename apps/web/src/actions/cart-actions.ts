'use server';

import { refresh } from 'next/cache';
import {
  addToCartPayloadSchema,
  changeCartItemVariantPayloadSchema,
  removeCartItemPayloadSchema,
  updateCartItemQuantityPayloadSchema,
} from '@ecom/contracts';
import {
  addToCart,
  changeCartItemVariant,
  removeCartItem,
  updateCartItemQuantity,
} from '@/data-layer/cart/server';
import { handleApiError } from '@/lib/api/handle-api-error';
import type { FormState } from '@/models/form-state';

/**
 * Every cart mutation follows the same recipe as the codebase this mirrors:
 * parse FormData with the payload schema → call the data layer → on success,
 * invalidate and return `{ success: true }`; on failure, return the issues.
 *
 * Two deliberate differences from the reference implementation:
 *
 * - `refresh()` (Next 16) instead of `revalidateTag`: the cart is not cached, so
 *   there is no tag; what has to happen is a re-render of the route *and its layout*,
 *   because the header badge lives in the layout. `refresh()` does exactly that.
 * - These actions return `{ success: true }` rather than redirecting. A cart page
 *   that navigated away on every quantity change would be unusable — so the success
 *   branch of `useActionStateToast` is live here, unlike in the reference.
 *
 * Without JavaScript, the browser posts the form, the action runs, and the page
 * re-renders with the new cart. `refresh()` is a no-op in that path; the full render
 * already happened.
 */

const invalid = (formData: Record<string, FormDataEntryValue>, issues: string[]): FormState => {
  const fields: Record<string, string> = {};
  for (const key of Object.keys(formData)) fields[key] = JSON.stringify(formData[key]);
  return { message: 'Invalid form data', fields, issues };
};

export async function addToCartAction(_: FormState, data: FormData): Promise<FormState> {
  const formData = Object.fromEntries(data);
  try {
    const parsed = addToCartPayloadSchema.safeParse(formData);
    if (!parsed.success) {
      return invalid(
        formData,
        parsed.error.issues.map((issue) => issue.message),
      );
    }
    await addToCart(parsed.data);
  } catch (error) {
    console.error('Error adding to cart:', error);
    return { success: false, message: 'Could not add to cart.', issues: [handleApiError(error)] };
  }

  refresh();
  return { success: true, message: 'Added to your cart.' };
}

export async function updateCartItemQuantityAction(
  _: FormState,
  data: FormData,
): Promise<FormState> {
  const formData = Object.fromEntries(data);
  try {
    const parsed = updateCartItemQuantityPayloadSchema.safeParse(formData);
    if (!parsed.success) {
      return invalid(
        formData,
        parsed.error.issues.map((issue) => issue.message),
      );
    }
    await updateCartItemQuantity(parsed.data);
  } catch (error) {
    console.error('Error updating quantity:', error);
    return {
      success: false,
      message: 'Could not update quantity.',
      issues: [handleApiError(error)],
    };
  }

  refresh();
  return { success: true, message: 'Quantity updated.' };
}

export async function changeCartItemVariantAction(
  _: FormState,
  data: FormData,
): Promise<FormState> {
  const formData = Object.fromEntries(data);
  try {
    const parsed = changeCartItemVariantPayloadSchema.safeParse(formData);
    if (!parsed.success) {
      return invalid(
        formData,
        parsed.error.issues.map((issue) => issue.message),
      );
    }
    await changeCartItemVariant(parsed.data);
  } catch (error) {
    console.error('Error changing variant:', error);
    return {
      success: false,
      message: 'Could not change the option.',
      issues: [handleApiError(error)],
    };
  }

  refresh();
  return { success: true, message: 'Option updated.' };
}

export async function removeCartItemAction(_: FormState, data: FormData): Promise<FormState> {
  const formData = Object.fromEntries(data);
  try {
    const parsed = removeCartItemPayloadSchema.safeParse(formData);
    if (!parsed.success) {
      return invalid(
        formData,
        parsed.error.issues.map((issue) => issue.message),
      );
    }
    await removeCartItem(parsed.data);
  } catch (error) {
    console.error('Error removing item:', error);
    return {
      success: false,
      message: 'Could not remove the item.',
      issues: [handleApiError(error)],
    };
  }

  refresh();
  return { success: true, message: 'Removed from your cart.' };
}
