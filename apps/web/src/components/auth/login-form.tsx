'use client';

import { startTransition, useActionState, useRef } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginFormSchema, type LoginFormPayload } from '@ecom/contracts';
import { loginAction } from '@/actions/auth-actions';
import { Button } from '@/components/shared/button';
import { Card } from '@/components/shared/card';
import { Form } from '@/components/shared/x-form';
import { Input } from '@/components/shared/input';
import { useActionStateToast } from '@/hooks/use-action-state-toast';

/**
 * Works without JavaScript: the `<form action={formAction}>` is a real POST to the
 * server action, which validates with the same zod schema and re-renders the page
 * with `state.issues` if something is wrong.
 *
 * With JavaScript, `onSubmit` intercepts the native submit, runs react-hook-form's
 * client-side validation (same schema, instant feedback), and then dispatches the
 * identical FormData to the identical action inside `startTransition` — required
 * whenever a form action is invoked manually rather than by the form itself.
 */
export function LoginForm({ next, registered }: { next?: string; registered?: boolean }) {
  const [state, formAction, isPending] = useActionState(loginAction, {
    success: false,
    message: '',
  });
  useActionStateToast(state);

  const form = useForm<LoginFormPayload>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
      ...(state?.fields ? { email: JSON.parse(state.fields.email ?? '""') as string } : {}),
    },
  });

  const formRef = useRef<HTMLFormElement>(null);

  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : '/signup';

  return (
    <Card className="w-full">
      <Card.Header>
        <Card.Title className="text-2xl">Sign in</Card.Title>
        <Card.Description>Enter your email and password to continue.</Card.Description>
      </Card.Header>
      <Card.Content className="px-4 md:px-6">
        <Form {...form}>
          <form
            ref={formRef}
            action={formAction}
            onSubmit={(evt) => {
              evt.preventDefault();
              form.handleSubmit(() => {
                const formData = new FormData(formRef.current!);
                startTransition(() => formAction(formData));
              })(evt);
            }}
            className="flex flex-col gap-5"
            noValidate
          >
            {next ? <input type="hidden" name="next" value={next} /> : null}

            {/* Set by signupAction's redirect. Server-rendered, so it shows without JS too. */}
            {registered ? (
              <p
                role="status"
                className="rounded-md border border-success/40 bg-success-light px-3 py-2 text-sm text-success"
              >
                Your account is ready. Sign in to continue.
              </p>
            ) : null}

            <Form.Field
              control={form.control}
              name="email"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Email</Form.Label>
                  <Form.Control>
                    <Input
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="you@example.com"
                      {...field}
                    />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="password"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Password</Form.Label>
                  <Form.Control>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />

            {/* Server-side issues render inline too, so the no-JS path has visible feedback. */}
            {!state.success && state.issues?.length ? (
              <ul
                role="alert"
                className="rounded-md border border-danger/40 bg-destructive-light px-3 py-2 text-sm text-danger"
              >
                {state.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : null}

            <Button type="submit" className="w-full" isLoading={isPending} disabled={isPending}>
              {isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Form>
      </Card.Content>
      <Card.Footer className="flex-col gap-2 text-center text-sm text-muted-foreground">
        <p>
          New here?
          <Link
            href={signupHref}
            className="ml-1 font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
        <p>
          Demo account: <code className="mx-1 rounded bg-muted px-1.5 py-0.5">demo@shop.test</code>/{' '}
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5">Password123!</code>
        </p>
      </Card.Footer>
    </Card>
  );
}
