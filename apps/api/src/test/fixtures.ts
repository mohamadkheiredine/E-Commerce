import { prisma } from '../lib/prisma.js';

/**
 * A small catalogue that covers every shape the cart and checkout logic has to
 * handle: a variantless product, a product with variants where one is sold out,
 * a low-stock line, and a fully out-of-stock product.
 */
export async function seedCatalogue() {
  const plain = await prisma.product.create({
    data: {
      slug: 'plain-bottle',
      title: 'Plain Bottle',
      description: 'No variants.',
      basePrice: 9900,
      imageUrl: 'https://picsum.photos/seed/plain/800/800',
      category: 'Accessories',
      stock: 5,
    },
  });

  const shirt = await prisma.product.create({
    data: {
      slug: 'linen-shirt',
      title: 'Linen Shirt',
      description: 'Has sizes.',
      basePrice: 30000,
      imageUrl: 'https://picsum.photos/seed/shirt/800/800',
      category: 'Apparel',
      stock: 0,
      variants: {
        create: [
          { type: 'Size', value: 'S', priceDelta: 0, stock: 3, sku: 'SHIRT-S' },
          { type: 'Size', value: 'M', priceDelta: 0, stock: 10, sku: 'SHIRT-M' },
          { type: 'Size', value: 'L', priceDelta: 2000, stock: 0, sku: 'SHIRT-L' },
        ],
      },
    },
    include: { variants: true },
  });

  const soldOut = await prisma.product.create({
    data: {
      slug: 'sold-out-speaker',
      title: 'Sold Out Speaker',
      description: 'Nothing left.',
      basePrice: 34900,
      imageUrl: 'https://picsum.photos/seed/speaker/800/800',
      category: 'Audio',
      stock: 0,
    },
  });

  const bySize = Object.fromEntries(shirt.variants.map((v) => [v.value, v])) as Record<
    'S' | 'M' | 'L',
    (typeof shirt.variants)[number]
  >;

  return { plain, shirt, soldOut, variants: bySize };
}
