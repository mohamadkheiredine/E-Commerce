import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/shared/button';

export function CartEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed px-6 py-20 text-center">
      <ShoppingBag className="size-12 text-muted-foreground" aria-hidden />
      <div>
        <p className="text-lg font-medium">Your cart is empty</p>
        <p className="mt-1 text-sm text-muted-foreground">Anything you add will show up here.</p>
      </div>
      <Button asChild>
        <Link href="/products">Browse products</Link>
      </Button>
    </div>
  );
}
