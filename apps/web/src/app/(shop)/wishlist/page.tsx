import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { WishlistItem } from '@/components/features/wishlist/wishlist-item';
import { Button } from '@/components/shared/button';
import { fetchWishlist } from '@/data-layer/wishlist/server';

export const metadata: Metadata = { title: 'Wishlist' };

export default async function WishlistPage() {
  const wishlist = await fetchWishlist();

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your wishlist</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {wishlist.itemCount} {wishlist.itemCount === 1 ? 'item' : 'items'} saved
        </p>
      </header>

      {wishlist.isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed px-6 py-20 text-center">
          <Heart className="size-12 text-muted-foreground" aria-hidden />
          <div>
            <p className="text-lg font-medium">Nothing saved yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the heart on any product to keep it here for later.
            </p>
          </div>
          <Button asChild>
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y" aria-label="Wishlist items">
          {wishlist.items.map((item) => (
            <WishlistItem key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}
