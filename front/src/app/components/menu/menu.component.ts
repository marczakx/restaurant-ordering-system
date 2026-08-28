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

  editingItem: MenuItemDto | null = null;
  editName: string = '';
  editPrice: number | null = null;
  editTypeName: string = '';
  editCuisineIds: number[] = [];

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

  startEditing(item: MenuItemDto) {
    this.editingItem = item;
    this.editName = item.name;
    this.editPrice = item.price;
    this.editTypeName = item.menuItemTypeName || '';
    this.editCuisineIds = item.cuisineIds ? [...item.cuisineIds] : [];
  }

  cancelEditing() {
    this.editingItem = null;
    this.editName = '';
    this.editPrice = null;
    this.editTypeName = '';
    this.editCuisineIds = [];
  }

  toggleEditCuisine(cuisineId: number) {
    const index = this.editCuisineIds.indexOf(cuisineId);
    if (index >= 0) {
      this.editCuisineIds.splice(index, 1);
    } else {
      this.editCuisineIds.push(cuisineId);
    }
  }

  saveEditing() {
    if (!this.editingItem || this.editingItem.id === null) return;
    if (!this.editName || this.editPrice === null) return;

    const updatedItem: MenuItemDto = {
      id: this.editingItem.id,
      name: this.editName,
      price: this.editPrice,
      additions: this.editingItem.additions || [],
      menuItemTypeName: this.editTypeName,
      cuisineIds: this.editCuisineIds
    };

    this.menuService.updateMenuItem(this.editingItem.id, updatedItem).subscribe({
      next: (saved) => {
        const index = this.menuItems.findIndex(mi => mi.id !== null && saved.id !== null && mi.id === saved.id);
        if (index >= 0) {
          this.menuItems[index] = saved;
        }
        this.cancelEditing();
      },
      error: () => alert('Failed to update menu item.')
    });
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