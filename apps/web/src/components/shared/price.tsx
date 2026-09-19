import { cn } from '@/lib/utils/cn';
import { formatMoney } from '@/lib/utils/money';

interface PriceProps {
  /** Minor units (fils), as the API sends them. */
  price: number;
  /** Minor units. When lower than `price`, the original is shown struck through. */
  priceAfterSale?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
} as const;

const Price = ({ price, priceAfterSale, className, size = 'md' }: PriceProps) => {
  const hasDiscount = priceAfterSale !== undefined && priceAfterSale < price;

  return (
    <div className={cn('flex items-baseline gap-2 tabular-nums', SIZE_CLASSES[size], className)}>
      {hasDiscount ? (
        <>
          <s className="text-muted-foreground">{formatMoney(price)}</s>
          <span className="font-semibold text-foreground">{formatMoney(priceAfterSale)}</span>
        </>
      ) : (
        <span className="font-semibold text-foreground">{formatMoney(price)}</span>
      )}
    </div>
  );
};

export default Price;
