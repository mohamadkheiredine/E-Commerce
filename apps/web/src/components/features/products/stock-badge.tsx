import { Badge } from '@/components/shared/badge';
import { cn } from '@/lib/utils/cn';

type Props = {
  stock: number;
  inStock: boolean;
  isLowStock: boolean;
  /** Show the exact count ("Only 3 left") rather than just "Low stock". */
  exact?: boolean;
  className?: string;
};

/**
 * One component for the three stock states, so the wording and colour are decided
 * once and the listing, detail and cart pages cannot drift from each other.
 */
export function StockBadge({ stock, inStock, isLowStock, exact = false, className }: Props) {
  if (!inStock) {
    return (
      <Badge variant="outline" className={cn('border-destructive/40 text-destructive', className)}>
        Out of stock
      </Badge>
    );
  }

  if (isLowStock) {
    return (
      <Badge
        variant="outline"
        className={cn('border-warning/60 bg-warning-light text-warning-foreground', className)}
      >
        {exact ? `Only ${stock} left` : 'Low stock'}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn('border-success/40 bg-success-light text-success', className)}
    >
      In stock
    </Badge>
  );
}
