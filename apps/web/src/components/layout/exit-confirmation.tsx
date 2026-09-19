'use client';

import { Dialog } from '@/components/layout/dialog';
import { Button } from '@/components/shared/button';

type ExitConfirmationProps = {
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly title: string;
  readonly subtitle: string;
  readonly primaryButtonText: string;
  readonly secondaryButtonText: string;
};

export function ExitConfirmation({
  onConfirm,
  onCancel,
  title,
  subtitle,
  primaryButtonText,
  secondaryButtonText,
}: ExitConfirmationProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onCancel();
    }
  };

  return (
    <Dialog open={true} onOpenChange={handleOpenChange}>
      <Dialog.Overlay />

      <Dialog.Content onInteractOutside={(e) => e.preventDefault()}>
        <Dialog.Header>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{subtitle}</Dialog.Description>
        </Dialog.Header>

        <Dialog.Footer className="flex items-center justify-between">
          <Dialog.Close onClick={onCancel} className="text-gray-500 cursor-pointer">
            {secondaryButtonText}
          </Dialog.Close>
          <Button onClick={onConfirm}>{primaryButtonText}</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
