import { cn } from '@/lib/utils/cn';
import { Slot } from '@radix-ui/react-slot';
import type { ComponentProps } from 'react';

export type ButtonVariant = 'filled' | 'outlined' | 'text' | 'ghost' | 'outlinedGhost' | 'none';
export type ButtonColor = 'primary' | 'danger' | 'secondary' | 'accent';

type ClassBuilder = string;
type ClassBuilderObject = Record<ButtonColor, ClassBuilder>;

const BASE_CLASS_BUILDERS_MAP = {
  filled: {
    primary: cn(
      'bg-primary text-primary-foreground border border-primary',
      'hover:bg-primary/85 hover:border-primary/85 hover:text-primary-foreground',
      'active:bg-primary active:border-primary active:shadow-none',
    ),
    danger: cn(
      'bg-danger text-danger-foreground rounded-md border border-danger',
      'hover:bg-danger/85 hover:border-danger/85 hover:text-danger-foreground',
      'active:bg-danger active:border-danger active:shadow-none',
    ),
    secondary: cn(
      'bg-secondary/70 text-secondary-foreground rounded-md border border-secondary/70',
      'hover:bg-secondary hover:border-secondary hover:text-secondary-foreground',
      'active:bg-secondary/70 active:border-secondary/70 active:shadow-none',
    ),
    accent: cn(
      'bg-accent text-accent-foreground rounded-md border border-accent',
      'hover:bg-accent/85 hover:border-accent/85 hover:text-accent-foreground',
      'active:bg-accent active:border-accent active:shadow-none active:text-accent-foreground',
    ),
  },
  outlined: {
    primary: cn(
      'border border-primary text-primary rounded-md',
      'hover:bg-primary hover:text-primary-foreground',
      'active:bg-primary/85 active:border-primary/85 active:text-primary-foreground focus:shadow-none',
    ),
    danger: cn(
      'border border-danger text-danger rounded-md',
      'hover:bg-danger hover:text-danger-foreground',
      'active:bg-danger/85 active:shadow-none',
    ),
    secondary: cn(
      'border border-secondary-foreground text-secondary-foreground rounded-md',
      'hover:bg-secondary-foreground hover:text-secondary',
      'active:bg-secondary-foreground/85 active:text-secondary active:shadow-none',
      'disabled:text-disabled disabled:no-underline',
    ),
    accent: cn(
      'border border-accent-foreground text-accent-foreground rounded-md',
      'hover:bg-accent-foreground hover:text-accent',
      'active:bg-accent-foreground/85 active:text-accent active:shadow-none',
    ),
  },
  text: {
    primary: cn(
      'text-primary border-b border-transparent',
      'hover:border-primary/85',
      'focus-visible:border-primary/85',
      'active:border-primary',
      'disabled:text-disabled disabled:no-underline',
    ),
    danger: cn(
      'text-danger',
      'hover:border-danger/85',
      'focus-visible:border-danger/85',
      'active:border-danger',
      'disabled:text-disabled disabled:no-underline',
    ),
    secondary: cn(
      'text-secondary-foreground',
      'hover:border-secondary/85',
      'focus-visible:border-secondary/85',
      'active:border-secondary',
      'disabled:text-disabled disabled:no-underline',
    ),
    accent: cn(
      'text-accent-foreground',
      'hover:border-accent/85',
      'focus-visible:border-accent/85',
      'active:border-accent',
      'disabled:text-disabled disabled:no-underline',
    ),
  },
  ghost: {
    accent: cn(
      'text-accent-foreground',
      'border border-transparent',
      'hover:bg-accent',
      'active:text-accent-foreground/85',
      'disabled:text-disabled disabled:no-underline',
    ),
    primary: cn(
      'text-primary',
      'border border-transparent',
      'hover:bg-primary/10',
      'active:text-primary/85',
      'disabled:text-disabled disabled:no-underline',
    ),
    danger: cn(
      'text-danger',
      'border border-transparent',
      'hover:bg-danger/10',
      'active:text-danger/85',
      'disabled:text-disabled disabled:no-underline',
    ),
    secondary: cn(
      'text-secondary-foreground',
      'border border-transparent',
      'hover:bg-secondary/85',
      'active:bg-secondary/45',
      'disabled:text-disabled disabled:no-underline',
    ),
  },
  none: {
    primary: cn('text-primary', 'disabled:text-disabled'),
    danger: cn('text-danger', 'disabled:text-disabled'),
    secondary: cn('text-secondary-foreground', 'disabled:text-disabled'),
    accent: cn('text-accent-foreground', 'disabled:text-disabled'),
  },
} as const;

const CLASS_BUILDERS_MAP = {
  ...BASE_CLASS_BUILDERS_MAP,
  outlinedGhost: {
    accent: cn(BASE_CLASS_BUILDERS_MAP.ghost.accent, 'border-accent-foreground/20'),
    primary: cn(BASE_CLASS_BUILDERS_MAP.ghost.primary, 'border-primary/20'),
    danger: cn(BASE_CLASS_BUILDERS_MAP.ghost.danger, 'border-danger/20'),
    secondary: cn(BASE_CLASS_BUILDERS_MAP.ghost.secondary, 'border-secondary-foreground/20'),
  },
} as const satisfies Record<ButtonVariant, ClassBuilderObject>;

type VariantColorCombo = {
  variant?: ButtonVariant;
  color?: ButtonColor;
};

type ButtonProps = ComponentProps<'button'> & {
  asChild?: boolean;
  isLoading?: boolean;
  fillSpace?: boolean;
} & VariantColorCombo;

type ButtonClassBuilderProps = Pick<
  ButtonProps,
  'variant' | 'color' | 'fillSpace' | 'isLoading' | 'className'
>;

const Button = (props: ButtonProps) => {
  const {
    variant = 'filled',
    color: colorProp,
    asChild = false,
    fillSpace = false,
    isLoading = false,
    type = 'button',
    className,
    children,
    ref,
    ...rest
  } = props;

  const Component = asChild ? Slot : 'button';

  const btnClass = buildButtonClass({ variant, color: colorProp, fillSpace, isLoading, className });

  return (
    <Component className={btnClass} type={type} ref={ref} {...rest}>
      {children}
    </Component>
  );
};

function buildButtonClass(props: ButtonClassBuilderProps) {
  const {
    variant = 'filled',
    color: colorProp,
    fillSpace = false,
    isLoading = false,
    className,
  } = props;

  const isLoadingAnimationVisible = isLoading && variant !== 'text' && variant !== 'none';

  const color = colorProp ?? (variant === 'ghost' ? 'accent' : 'primary');

  const variantClassName = variant !== 'none' ? CLASS_BUILDERS_MAP[variant]?.[color] : undefined;

  const loadingCls =
    isLoading && variant !== 'text' && variant !== 'none'
      ? cn(
          'pointer-events-none',
          'btn-loading', // generic gradient
          color === 'danger' && 'btn-loading--danger',
        )
      : undefined;

  return cn(
    'cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap transition-all outline-none',
    '[&>.loading-icon]:pointer-events-none [&>.loading-icon]:size-4 [&>.loading-icon]:shrink-0',
    'disabled:pointer-events-none  disabled:opacity-50',
    'text-[14px] font-semibold capitalize',
    'focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1',
    variant !== 'text' && variant !== 'none' && 'h-9 rounded-md px-4 py-2',
    isLoadingAnimationVisible && 'animate-button-loading bg-[length:200%_100%]',
    loadingCls,
    variantClassName,
    fillSpace && 'size-full rounded-none p-0',
    className,
  );
}

export { type ButtonProps, Button, type ButtonClassBuilderProps, buildButtonClass };
