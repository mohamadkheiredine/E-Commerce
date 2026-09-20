import type { Request, Response } from 'express';
import type { LoginPayload, LogoutBody, RefreshBody, SignupPayload } from '@ecom/contracts';
import { requireUser } from '../../middleware/authenticate.js';
import { validated } from '../../middleware/validate.js';
import { authService } from './auth.service.js';

/**
 * Controllers translate HTTP to service calls and nothing else. No business rules
 * here: if a decision depends on data, it belongs in the service.
 */
export const authController = {
  async signup(req: Request, res: Response): Promise<void> {
    const payload = validated<SignupPayload>(req);
    const result = await authService.signup(payload);
    res.status(201).json({ data: result });
  },

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = validated<LoginPayload>(req);
    const result = await authService.login(email, password);
    res.status(200).json({ data: result });
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const { refresh_token } = validated<RefreshBody>(req);
    const result = await authService.refresh(refresh_token);
    res.status(200).json({ data: result });
  },

  async logout(req: Request, res: Response): Promise<void> {
    const { refresh_token } = validated<LogoutBody>(req);
    await authService.logout(refresh_token);
    res.status(204).end();
  },

  async me(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const result = await authService.me(user.id);
    res.status(200).json({ data: result });
  },
};
