import { Router } from 'express';
import {
  addToCartPayloadSchema,
  cartItemIdParamsSchema,
  patchCartItemBodySchema,
} from '@ecom/contracts';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { cartController } from './cart.controller.js';

export const cartRouter: Router = Router();

cartRouter.use(authenticate);

cartRouter.get('/', cartController.get);
cartRouter.post('/items', validate(addToCartPayloadSchema), cartController.addItem);
cartRouter.patch(
  '/items/:id',
  validate(cartItemIdParamsSchema, 'params'),
  validate(patchCartItemBodySchema),
  cartController.patchItem,
);
cartRouter.delete(
  '/items/:id',
  validate(cartItemIdParamsSchema, 'params'),
  cartController.removeItem,
);
