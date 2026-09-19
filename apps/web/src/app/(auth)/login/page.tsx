import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const params = await searchParams;
  const next = typeof params.next === 'string' ? params.next : undefined;

  return (
    <main
      id="main"
      className="flex min-h-svh w-full flex-1 items-center justify-center bg-secondary/40 px-4 py-10 sm:px-6"
    >
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Atlas Store</h1>
        </div>
        <LoginForm next={next} />
      </div>
    </main>
  );
}
