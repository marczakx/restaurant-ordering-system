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
  status: OrderStatus;
}
