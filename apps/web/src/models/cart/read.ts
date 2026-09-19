import type { Product, ProductVariant } from '@/models/product/read';

export type CartLine = {
  id: string;
  quantity: number;
  product: Product;
  variant: ProductVariant | null;
  /** "Size: M" — or null for a variantless product. */
  variantLabel: string | null;
  /** Minor units. */
  unitPrice: number;
  displayUnitPrice: string;
  lineTotal: number;
  displayLineTotal: string;
  /** Stock for this exact configuration; the quantity stepper caps at it. */
  availableStock: number;
  /** True when stock dropped below the quantity in the cart since it was added. */
  exceedsStock: boolean;
  isLowStock: boolean;
  /** Sibling variants the line could switch to, with their availability. */
  alternatives: ProductVariant[];
};

export type Cart = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  displaySubtotal: string;
  shipping: number;
  displayShipping: string;
  isShippingFree: boolean;
  /** How much more to spend for free shipping, or null once reached. */
  displayFreeShippingGap: string | null;
  total: number;
  displayTotal: string;
  isEmpty: boolean;
  /** Any line the customer will have to fix before checkout can proceed. */
  hasProblems: boolean;
};
