import { Router } from 'express';
import { orderNumberParamsSchema } from '@ecom/contracts';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { ordersController } from './orders.controller.js';

export const ordersRouter: Router = Router();

ordersRouter.use(authenticate);

ordersRouter.post('/', ordersController.place);
ordersRouter.get(
  '/:orderNumber',
  validate(orderNumberParamsSchema, 'params'),
  ordersController.get,
);
