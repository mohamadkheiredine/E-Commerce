import { cn } from '@/lib/utils/cn';
import { composeCompoundComponent } from '@/lib/utils/components';
import { ComponentProps } from 'react';

const PageLayoutRoot = ({ className, ...props }: ComponentProps<'div'>) => {
  return (
    <div
      className={cn('bg-card text-card-foreground flex flex-col border shadow-sm', className)}
      {...props}
    />
  );
};

const PageLayoutHeader = ({ className, ...props }: ComponentProps<'div'>) => {
  return (
    <div
      data-slot="card-header"
      className={cn('px-2 md:px-6 flex items-center justify-between h-12 border-b', className)}
      {...props}
    />
  );
};

const PageLayoutTitle = ({ className, ...props }: ComponentProps<'div'>) => {
  return <div className={cn('w-full leading-none font-semibold', className)} {...props} />;
};

const PageLayoutActions = ({ className, ...props }: ComponentProps<'div'>) => {
  return <div className={cn('flex items-center gap-2', className)} {...props} />;
};

const PageLayoutContent = ({ className, ...props }: ComponentProps<'div'>) => {
  return <div className={cn('px-0 md:px-6', className)} {...props} />;
};

const PageLayoutFooter = ({ className, ...props }: ComponentProps<'div'>) => {
  return (
    <div className={cn('flex items-center px-0 md:px-6 [.border-t]:pt-6', className)} {...props} />
  );
};

const PageLayout = composeCompoundComponent(PageLayoutRoot, {
  Header: PageLayoutHeader,
  Title: PageLayoutTitle,
  Actions: PageLayoutActions,
  Content: PageLayoutContent,
  Footer: PageLayoutFooter,
});

export { PageLayout };
