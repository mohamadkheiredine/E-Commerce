import { cn } from '@/lib/utils/cn';
import { composeCompoundComponent } from '@/lib/utils/components';
import { ComponentProps, ComponentPropsWithoutRef, ComponentRef, Ref } from 'react';
import { Separator } from '@/components/shared/separator';

const CardRoot = ({ className, ...props }: ComponentProps<'div'>) => {
  return (
    <div
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
        className,
      )}
      {...props}
    />
  );
};

const CardHeader = ({ className, ...props }: ComponentProps<'div'>) => {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  );
};

const CardTitle = ({ className, ...props }: ComponentProps<'div'>) => {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  );
};

const CardDescription = ({ className, ...props }: ComponentProps<'div'>) => {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
};

const CardAction = ({ className, ...props }: ComponentProps<'div'>) => {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
};

const CardContent = ({ className, ...props }: ComponentProps<'div'>) => {
  return <div data-slot="card-content" className={cn('px-0 md:px-6', className)} {...props} />;
};

const CardFooter = ({ className, ...props }: ComponentProps<'div'>) => {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  );
};

type SidebarSeparatorRef = ComponentRef<typeof Separator>;

type SidebarSeparatorProps = ComponentPropsWithoutRef<typeof Separator> & {
  ref?: Ref<SidebarSeparatorRef>;
};

const CardSeparator = ({ className, ref, ...props }: SidebarSeparatorProps) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn('mx-0 w-auto bg-sidebar-border', className)}
      {...props}
    />
  );
};

const Card = composeCompoundComponent(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Action: CardAction,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter,
  Separator: CardSeparator,
});

export { Card };
