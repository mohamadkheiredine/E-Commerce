import type { CartDto, WishlistDto, WishlistItemDto } from '@ecom/contracts';
import { NotFoundError } from '../../lib/errors.js';
import { cartService } from '../cart/cart.service.js';
import { productsRepository } from '../products/products.repository.js';
import { toProductDto } from '../products/products.service.js';
import { wishlistRepository, type WishlistItemRecord } from './wishlist.repository.js';

function toWishlistItemDto(item: WishlistItemRecord): WishlistItemDto {
  return {
    id: item.id,
    product: toProductDto(item.product),
    added_at: item.createdAt.toISOString(),
  };
}

function buildWishlistDto(items: WishlistItemRecord[]): WishlistDto {
  return { items: items.map(toWishlistItemDto), item_count: items.length };
}

export const wishlistService = {
  async getWishlist(userId: string): Promise<WishlistDto> {
    return buildWishlistDto(await wishlistRepository.findItems(userId));
  },

  /**
   * Idempotent: adding a product that is already wished for is a no-op, not a
   * conflict. A double-tapped heart should not produce an error toast.
   */
  async add(userId: string, productId: string): Promise<WishlistDto> {
    const product = await productsRepository.findById(productId);
    if (!product) throw new NotFoundError('Product');

    const existing = await wishlistRepository.findItem(userId, productId);
    if (!existing) await wishlistRepository.create(userId, productId);

    return this.getWishlist(userId);
  },

  async remove(userId: string, productId: string): Promise<WishlistDto> {
    await wishlistRepository.delete(userId, productId);
    return this.getWishlist(userId);
  },

  /**
   * One operation rather than add-then-remove from the client: if the cart add
   * fails (sold out, variant needed) the item stays on the wishlist, and if it
   * succeeds the wishlist entry goes. The client never sees a half state.
   */
  async moveToCart(
    userId: string,
    productId: string,
    variantId: string | undefined,
  ): Promise<{ cart: CartDto; wishlist: WishlistDto }> {
    const item = await wishlistRepository.findItem(userId, productId);
    if (!item) throw new NotFoundError('Wishlist item');

    const cart = await cartService.addItem(userId, { productId, variantId, quantity: 1 });
    await wishlistRepository.delete(userId, productId);

    return { cart, wishlist: await this.getWishlist(userId) };
  },
};
