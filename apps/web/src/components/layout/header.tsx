import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
import type { UserDto } from '@ecom/contracts';
import { NavLink } from '@/components/layout/nav-link';
import { UserMenu } from '@/components/layout/user-menu';
import { cn } from '@/lib/utils/cn';

const NAV_LINK_CLASS =
  'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground';
const NAV_LINK_ACTIVE = 'text-foreground';

/**
 * Sticky top bar. On desktop it carries the full navigation; under `sm` it shrinks to
 * brand + account and hands navigation to the bottom tab bar, which is far easier to
 * reach with a thumb than a hamburger in the top corner.
 *
 * The codebase this mirrors had the same split, but its mobile header rendered empty
 * because every child was `hidden sm:block`. Here the brand and account stay.
 */
export function Header({ user, cartCount = 0 }: { user: UserDto; cartCount?: number }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <Link href="/products" className="text-lg font-semibold tracking-tight">
          Atlas Store
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
          <NavLink href="/products" className={NAV_LINK_CLASS} activeClassName={NAV_LINK_ACTIVE}>
            Products
          </NavLink>
          <NavLink href="/wishlist" className={NAV_LINK_CLASS} activeClassName={NAV_LINK_ACTIVE}>
            <span className="inline-flex items-center gap-1.5">
              <Heart className="size-4" aria-hidden />
              Wishlist
            </span>
          </NavLink>
          <NavLink
            href="/cart"
            className={cn(NAV_LINK_CLASS, 'relative')}
            activeClassName={NAV_LINK_ACTIVE}
          >
            <span className="inline-flex items-center gap-1.5">
              <ShoppingBag className="size-4" aria-hidden />
              Cart
              <CartCount count={cartCount} />
            </span>
          </NavLink>
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/cart"
            className="relative rounded-md p-2 text-muted-foreground hover:text-foreground sm:hidden"
            aria-label={`Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
          >
            <ShoppingBag className="size-5" aria-hidden />
            <CartCount count={cartCount} className="absolute -right-0.5 -top-0.5" />
          </Link>
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}

function CartCount({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        'inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-5 text-primary-foreground tabular-nums',
        className,
      )}
      aria-hidden
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
