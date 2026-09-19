import type { WishlistDto, WishlistItemDto } from '@ecom/contracts';
import type { Wishlist, WishlistItem } from '@/models/wishlist/read';
import { deserializeProduct } from '@/serializers/product';

const dateFormatter = new Intl.DateTimeFormat('en-AE', { day: 'numeric', month: 'short' });

export function deserializeWishlistItem(item: WishlistItemDto): WishlistItem {
  const addedAt = new Date(item.addedAt);
  return {
    id: item.id,
    product: deserializeProduct(item.product),
    addedAt,
    displayAddedAt: dateFormatter.format(addedAt),
  };
}

export function deserializeWishlist(dto: WishlistDto): Wishlist {
  const items = dto.items.map(deserializeWishlistItem);
  return {
    items,
    itemCount: dto.itemCount,
    isEmpty: items.length === 0,
    productIds: new Set(items.map((i) => i.product.id)),
  };
}
