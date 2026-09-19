'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils/cn';

type NavLinkProps = ComponentProps<typeof Link> & {
  href: string;
  activeClassName?: string;
  /** Match on prefix (default) or exact path. */
  exact?: boolean;
};

/**
 * A Link that knows whether it points at the current route. Marks itself with
 * `aria-current="page"` so assistive tech announces it, and applies
 * `activeClassName` so sighted users see it.
 */
export function NavLink({
  href,
  className,
  activeClassName,
  exact = false,
  children,
  ...props
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(className, isActive && activeClassName)}
      {...props}
    >
      {children}
    </Link>
  );
}
