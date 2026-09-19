import 'server-only';
import { env } from '@/lib/config/env';
import { ApiClientError } from '@/lib/api/errors';

const REQUEST_TIMEOUT_MS = 10_000;

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type RequestOptions = {
  body?: unknown;
  headers?: Record<string, string>;
  /** Forwarded to fetch so server components can opt into Next's data cache. */
  next?: NextFetchRequestConfig;
  cache?: RequestCache;
};

export type ApiClient = {
  get<T>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<T>;
  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T>;
  patch<T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>): Promise<T>;
  delete<T>(path: string, options?: Omit<RequestOptions, 'body'>): Promise<T>;
};

/**
 * The one HTTP client for talking to the API. Server-only by construction: it reads
 * `API_URL` (which is not `NEXT_PUBLIC_`) and takes the access token as an argument,
 * so nothing in a client component can even import it.
 *
 * What it does not do is refresh tokens. That is the proxy's job — by the time this
 * runs, the token in the cookie is fresh. A 401 here means the session is genuinely
 * gone, and `getUserOrRedirect()` turns that into a redirect to the login page.
 */
export function createApiClient(accessToken?: string): ApiClient {
  async function request<T>(
    method: Method,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    };

    let response: Response;
    try {
      response = await fetch(`${env.API_URL}${path}`, {
        method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        // User-scoped data must never be served from Next's data cache to another
        // request. Callers that want caching (the catalogue) opt in explicitly.
        cache: options.cache ?? 'no-store',
        next: options.next,
      });
    } catch (error) {
      throw new ApiClientError(503, 'INTERNAL_ERROR', 'The store is temporarily unreachable', {
        cause: error,
      });
    }

    if (!response.ok) {
      throw await ApiClientError.fromResponse(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const envelope = (await response.json()) as { data: T };
    return envelope.data;
  }

  return {
    get: (path, options) => request('GET', path, options),
    post: (path, body, options) => request('POST', path, { ...options, body }),
    patch: (path, body, options) => request('PATCH', path, { ...options, body }),
    delete: (path, options) => request('DELETE', path, options),
  };
}

/** For the handful of calls that happen before there is a session: login, refresh. */
export const publicApi = createApiClient();
