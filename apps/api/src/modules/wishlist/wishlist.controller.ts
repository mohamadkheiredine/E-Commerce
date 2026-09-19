import type { Request, Response } from 'express';
import type { AddToWishlistPayload, MoveToCartBody } from '@ecom/contracts';
import { requireUser } from '../../middleware/authenticate.js';
import { validated } from '../../middleware/validate.js';
import { wishlistService } from './wishlist.service.js';

export const wishlistController = {
  async get(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    res.json({ data: await wishlistService.getWishlist(user.id) });
  },

  async add(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const { productId } = validated<AddToWishlistPayload>(req);
    res.status(201).json({ data: await wishlistService.add(user.id, productId) });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const { productId } = validated<{ productId: string }>(req, 'params');
    res.json({ data: await wishlistService.remove(user.id, productId) });
  },

  async moveToCart(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const { productId } = validated<{ productId: string }>(req, 'params');
    const { variantId } = validated<MoveToCartBody>(req);
    res.json({ data: await wishlistService.moveToCart(user.id, productId, variantId) });
  },
};
