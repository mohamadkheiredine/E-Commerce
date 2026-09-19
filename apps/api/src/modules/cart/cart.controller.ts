import type { Request, Response } from 'express';
import type { AddToCartPayload, PatchCartItemBody } from '@ecom/contracts';
import { requireUser } from '../../middleware/authenticate.js';
import { validated } from '../../middleware/validate.js';
import { cartService } from './cart.service.js';

export const cartController = {
  async get(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    res.json({ data: await cartService.getCart(user.id) });
  },

  async addItem(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const body = validated<AddToCartPayload>(req);
    const cart = await cartService.addItem(user.id, body);
    res.status(201).json({ data: cart });
  },

  async patchItem(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const { id } = validated<{ id: string }>(req, 'params');
    const body = validated<PatchCartItemBody>(req);

    const cart =
      'quantity' in body
        ? await cartService.updateQuantity(user.id, id, body.quantity)
        : await cartService.changeVariant(user.id, id, body.variantId);

    res.json({ data: cart });
  },

  async removeItem(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const { id } = validated<{ id: string }>(req, 'params');
    res.json({ data: await cartService.removeItem(user.id, id) });
  },
};
