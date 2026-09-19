import type { Request, Response } from 'express';
import { validated } from '../../middleware/validate.js';
import { productsService } from './products.service.js';

export const productsController = {
  async list(_req: Request, res: Response): Promise<void> {
    const products = await productsService.list();
    res.json({ data: products });
  },

  async getBySlug(req: Request, res: Response): Promise<void> {
    const { slug } = validated<{ slug: string }>(req, 'params');
    const product = await productsService.getBySlug(slug);
    res.json({ data: product });
  },
};
