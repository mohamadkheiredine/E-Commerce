import type { Metadata } from 'next';
import { getUserOrRedirect } from '@/lib/auth/get-user-or-redirect';

export const metadata: Metadata = { title: 'Products' };

export default async function ProductsPage() {
  const { user } = await getUserOrRedirect();

  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user.name}</h1>
      <p className="mt-2 text-muted-foreground">The catalogue lands here.</p>
    </section>
  );
}
