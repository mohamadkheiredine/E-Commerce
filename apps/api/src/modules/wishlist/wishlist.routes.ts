import { Router } from 'express';
import {
  addToWishlistPayloadSchema,
  moveToCartBodySchema,
  wishlistProductIdParamsSchema,
} from '@ecom/contracts';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { wishlistController } from './wishlist.controller.js';

export const wishlistRouter: Router = Router();

wishlistRouter.use(authenticate);

wishlistRouter.get('/', wishlistController.get);
wishlistRouter.post('/items', validate(addToWishlistPayloadSchema), wishlistController.add);
wishlistRouter.delete(
  '/items/:productId',
  validate(wishlistProductIdParamsSchema, 'params'),
  wishlistController.remove,
);
wishlistRouter.post(
  '/items/:productId/move-to-cart',
  validate(wishlistProductIdParamsSchema, 'params'),
  validate(moveToCartBodySchema),
  wishlistController.moveToCart,
);
