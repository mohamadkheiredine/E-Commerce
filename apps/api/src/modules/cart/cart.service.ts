import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FLAT_RATE,
  type CartDto,
  type CartItemDto,
} from '@ecom/contracts';
import {
  InsufficientStockError,
  NotFoundError,
  OutOfStockError,
  ValidationError,
  VariantRequiredError,
} from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { availableStock, hasVariants, resolveUnitPrice } from '../../lib/stock.js';
import { productsRepository } from '../products/products.repository.js';
import { toProductDto } from '../products/products.service.js';
import { cartRepository, type CartItemRecord } from './cart.repository.js';

function toCartItemDto(item: CartItemRecord): CartItemDto {
  const unitPrice = resolveUnitPrice(item.product, item.variant);
  return {
    id: item.id,
    quantity: item.quantity,
    product: toProductDto(item.product),
    variant: item.variant
      ? {
          id: item.variant.id,
          type: item.variant.type,
          value: item.variant.value,
          price_delta: item.variant.priceDelta,
          stock: item.variant.stock,
          sku: item.variant.sku,
        }
      : null,
    unit_price: unitPrice,
    line_total: unitPrice * item.quantity,
    available_stock: availableStock(item.product, item.variantId),
  };
}

export function computeShipping(subtotal: number): number {
  if (subtotal === 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
}

export function buildCartDto(items: CartItemRecord[]): CartDto {
  const dtoItems = items.map(toCartItemDto);
  const subtotal = dtoItems.reduce((sum, i) => sum + i.line_total, 0);
  const shipping = computeShipping(subtotal);
  return {
    items: dtoItems,
    subtotal,
    shipping,
    total: subtotal + shipping,
    item_count: dtoItems.reduce((sum, i) => sum + i.quantity, 0),
  };
}

/**
 * Rejects a requested quantity the current stock cannot cover. Called at every
 * point a quantity is set — add, update, merge — so the rule lives once.
 */
function assertStock(title: string, requested: number, available: number): void {
  if (available <= 0) throw new OutOfStockError(title);
  if (requested > available) throw new InsufficientStockError(title, available);
}

export const cartService = {
  async getCart(userId: string): Promise<CartDto> {
    const items = await cartRepository.findItems(userId);
    return buildCartDto(items);
  },

  /**
   * Adding a configuration that is already in the cart increments that line rather
   * than creating a duplicate — "add to cart" twice means "I want two".
   */
  async addItem(
    userId: string,
    input: { productId: string; variantId?: string; quantity: number },
  ): Promise<CartDto> {
    const product = await productsRepository.findById(input.productId);
    if (!product) throw new NotFoundError('Product');

    let variantId: string | null = null;
    if (hasVariants(product)) {
      if (!input.variantId) throw new VariantRequiredError(product.title);
      const variant = product.variants.find((v) => v.id === input.variantId);
      if (!variant) {
        throw new ValidationError('That option does not belong to this product', {
          variantId: ['Unknown variant'],
        });
      }
      variantId = variant.id;
    }

    const available = availableStock(product, variantId);
    const existing = await cartRepository.findLine(userId, product.id, variantId);
    const requested = (existing?.quantity ?? 0) + input.quantity;
    assertStock(product.title, requested, available);

    if (existing) {
      await cartRepository.update(existing.id, { quantity: requested });
    } else {
      await cartRepository.create({
        userId,
        productId: product.id,
        variantId,
        quantity: requested,
      });
    }

    return this.getCart(userId);
  },

  async updateQuantity(userId: string, itemId: string, quantity: number): Promise<CartDto> {
    const item = await cartRepository.findItem(userId, itemId);
    if (!item) throw new NotFoundError('Cart item');

    assertStock(item.product.title, quantity, availableStock(item.product, item.variantId));
    await cartRepository.update(item.id, { quantity });

    return this.getCart(userId);
  },

  /**
   * The operation the unique(userId, productId, variantId) constraint makes
   * interesting. Switching a line to a variant that already has its own line would
   * violate the constraint, so instead the two lines merge: the target absorbs this
   * line's quantity and this line is deleted. Done in a transaction so a failure
   * between the two writes cannot leave the cart with a doubled or vanished line.
   */
  async changeVariant(userId: string, itemId: string, variantId: string): Promise<CartDto> {
    const item = await cartRepository.findItem(userId, itemId);
    if (!item) throw new NotFoundError('Cart item');

    if (!hasVariants(item.product)) {
      throw new ValidationError('This product has no options to change');
    }

    const target = item.product.variants.find((v) => v.id === variantId);
    if (!target) {
      throw new ValidationError('That option does not belong to this product', {
        variantId: ['Unknown variant'],
      });
    }

    if (target.id === item.variantId) {
      return this.getCart(userId);
    }

    const label = `${item.product.title} (${target.value})`;

    await prisma.$transaction(async (tx) => {
      const collision = await cartRepository.findLine(userId, item.productId, target.id, tx);

      if (collision) {
        const merged = collision.quantity + item.quantity;
        assertStock(label, merged, target.stock);
        await cartRepository.update(collision.id, { quantity: merged }, tx);
        await cartRepository.delete(item.id, tx);
      } else {
        assertStock(label, item.quantity, target.stock);
        await cartRepository.update(item.id, { variantId: target.id }, tx);
      }
    });

    return this.getCart(userId);
  },

  async removeItem(userId: string, itemId: string): Promise<CartDto> {
    const item = await cartRepository.findItem(userId, itemId);
    if (!item) throw new NotFoundError('Cart item');
    await cartRepository.delete(item.id);
    return this.getCart(userId);
  },
};
