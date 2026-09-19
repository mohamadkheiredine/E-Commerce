/**
 * The catalogue as the UI sees it. Everything a component would otherwise compute
 * inline — formatted prices, stock flags, whether there is a variant axis — is
 * decided once, in `serializers/product.ts`, and arrives here ready to render.
 */
export type ProductVariant = {
  id: string;
  type: string;
  value: string;
  sku: string;
  /** Minor units. Base price plus this variant's delta. */
  price: number;
  displayPrice: string;
  stock: number;
  inStock: boolean;
  isLowStock: boolean;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  /** Minor units, before any variant delta. */
  basePrice: number;
  displayPrice: string;
  /** Present only when variants make the price vary; shown on listing cards as "from …". */
  displayPriceFrom: string | null;
  hasVariants: boolean;
  /** The single axis this product varies along ("Size", "Color"), or null. */
  variantType: string | null;
  variants: ProductVariant[];
  /** Across all variants, or the product's own stock if it has none. */
  totalStock: number;
  inStock: boolean;
  isLowStock: boolean;
};
