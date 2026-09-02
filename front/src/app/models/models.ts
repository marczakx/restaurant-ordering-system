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
}
