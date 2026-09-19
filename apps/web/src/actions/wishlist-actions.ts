'use server';

import { refresh } from 'next/cache';
import {
  addToWishlistPayloadSchema,
  moveToCartPayloadSchema,
  removeFromWishlistPayloadSchema,
} from '@ecom/contracts';
import {
  addToWishlist,
  moveWishlistItemToCart,
  removeFromWishlist,
} from '@/data-layer/wishlist/server';
import { handleApiError } from '@/lib/api/handle-api-error';
import type { FormState } from '@/models/form-state';

const invalid = (formData: Record<string, FormDataEntryValue>, issues: string[]): FormState => {
  const fields: Record<string, string> = {};
  for (const key of Object.keys(formData)) fields[key] = JSON.stringify(formData[key]);
  return { message: 'Invalid form data', fields, issues };
};

export async function addToWishlistAction(_: FormState, data: FormData): Promise<FormState> {
  const formData = Object.fromEntries(data);
  try {
    const parsed = addToWishlistPayloadSchema.safeParse(formData);
    if (!parsed.success)
      return invalid(
        formData,
        parsed.error.issues.map((i) => i.message),
      );
    await addToWishlist(parsed.data);
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return {
      success: false,
      message: 'Could not save to wishlist.',
      issues: [handleApiError(error)],
    };
  }
  refresh();
  return { success: true, message: 'Saved to your wishlist.' };
}

export async function removeFromWishlistAction(_: FormState, data: FormData): Promise<FormState> {
  const formData = Object.fromEntries(data);
  try {
    const parsed = removeFromWishlistPayloadSchema.safeParse(formData);
    if (!parsed.success)
      return invalid(
        formData,
        parsed.error.issues.map((i) => i.message),
      );
    await removeFromWishlist(parsed.data);
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return {
      success: false,
      message: 'Could not update wishlist.',
      issues: [handleApiError(error)],
    };
  }
  refresh();
  return { success: true, message: 'Removed from your wishlist.' };
}

export async function moveToCartAction(_: FormState, data: FormData): Promise<FormState> {
  const formData = Object.fromEntries(data);
  try {
    const parsed = moveToCartPayloadSchema.safeParse(formData);
    if (!parsed.success)
      return invalid(
        formData,
        parsed.error.issues.map((i) => i.message),
      );
    await moveWishlistItemToCart(parsed.data);
  } catch (error) {
    console.error('Error moving to cart:', error);
    return { success: false, message: 'Could not move to cart.', issues: [handleApiError(error)] };
  }
  refresh();
  return { success: true, message: 'Moved to your cart.' };
}
