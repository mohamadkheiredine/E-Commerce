import type { Request, Response } from 'express';
import type { AddToWishlistBody, MoveToCartBody } from '@ecom/contracts';
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
    const { product_id } = validated<AddToWishlistBody>(req);
    res.status(201).json({ data: await wishlistService.add(user.id, product_id) });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const { productId } = validated<{ productId: string }>(req, 'params');
    res.json({ data: await wishlistService.remove(user.id, productId) });
  },

  async moveToCart(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const { productId } = validated<{ productId: string }>(req, 'params');
    const { variant_id } = validated<MoveToCartBody>(req);
    res.json({ data: await wishlistService.moveToCart(user.id, productId, variant_id) });
  },
};
