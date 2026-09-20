import { randomUUID } from 'node:crypto';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { PlaceOrderForm } from '@/components/features/checkout/place-order-form';
import { Card } from '@/components/shared/card';
import { fetchCart } from '@/data-layer/cart/server';

export const metadata: Metadata = { title: 'Checkout' };

/**
 * A review step: the cart, read-only, with the totals and one button. Anything the
 * customer would want to change sends them back to the cart, where the controls
 * are. Lines with stock problems cannot reach here — the cart page blocks the link
 * — but the redirect below covers the direct-URL case too.
 */
export default async function CheckoutPage() {
  const cart = await fetchCart();

  if (cart.isEmpty || cart.hasProblems) {
    redirect('/cart');
  }

  // One key per render of this page. See PlaceOrderForm for why.
  const idempotencyKey = randomUUID();

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link
          href="/cart"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Back to cart
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Review your order</h1>
      </header>

      <Card>
        <Card.Header>
          <Card.Title>
            {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
          </Card.Title>
        </Card.Header>
        <Card.Content className="px-4 md:px-6">
          <ul className="divide-y" aria-label="Items in this order">
            {cart.lines.map((line) => (
              <li
                key={line.id}
                className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium">{line.product.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {line.variantLabel ? `${line.variantLabel} · ` : ''}
                    {line.quantity} × {line.displayUnitPrice}
                  </p>
                </div>
                <p className="shrink-0 font-medium tabular-nums">{line.displayLineTotal}</p>
              </li>
            ))}
          </ul>
        </Card.Content>
        <Card.Separator />
        <Card.Content className="px-4 md:px-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{cart.displaySubtotal}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className={cart.isShippingFree ? 'font-medium text-success' : 'tabular-nums'}>
                {cart.displayShipping}
              </dd>
            </div>
            <div className="flex justify-between border-t pt-3 text-lg font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{cart.displayTotal}</dd>
            </div>
          </dl>
        </Card.Content>
        <Card.Footer className="flex-col items-stretch">
          <PlaceOrderForm idempotencyKey={idempotencyKey} total={cart.displayTotal} />
        </Card.Footer>
      </Card>
    </section>
  );
}
