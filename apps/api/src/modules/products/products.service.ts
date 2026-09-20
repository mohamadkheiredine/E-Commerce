import type { ProductDto } from '@ecom/contracts';
import { NotFoundError } from '../../lib/errors.js';
import { productsRepository, type ProductRecord } from './products.repository.js';

/** Prisma row → wire DTO: snake_case on the wire, dates and internal fields left behind. */
export function toProductDto(product: ProductRecord): ProductDto {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    base_price: product.basePrice,
    image_url: product.imageUrl,
    category: product.category,
    stock: product.stock,
    variants: product.variants.map((v) => ({
      id: v.id,
      type: v.type,
      value: v.value,
      price_delta: v.priceDelta,
      stock: v.stock,
      sku: v.sku,
    })),
  };
}

export const productsService = {
  async list(): Promise<ProductDto[]> {
    const products = await productsRepository.findAll();
    return products.map(toProductDto);
  },

  async getBySlug(slug: string): Promise<ProductDto> {
    const product = await productsRepository.findBySlug(slug);
    if (!product) throw new NotFoundError('Product');
    return toProductDto(product);
  },
};
