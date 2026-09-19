import 'server-only';
import { unstable_cache as nextCache } from 'next/cache';
import type { UserDto } from '@ecom/contracts';
import type { ApiClient } from '@/lib/api/client';
import { getUserOrRedirect } from '@/lib/auth/get-user-or-redirect';

type CacheOptions = NonNullable<Parameters<typeof nextCache>[2]>;

type Options = CacheOptions & {
  /**
   * `user` (default) keys the entry by the caller's id, for data that differs per
   * person — a cart, a wishlist. `shared` omits it, for data every caller sees
   * identically — the catalogue. Fifteen users should not produce fifteen cached
   * copies of the same fifteen products.
   */
  scope?: 'user' | 'shared';
};

/**
 * Wrap a loader so it can be called with arguments and still be cached, with the
 * authentication step kept *outside* the cached closure.
 *
 * That split is the whole trick. `unstable_cache` cannot read cookies — the closure
 * it wraps has to be pure — so the guard runs first, produces a bound API client, and
 * only then does the cache take over. The loader receives `(api, user, ...args)` and
 * never touches request state itself.
 *
 * Invalidate with `revalidateTag(tag, 'max')` for content where a moment of
 * staleness is fine (the catalogue), or `updateTag(tag)` from a server action when
 * the user must see their own change immediately (their cart).
 */
export function withUserCache<P extends readonly unknown[], R>(
  keyBase: string[],
  loader: (api: ApiClient, user: UserDto, ...args: P) => Promise<R>,
  options: Options = {},
) {
  const { scope = 'user', ...cacheOptions } = options;

  return async (...args: P): Promise<R> => {
    /* dynamic work, outside the cached closure */
    const { api, user } = await getUserOrRedirect();

    const key = [
      ...keyBase,
      ...(scope === 'user' ? [user.id] : []),
      ...args.map((arg) => JSON.stringify(arg)),
    ];

    /* pure work, inside */
    const cached = nextCache(
      () => loader(api, user, ...args),
      key,
      cacheOptions,
    ) as () => Promise<R>;

    return cached();
  };
}
