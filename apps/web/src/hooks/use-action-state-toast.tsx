'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FormState } from '@/models/form-state';

export function useActionStateToast(
  state: FormState | null | undefined,
  options: {
    duration?: number;
    position?: 'top-center' | 'bottom-center' | 'top-right' | 'bottom-right';
  } = {},
) {
  const { duration = 5000, position = 'top-center' } = options ?? {};

  useEffect(() => {
    if (!state) return;
    const { success, message, issues } = state;

    if (!message && !issues?.length) return;

    if (success) {
      toast.success(message ?? 'Done!', {
        duration,
        position,
      });
      return;
    }

    /* error branch */
    if (issues?.length) {
      toast.error(message ?? 'There was a problem', {
        duration,
        position,
        description: (
          <ul className="ml-4 list-disc">
            {issues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        ),
        style: {
          backgroundColor: 'var(--color-destructive-light)',
          borderColor: 'var(--color-danger)',
        },
      });
    } else {
      toast.error(message || 'Something went wrong', {
        duration,
        position,
        style: {
          backgroundColor: 'var(--color-destructive-light)',
          borderColor: 'var(--color-danger)',
        },
      });
    }
  }, [state, duration, position]);
}
