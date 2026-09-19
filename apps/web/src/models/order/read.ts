import type { OrderStatus } from '@ecom/contracts';

export type OrderLine = {
  id: string;
  productId: string;
  title: string;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
  displayUnitPrice: string;
  lineTotal: number;
  displayLineTotal: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  displayStatus: string;
  lines: OrderLine[];
  itemCount: number;
  subtotal: number;
  displaySubtotal: string;
  shipping: number;
  displayShipping: string;
  total: number;
  displayTotal: string;
  placedAt: Date;
  displayPlacedAt: string;
};
