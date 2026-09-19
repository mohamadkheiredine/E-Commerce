'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import { ComponentProps, createContext, useContext, useMemo } from 'react';
import { useControllableState } from '@/hooks/use-controllable-state';
import { cn } from '@/lib/utils/cn';
import { composeCompoundComponent } from '@/lib/utils/components';
import ReactPortal from '@/components/layout/react-portal';
import { useModalStack } from '@/hooks/use-modal-stack';

type DialogProps = ComponentProps<typeof DialogPrimitive.Root>;
type DialogTriggerProps = ComponentProps<typeof DialogPrimitive.Trigger>;
type DialogPortalProps = ComponentProps<typeof DialogPrimitive.Portal>;
type DialogCloseProps = ComponentProps<typeof DialogPrimitive.Close>;
type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  persist?: boolean;
  preventCloseOnEscape?: boolean;
};
type DialogHeaderProps = ComponentProps<'div'>;
type DialogFooterProps = ComponentProps<'div'>;
type DialogTitleProps = ComponentProps<typeof DialogPrimitive.Title>;
type DialogDescriptionProps = ComponentProps<typeof DialogPrimitive.Description>;
type DialogBodyProps = ComponentProps<'div'>;
type DialogOverlayProps = ComponentProps<typeof DialogPrimitive.Overlay> & {
  ignoreModalState?: boolean;
};

type DialogContextType = {
  isOpen: boolean;
  isModal: boolean;
};

const DialogContext = createContext<DialogContextType | undefined>(undefined);

function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialogContext must be used within a DialogProvider');
  }
  return context;
}

function DialogRoot(props: Readonly<DialogProps>) {
  const { open, onOpenChange, defaultOpen, modal, ...rest } = props;

  const [isOpen, setIsOpen] = useControllableState({
    value: open,
    defaultValue: !!defaultOpen,
    onValueChange: onOpenChange,
  });

  const contextValue = useMemo(() => ({ isOpen, isModal: !!modal }), [isOpen, modal]);

  return (
    <DialogContext.Provider value={contextValue}>
      <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen} modal={modal} {...rest} />
    </DialogContext.Provider>
  );
}

const DialogTrigger = DialogPrimitive.Trigger;

const DialogClose = DialogPrimitive.Close;

function DialogContent(props: DialogContentProps) {
  const {
    className,
    children,
    persist,
    preventCloseOnEscape,
    onEscapeKeyDown,
    onInteractOutside = () => {},
    ref,
    ...rest
  } = props;

  const { isOpen } = useDialogContext();
  const { zIndex } = useModalStack();

  const handleOutsideInteraction = (event: Parameters<typeof onInteractOutside>[0]) => {
    if (persist) {
      event.preventDefault();
    }
    onInteractOutside(event);
  };

  const handleEscapeKeyDown = (event: KeyboardEvent) => {
    if (preventCloseOnEscape) {
      event.preventDefault();
    }
    onEscapeKeyDown?.(event);
  };

  return (
    <ReactPortal wrapperId="react-portal-dialogs-container">
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed left-[50%] top-[50%] h-full sm:h-auto max-h-screen overflow-y-auto flex flex-col w-full sm:max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border-0 sm:border bg-background p-6 shadow-none sm:shadow-lg duration-200 sm:rounded-lg',
          isOpen ? 'animate-dialog-enter' : 'animate-dialog-exit',
          className,
        )}
        onEscapeKeyDown={handleEscapeKeyDown}
        onInteractOutside={handleOutsideInteraction}
        style={{ zIndex: zIndex ?? 50 }}
        {...rest}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground cursor-pointer">
          <XIcon className="h-4 w-4" />
          <span className="sr-only">
            {/* TODO: use translation here */}
            {/* {t('close')} */}
            {'Close'}
          </span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </ReactPortal>
  );
}

const DialogHeader = (props: DialogHeaderProps) => {
  const { className, ref, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
      {...rest}
    />
  );
};

const DialogBody = (props: DialogBodyProps) => {
  const { className, ref, ...rest } = props;
  return <div ref={ref} className={cn('py-4 flex-1', className)} {...rest} />;
};

const DialogFooter = (props: DialogFooterProps) => {
  const { className, ref, ...rest } = props;
  return (
    <div ref={ref} className={cn('flex justify-end items-center gap-2', className)} {...rest} />
  );
};

const DialogTitle = (props: DialogTitleProps) => {
  const { className, ref, ...rest } = props;
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...rest}
    />
  );
};

const DialogDescription = (props: DialogDescriptionProps) => {
  const { className, ref, ...rest } = props;
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-sm text-muted-foreground pt-1', className)}
      {...rest}
    />
  );
};

const DialogOverlay = (props: DialogOverlayProps) => {
  const { className, ignoreModalState, ref, ...rest } = props;
  const { isOpen, isModal } = useDialogContext();
  const { zIndex } = useModalStack();

  const Component = ignoreModalState && !isModal ? 'div' : DialogPrimitive.Overlay;

  return (
    <ReactPortal wrapperId="react-portal-overlays-container">
      <Component
        ref={ref}
        data-state={isOpen ? 'open' : 'closed'}
        className={cn(
          'fixed inset-0 bg-black/80',
          isOpen ? 'animate-fade-in' : 'animate-fade-out',
          className,
        )}
        style={{ zIndex: zIndex ? zIndex - 1 : 49 }}
        {...rest}
      />
    </ReactPortal>
  );
};

const Dialog = composeCompoundComponent(DialogRoot, {
  Overlay: DialogOverlay,
  Close: DialogClose,
  Trigger: DialogTrigger,
  Content: DialogContent,
  Header: DialogHeader,
  Body: DialogBody,
  Footer: DialogFooter,
  Title: DialogTitle,
  Description: DialogDescription,
});

export {
  Dialog,
  DialogRoot,
  DialogTrigger,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  type DialogProps,
  type DialogTriggerProps,
  type DialogPortalProps,
  type DialogCloseProps,
  type DialogOverlayProps,
  type DialogContentProps,
  type DialogHeaderProps,
  type DialogBodyProps,
  type DialogFooterProps,
  type DialogTitleProps,
  type DialogDescriptionProps,
};
