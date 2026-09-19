import type { Product } from '@/models/product/read';

export type WishlistItem = {
  id: string;
  product: Product;
  addedAt: Date;
  displayAddedAt: string;
};

export type Wishlist = {
  items: WishlistItem[];
  itemCount: number;
  isEmpty: boolean;
  /** For the product page's heart: is this product already wished for? */
  productIds: ReadonlySet<string>;
};
