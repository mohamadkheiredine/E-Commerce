import type { LoginResponse, LogoutBody, RefreshBody, RefreshResponse } from '@ecom/contracts';

/** What the web keeps after a login: the user, plus the two tokens it will set as cookies. */
export type SignedInSession = {
  user: LoginResponse['user'];
  accessToken: string;
  refreshToken: string;
};

export type TokenPair = Pick<SignedInSession, 'accessToken' | 'refreshToken'>;

/** OAuth-style `access_token` / `refresh_token` on the wire → camelCase in the app. */
export function deserializeSession(dto: LoginResponse): SignedInSession {
  return { user: dto.user, accessToken: dto.access_token, refreshToken: dto.refresh_token };
}

export function deserializeTokenPair(dto: RefreshResponse): TokenPair {
  return { accessToken: dto.access_token, refreshToken: dto.refresh_token };
}

export function serializeRefreshBody(refreshToken: string): RefreshBody {
  return { refresh_token: refreshToken };
}

export function serializeLogoutBody(refreshToken: string): LogoutBody {
  return { refresh_token: refreshToken };
}
