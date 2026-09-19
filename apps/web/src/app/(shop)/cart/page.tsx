import type { Metadata } from 'next';
import { CartEmpty } from '@/components/features/cart/cart-empty';
import { CartLine } from '@/components/features/cart/cart-line';
import { CartSummary } from '@/components/features/cart/cart-summary';
import { fetchCart } from '@/data-layer/cart/server';

export const metadata: Metadata = { title: 'Cart' };

export default async function CartPage() {
  const cart = await fetchCart();

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your cart</h1>

      {cart.isEmpty ? (
        <CartEmpty />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
          <ul className="divide-y" aria-label="Cart items">
            {cart.lines.map((line) => (
              <CartLine key={line.id} line={line} />
            ))}
          </ul>
          <CartSummary cart={cart} />
        </div>
      )}
    </section>
  );
}
