import { Router } from 'express';
import {
  loginPayloadSchema,
  logoutBodySchema,
  refreshBodySchema,
  signupPayloadSchema,
} from '@ecom/contracts';
import { loginRateLimit, refreshRateLimit, signupRateLimit } from '../../middleware/rate-limit.js';
import { validate } from '../../middleware/validate.js';
import { authController } from './auth.controller.js';

export const authRouter: Router = Router();

authRouter.post('/signup', signupRateLimit, validate(signupPayloadSchema), authController.signup);
authRouter.post('/login', loginRateLimit, validate(loginPayloadSchema), authController.login);
authRouter.post('/refresh', refreshRateLimit, validate(refreshBodySchema), authController.refresh);
authRouter.post('/logout', validate(logoutBodySchema), authController.logout);
