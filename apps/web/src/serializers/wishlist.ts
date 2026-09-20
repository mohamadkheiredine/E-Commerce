import type {
  AddToWishlistBody,
  AddToWishlistPayload,
  MoveToCartBody,
  MoveToCartPayload,
  WishlistDto,
  WishlistItemDto,
} from '@ecom/contracts';
import type { Wishlist, WishlistItem } from '@/models/wishlist/read';
import { deserializeProduct } from '@/serializers/product';

const dateFormatter = new Intl.DateTimeFormat('en-AE', { day: 'numeric', month: 'short' });

export function deserializeWishlistItem(item: WishlistItemDto): WishlistItem {
  const addedAt = new Date(item.added_at);
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
    itemCount: dto.item_count,
    isEmpty: items.length === 0,
    productIds: new Set(items.map((i) => i.product.id)),
  };
}

export function serializeAddToWishlistBody(payload: AddToWishlistPayload): AddToWishlistBody {
  return { product_id: payload.productId };
}

/** The product id goes in the path; only the optional variant is body. */
export function serializeMoveToCartBody(payload: MoveToCartPayload): MoveToCartBody {
  return payload.variantId ? { variant_id: payload.variantId } : {};
}
