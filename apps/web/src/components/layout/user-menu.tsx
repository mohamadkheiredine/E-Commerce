'use client';

import { LogOut, UserRound } from 'lucide-react';
import type { UserDto } from '@ecom/contracts';
import { logoutAction } from '@/actions/auth-actions';
import { Avatar } from '@/components/shared/avatar';
import { Button } from '@/components/shared/button';
import { DropdownMenu } from '@/components/shared/dropdown-menu';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

/**
 * Sign-out is a real `<form>` submitting the server action, so it cannot be
 * triggered by a cross-site GET.
 *
 * The dropdown's content only exists in the DOM while open, which a JavaScript-free
 * page can never do — so a plain sign-out form is rendered in `<noscript>` as well.
 * Found by driving the page with JavaScript off, which is the only way to find it.
 */
export function UserMenu({ user }: { user: UserDto }) {
  return (
    <>
      <noscript>
        <form action={logoutAction} className="inline-flex">
          <Button type="submit" variant="ghost" className="h-9 gap-2 px-2">
            <LogOut className="size-4" aria-hidden />
            Sign out
          </Button>
        </form>
      </noscript>
      <DropdownMenu>
        <DropdownMenu.Trigger asChild>
          <Button
            variant="ghost"
            className="h-9 gap-2 px-2"
            aria-label={`Account menu for ${user.name}`}
          >
            <Avatar className="size-7">
              <Avatar.Fallback className="text-xs">{initials(user.name)}</Avatar.Fallback>
            </Avatar>
            <span className="hidden max-w-32 truncate text-sm md:inline">{user.name}</span>
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" className="w-56">
          <DropdownMenu.Label className="font-normal">
            <div className="flex items-center gap-2">
              <UserRound className="size-4 text-muted-foreground" aria-hidden />
              <div className="grid text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
          </DropdownMenu.Label>
          <DropdownMenu.Separator />
          <form action={logoutAction}>
            <DropdownMenu.Item asChild>
              <button type="submit" className="w-full cursor-pointer">
                <LogOut className="size-4" aria-hidden />
                Sign out
              </button>
            </DropdownMenu.Item>
          </form>
        </DropdownMenu.Content>
      </DropdownMenu>
    </>
  );
}
