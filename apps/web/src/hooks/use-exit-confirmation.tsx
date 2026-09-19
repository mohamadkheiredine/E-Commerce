import { ExitConfirmation } from '@/components/layout/exit-confirmation';
import { useState, useCallback } from 'react';

/**
 * Promise-based "you have unsaved changes" guard.
 *
 * `askForExit()` opens the dialog and resolves to the user's answer, so a caller can
 * simply `if (!(await askForExit())) return;` instead of threading confirm/cancel
 * callbacks through its own state.
 */
export function useExitConfirmation(
  props: {
    title?: string;
    subtitle?: string;
    primaryButtonText?: string;
    secondaryButtonText?: string;
  } = {},
) {
  const {
    title = 'Discard changes?',
    subtitle = 'You have unsaved changes. If you leave now, they will be lost.',
    primaryButtonText = 'Discard',
    secondaryButtonText = 'Keep editing',
  } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [resolvePromise, setResolvePromise] = useState<(value: boolean) => void>();

  const confirmExit = useCallback(() => {
    setIsOpen(false);
    resolvePromise?.(true);
  }, [resolvePromise]);

  const cancelExit = useCallback(() => {
    setIsOpen(false);
    resolvePromise?.(false);
  }, [resolvePromise]);

  const askForExit = useCallback(() => {
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  return {
    isOpen,
    askForExit,
    confirmExit,
    cancelExit,
    ExitConfirmationModal: isOpen ? (
      <ExitConfirmation
        onConfirm={confirmExit}
        onCancel={cancelExit}
        title={title}
        subtitle={subtitle}
        primaryButtonText={primaryButtonText}
        secondaryButtonText={secondaryButtonText}
      />
    ) : null,
  };
}
