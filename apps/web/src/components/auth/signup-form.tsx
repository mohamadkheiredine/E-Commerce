'use client';

import { startTransition, useActionState, useRef } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PASSWORD_MIN_LENGTH, signupFormSchema, type SignupFormPayload } from '@ecom/contracts';
import { signupAction } from '@/actions/auth-actions';
import { Button } from '@/components/shared/button';
import { Card } from '@/components/shared/card';
import { Form } from '@/components/shared/x-form';
import { Input } from '@/components/shared/input';
import { useActionStateToast } from '@/hooks/use-action-state-toast';

/**
 * Same progressive-enhancement shape as `LoginForm`: a real `<form action>` that the
 * server action handles on its own, with react-hook-form layered on top when
 * JavaScript is available. The confirm-password rule lives in the shared zod schema,
 * so both paths enforce it identically.
 */
export function SignupForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(signupAction, {
    success: false,
    message: '',
  });
  useActionStateToast(state);

  const form = useForm<SignupFormPayload>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      ...(state?.fields
        ? {
            name: JSON.parse(state.fields.name ?? '""') as string,
            email: JSON.parse(state.fields.email ?? '""') as string,
          }
        : {}),
    },
  });

  const formRef = useRef<HTMLFormElement>(null);

  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : '/login';

  return (
    <Card className="w-full">
      <Card.Header>
        <Card.Title className="text-2xl">Create an account</Card.Title>
        <Card.Description>A name, an email and a password is all it takes.</Card.Description>
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

            <Form.Field
              control={form.control}
              name="name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Name</Form.Label>
                  <Form.Control>
                    <Input type="text" autoComplete="name" placeholder="Your name" {...field} />
                  </Form.Control>
                  <Form.Message />
                </Form.Item>
              )}
            />

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
                    <Input type="password" autoComplete="new-password" {...field} />
                  </Form.Control>
                  <Form.Description>At least {PASSWORD_MIN_LENGTH} characters.</Form.Description>
                  <Form.Message />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Confirm password</Form.Label>
                  <Form.Control>
                    <Input type="password" autoComplete="new-password" {...field} />
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
              {isPending ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </Form>
      </Card.Content>
      <Card.Footer className="justify-center text-sm text-muted-foreground">
        Already have an account?
        <Link
          href={loginHref}
          className="ml-1 font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </Card.Footer>
    </Card>
  );
}
