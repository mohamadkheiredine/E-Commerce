import Link from 'next/link';
import { ArrowRight, Truck } from 'lucide-react';
import { Button } from '@/components/shared/button';
import { Card } from '@/components/shared/card';
import type { Cart } from '@/models/cart/read';

/**
 * Sticky on desktop so the total stays in view while scrolling a long cart; a
 * normal block on mobile, where sticky panels eat the small screen.
 */
export function CartSummary({ cart }: { cart: Cart }) {
  return (
    <Card className="sm:sticky sm:top-20">
      <Card.Header>
        <Card.Title>Order summary</Card.Title>
      </Card.Header>
      <Card.Content>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              Subtotal ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})
            </dt>
            <dd className="tabular-nums">{cart.displaySubtotal}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd className={cart.isShippingFree ? 'font-medium text-success' : 'tabular-nums'}>
              {cart.displayShipping}
            </dd>
          </div>
          {cart.displayFreeShippingGap ? (
            <p className="flex items-start gap-1.5 rounded-md bg-muted px-2.5 py-2 text-xs text-muted-foreground">
              <Truck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Add {cart.displayFreeShippingGap} more for free shipping.
            </p>
          ) : null}
          <div className="flex justify-between border-t pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{cart.displayTotal}</dd>
          </div>
        </dl>
      </Card.Content>
      <Card.Footer className="flex-col items-stretch gap-2">
        <Button asChild className="h-11 w-full gap-2 sm:h-10" disabled={cart.hasProblems}>
          <Link
            href="/checkout"
            aria-disabled={cart.hasProblems}
            className={cart.hasProblems ? 'pointer-events-none opacity-60' : undefined}
          >
            Proceed to checkout
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
        {cart.hasProblems ? (
          <p className="text-center text-xs text-warning-foreground">
            Fix the highlighted items to continue.
          </p>
        ) : null}
        <Button asChild variant="text" className="w-full">
          <Link href="/products">Continue shopping</Link>
        </Button>
      </Card.Footer>
    </Card>
  );
}
