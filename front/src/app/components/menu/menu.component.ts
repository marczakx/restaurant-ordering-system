import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../../services/menu.service';
import { OrderService } from '../../services/order.service';
import { CuisineDto, MenuItemDto, MenuItemTypeDto, Order, OrderItem, OrderStatus } from '../../models/models';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {
  cuisines: CuisineDto[] = [];
  menuTypes: MenuItemTypeDto[] = [];
  menuItems: MenuItemDto[] = [];
  orderItems: OrderItem[] = [];
  viewMode: 'cards' | 'list' | 'classic' = 'cards';

  selectedType: string = '';
  selectedCuisine: number | null = null;
  customerName: string = '';
  orderStatus: OrderStatus = 'TO_DO';

  constructor(
    private menuService: MenuService,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    this.loadCuisines();
    this.loadMenuTypes();
    this.loadMenuItems();
  }

  loadCuisines() {
    this.menuService.getCuisines().subscribe(cuisines => {
      this.cuisines = cuisines;
    });
  }

  loadMenuTypes() {
    this.menuService.getMenuItemTypes().subscribe(types => {
      this.menuTypes = types;
    });
  }

  loadMenuItems() {
    if (this.selectedType) {
      this.menuService.getMenuItems(this.selectedType, this.selectedCuisine || undefined)
        .subscribe(items => this.menuItems = items);
    } else if (this.selectedCuisine) {
      this.menuService.getAllMenuItems(this.selectedCuisine).subscribe(items => this.menuItems = items);
    } else {
      this.menuService.getAllMenuItems().subscribe(items => this.menuItems = items);
    }
  }

  onTypeChange() {
    this.loadMenuItems();
  }

  onCuisineChange() {
    this.loadMenuItems();
  }

  setViewMode(mode: 'cards' | 'list' | 'classic') {
    this.viewMode = mode;
  }

  setStatus(status: OrderStatus) {
    this.orderStatus = status;
  }

  addToOrder(item: MenuItemDto) {
    const existingItem = this.orderItems.find(oi =>
      oi.menuItem.id !== null && item.id !== null && oi.menuItem.id === item.id
    );
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.orderItems.push({
        id: 0,
        menuItem: item,
        price: item.price,
        quantity: 1,
        additionOrderItems: []
      });
    }
  }

  removeFromOrder(index: number) {
    this.orderItems.splice(index, 1);
  }

  getTotal(): number {
    return this.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  submitOrder() {
    if (!this.customerName || this.orderItems.length === 0) return;

    const order: Order = {
      id: 0,
      orderItems: this.orderItems,
      customer: this.customerName,
      status: this.orderStatus
    };

    this.orderService.saveOrder(order).subscribe(() => {
      this.orderItems = [];
      this.customerName = '';
      alert('Order placed successfully!');
    });
  }
}