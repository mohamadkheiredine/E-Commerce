'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FormState } from '@/models/form-state';

/**
 * Bridges a server action's `FormState` to a toast. `message` is the title;
 * `issues` become the bullet list — which is why FormState carries both.
 *
 * `successToast: false` keeps the error branch but silences success, for controls
 * that fire constantly (a quantity stepper) where the UI already shows the result.
 */
export function useActionStateToast(
  state: FormState | null | undefined,
  options: {
    duration?: number;
    position?: 'top-center' | 'bottom-center' | 'top-right' | 'bottom-right';
    successToast?: boolean;
  } = {},
) {
  const { duration = 4000, position = 'top-center', successToast = true } = options;

  useEffect(() => {
    if (!state) return;
    const { success, message, issues } = state;

    if (!message && !issues?.length) return;

    if (success) {
      if (successToast) toast.success(message || 'Done', { duration, position });
      return;
    }

    /* error branch */
    if (issues?.length) {
      toast.error(message || 'There was a problem', {
        duration,
        position,
        description: (
          <ul className="ml-4 list-disc">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        ),
      });
    } else {
      toast.error(message || 'Something went wrong', { duration, position });
    }
  }, [state, duration, position, successToast]);
}
