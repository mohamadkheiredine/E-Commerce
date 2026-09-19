import Link from 'next/link';
import { PackageSearch } from 'lucide-react';
import { Button } from '@/components/shared/button';

export default function OrderNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <PackageSearch className="size-12 text-muted-foreground" aria-hidden />
      <h1 className="text-2xl font-semibold">We couldn&apos;t find that order</h1>
      <p className="max-w-md text-muted-foreground">
        Check the order number, or it may belong to a different account.
      </p>
      <Button asChild>
        <Link href="/products">Back to the catalogue</Link>
      </Button>
    </div>
  );
}
