import Link from 'next/link';
import { PackageX } from 'lucide-react';
import { Button } from '@/components/shared/button';

export default function ProductNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <PackageX className="size-12 text-muted-foreground" aria-hidden />
      <h1 className="text-2xl font-semibold">That product is not listed</h1>
      <p className="max-w-md text-muted-foreground">
        It may have been removed, or the link may be wrong.
      </p>
      <Button asChild>
        <Link href="/products">Browse the catalogue</Link>
      </Button>
    </div>
  );
}
