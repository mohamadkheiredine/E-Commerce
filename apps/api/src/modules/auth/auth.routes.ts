import { Router } from 'express';
import { loginPayloadSchema, refreshPayloadSchema, signupPayloadSchema } from '@ecom/contracts';
import { authenticate } from '../../middleware/authenticate.js';
import { loginRateLimit, refreshRateLimit, signupRateLimit } from '../../middleware/rate-limit.js';
import { validate } from '../../middleware/validate.js';
import { authController } from './auth.controller.js';

export const authRouter: Router = Router();

authRouter.post('/signup', signupRateLimit, validate(signupPayloadSchema), authController.signup);
authRouter.post('/login', loginRateLimit, validate(loginPayloadSchema), authController.login);
authRouter.post(
  '/refresh',
  refreshRateLimit,
  validate(refreshPayloadSchema),
  authController.refresh,
);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.me);
