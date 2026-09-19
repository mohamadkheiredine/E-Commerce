import { Heart, LayoutGrid, ShoppingBag } from 'lucide-react';
import { NavLink } from '@/components/layout/nav-link';

const TAB_CLASS =
  'relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-muted-foreground transition-colors';
const TAB_ACTIVE = 'text-foreground';

/**
 * Fixed bottom navigation for small screens. Each tab is a full-height touch target
 * (the whole cell, not just the icon), and the active route is marked with
 * `aria-current` by NavLink.
 *
 * Height is published as `--mobile-nav-height` in globals.css so page content can
 * pad itself clear of it.
 */
export function BottomBar({ cartCount = 0 }: { cartCount?: number }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex h-(--mobile-nav-height) border-t bg-background pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <NavLink href="/products" className={TAB_CLASS} activeClassName={TAB_ACTIVE}>
        <LayoutGrid className="size-5" aria-hidden />
        Products
      </NavLink>
      <NavLink href="/wishlist" className={TAB_CLASS} activeClassName={TAB_ACTIVE}>
        <Heart className="size-5" aria-hidden />
        Wishlist
      </NavLink>
      <NavLink
        href="/cart"
        className={TAB_CLASS}
        activeClassName={TAB_ACTIVE}
        aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
      >
        <span className="relative">
          <ShoppingBag className="size-5" aria-hidden />
          {cartCount > 0 ? (
            <span
              className="absolute -right-2 -top-1.5 min-w-4 rounded-full bg-primary px-1 text-center text-[10px] font-semibold leading-4 text-primary-foreground tabular-nums"
              aria-hidden
            >
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          ) : null}
        </span>
        Cart
      </NavLink>
    </nav>
  );
}
