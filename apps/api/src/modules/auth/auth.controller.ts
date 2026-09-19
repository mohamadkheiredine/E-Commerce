import type { Request, Response } from 'express';
import type { LoginPayload, RefreshPayload } from '@ecom/contracts';
import { requireUser } from '../../middleware/authenticate.js';
import { validated } from '../../middleware/validate.js';
import { authService } from './auth.service.js';

/**
 * Controllers translate HTTP to service calls and nothing else. No business rules
 * here: if a decision depends on data, it belongs in the service.
 */
export const authController = {
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = validated<LoginPayload>(req);
    const result = await authService.login(email, password);
    res.status(200).json({ data: result });
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = validated<RefreshPayload>(req);
    const result = await authService.refresh(refreshToken);
    res.status(200).json({ data: result });
  },

  async logout(req: Request, res: Response): Promise<void> {
    const body = req.body as { refreshToken?: unknown } | undefined;
    const refreshToken = typeof body?.refreshToken === 'string' ? body.refreshToken : undefined;
    await authService.logout(refreshToken);
    res.status(204).end();
  },

  async me(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const result = await authService.me(user.id);
    res.status(200).json({ data: result });
  },
};
