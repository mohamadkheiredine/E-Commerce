import Link from 'next/link';
import { Button } from '@/components/shared/button';

export const dynamic = 'force-static';

export default function NotFound() {
  return (
    <main
      id="main"
      className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center"
    >
      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold sm:text-4xl">This page doesn&apos;t exist</h1>
      <p className="max-w-md text-muted-foreground">
        The link may be out of date, or the product may no longer be listed.
      </p>
      <Button asChild>
        <Link href="/products">Back to the catalogue</Link>
      </Button>
    </main>
  );
}
