import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { env, isTest } from './config/env.js';
import { logger } from './lib/logger.js';
import { requestId } from './middleware/request-id.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import { cartRouter } from './modules/cart/cart.routes.js';
import { wishlistRouter } from './modules/wishlist/wishlist.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';

/**
 * App assembly is kept separate from `index.ts` (which owns the listener and process
 * lifecycle) so that tests can build an app and drive it with supertest without ever
 * binding a port.
 */
export function createApp(): Express {
  const app = express();

  // Behind a proxy in any real deployment; needed for correct client IPs, which the
  // rate limiter keys on.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());

  /**
   * Exactly one allowed origin. The browser never calls this API — every request
   * comes from the Next.js server, holding an access token read from an httpOnly
   * cookie — so there is no reason for this list to grow.
   */
  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Idempotency-Key'],
    }),
  );

  // A cart mutation is a few hundred bytes; anything approaching 100kb is abuse.
  app.use(express.json({ limit: '100kb' }));

  app.use(requestId);

  if (!isTest) {
    app.use(
      pinoHttp({
        logger,
        genReqId: (req) => (req as express.Request).id,
      }),
    );
  }

  const api = express.Router();
  api.use('/auth', authRouter);
  api.use('/products', productsRouter);
  api.use('/cart', cartRouter);
  api.use('/wishlist', wishlistRouter);
  api.use('/orders', ordersRouter);
  app.use('/api/v1', api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
