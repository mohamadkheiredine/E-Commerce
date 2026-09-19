import type { ReactNode } from 'react';
import { BottomBar } from '@/components/layout/bottom-bar';
import { Header } from '@/components/layout/header';
import { fetchCart } from '@/data-layer/cart/server';
import { getUserOrRedirect } from '@/lib/auth/get-user-or-redirect';

/**
 * Everything under (shop) requires a session. The guard runs here in the layout
 * *and* again in each page's data-layer calls — the layout gives a fast redirect,
 * the data layer gives correctness even if a page is reached some other way.
 *
 * The cart count for the header badge is fetched here. `fetchCart` is wrapped in
 * React's `cache()`, so when the cart page itself also calls it, the API is hit
 * once per request, not twice. Actions call `refresh()` after mutating, which
 * re-renders this layout and keeps the badge honest without client state.
 */
export default async function ShopLayout({ children }: { children: ReactNode }) {
  const { user } = await getUserOrRedirect();
  const cart = await fetchCart().catch(() => null);

  return (
    <div className="flex min-h-svh flex-col">
      <Header user={user} cartCount={cart?.itemCount ?? 0} />
      <main
        id="main"
        className="mx-auto w-full max-w-7xl flex-1 px-4 pb-[calc(var(--mobile-nav-height)+1.5rem)] pt-6 sm:px-6 sm:pb-12"
      >
        {children}
      </main>
      <BottomBar cartCount={cart?.itemCount ?? 0} />
    </div>
  );
}
