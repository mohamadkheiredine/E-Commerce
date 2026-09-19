import type { Request, Response } from 'express';
import { ValidationError } from '../../lib/errors.js';
import { requireUser } from '../../middleware/authenticate.js';
import { validated } from '../../middleware/validate.js';
import { ordersService } from './orders.service.js';

export const ordersController = {
  async place(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);

    // The key travels as a header, per the convention for idempotent POSTs. It has
    // no business meaning, so it does not belong in the body.
    const key = req.get('idempotency-key');
    if (!key || key.length < 8 || key.length > 128) {
      throw new ValidationError('Missing or malformed Idempotency-Key header', {
        'idempotency-key': ['Required, 8–128 characters'],
      });
    }

    const order = await ordersService.placeOrder(user.id, key);
    res.status(201).json({ data: order });
  },

  async get(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const { orderNumber } = validated<{ orderNumber: string }>(req, 'params');
    res.json({ data: await ordersService.getByOrderNumber(user.id, orderNumber) });
  },
};
