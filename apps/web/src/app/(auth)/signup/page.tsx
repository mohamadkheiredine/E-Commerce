import type { Metadata } from 'next';
import { SignupForm } from '@/components/auth/signup-form';

export const metadata: Metadata = { title: 'Create an account' };

export default async function SignupPage({ searchParams }: PageProps<'/signup'>) {
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
        <SignupForm next={next} />
      </div>
    </main>
  );
}
