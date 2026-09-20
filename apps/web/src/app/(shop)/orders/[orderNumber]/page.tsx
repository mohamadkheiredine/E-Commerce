import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, Package } from 'lucide-react';
import { Badge } from '@/components/shared/badge';
import { Button } from '@/components/shared/button';
import { Card } from '@/components/shared/card';
import { fetchOrderByNumber } from '@/data-layer/orders/server';

type Props = PageProps<'/orders/[orderNumber]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order ${orderNumber}` };
}

/**
 * The confirmation screen, and also the permanent record: the URL is the order
 * number, so it can be bookmarked or revisited. Everything shown comes from the
 * order's own snapshot lines — a later catalogue change cannot alter it.
 */
export default async function OrderPage({ params }: Props) {
  const { orderNumber } = await params;
  const order = await fetchOrderByNumber(orderNumber);
  if (!order) notFound();

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-light">
          <CheckCircle2 className="size-8 text-success" aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Thanks — order placed</h1>
        <p className="text-muted-foreground">
          Order <span className="font-mono font-medium text-foreground">{order.orderNumber}</span>
          <span className="mx-1.5">·</span>
          {order.displayPlacedAt}
        </p>
        <Badge variant="outline" className="border-success/40 bg-success-light text-success">
          {order.displayStatus}
        </Badge>
      </header>

      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Package className="size-4 text-muted-foreground" aria-hidden />
            {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
          </Card.Title>
        </Card.Header>
        <Card.Content className="px-4 md:px-6">
          <ul className="divide-y" aria-label="Order items">
            {order.lines.map((line) => (
              <li
                key={line.id}
                className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium">{line.title}</p>
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
              <dd className="tabular-nums">{order.displaySubtotal}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className={order.shipping === 0 ? 'font-medium text-success' : 'tabular-nums'}>
                {order.displayShipping}
              </dd>
            </div>
            <div className="flex justify-between border-t pt-3 text-lg font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{order.displayTotal}</dd>
            </div>
          </dl>
        </Card.Content>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    </section>
  );
}
