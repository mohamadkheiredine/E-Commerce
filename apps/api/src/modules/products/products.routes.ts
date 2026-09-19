import { Router } from 'express';
import { productSlugParamsSchema } from '@ecom/contracts';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { productsController } from './products.controller.js';

export const productsRouter: Router = Router();

// The whole storefront is behind login, per the brief, so the catalogue is too.
productsRouter.use(authenticate);

productsRouter.get('/', productsController.list);
productsRouter.get(
  '/:slug',
  validate(productSlugParamsSchema, 'params'),
  productsController.getBySlug,
);
