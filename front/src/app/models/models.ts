export interface CuisineDto {
  id: number;
  name: string;
}

export interface MenuItemTypeDto {
  id: number;
  name: string;
}

export interface Addition {
  id: number;
  name: string;
  price: number;
}

export interface MenuItemDto {
  id: number | null;
  name: string;
  price: number;
  additions: Addition[];
  menuItemTypeName: string;
  cuisineIds: number[];
}

export interface AdditionOrderItem {
  id: number;
  addition: Addition;
  price: number;
}

export interface OrderItem {
  id: number;
  menuItem: MenuItemDto;
  price: number;
  quantity: number;
  additionOrderItems: AdditionOrderItem[];
}

export type OrderStatus = 'TO_DO' | 'IN_PROGRESS' | 'DONE';

/** Supported payment methods. Mirrors the backend PaymentMethod enum. */
export type PaymentMethod = 'BLIK';

/** Payment lifecycle. Mirrors the backend PaymentStatus enum. */
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface Order {
  id: number;
  orderItems: OrderItem[];
  customer: string;
  /**
   * Stable Keycloak {@code sub} claim of the user that placed the order.
   * Used to scope the order list to the logged-in user on the backend
   * (replaces the previous "customer name" filter).
   */
  userId?: string | null;
  status: OrderStatus;
  /** Payment method chosen for the order; null when not selected yet. */
  paymentMethod?: PaymentMethod | null;
  /** Payment state; null when no payment has been attempted yet. */
  paymentStatus?: PaymentStatus | null;
}
