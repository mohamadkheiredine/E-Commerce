import type { ReactNode } from 'react';
import { BottomBar } from '@/components/layout/bottom-bar';
import { Header } from '@/components/layout/header';
import { getUserOrRedirect } from '@/lib/auth/get-user-or-redirect';

/**
 * Everything under (shop) requires a session. The guard runs here in the layout
 * *and* again in each page's data-layer calls — the layout gives a fast redirect,
 * the data layer gives correctness even if a page is reached some other way.
 */
export default async function ShopLayout({ children }: { children: ReactNode }) {
  const { user } = await getUserOrRedirect();

  return (
    <div className="flex min-h-svh flex-col">
      <Header user={user} />
      <main
        id="main"
        className="mx-auto w-full max-w-7xl flex-1 px-4 pb-[calc(var(--mobile-nav-height)+1.5rem)] pt-6 sm:px-6 sm:pb-12"
      >
        {children}
      </main>
      <BottomBar />
    </div>
  );
}
