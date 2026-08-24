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
  template: `
    <div class="menu-container">
      <h1>Menu</h1>
      
      <div class="filters">
        <select [(ngModel)]="selectedType" (change)="onTypeChange()">
          <option value="">All Types</option>
          <option *ngFor="let type of menuTypes" [value]="type.name">{{ type.name }}</option>
        </select>
        
        <select [(ngModel)]="selectedCuisine" (change)="onCuisineChange()">
          <option value="">All Cuisines</option>
          <option *ngFor="let cuisine of cuisines" [value]="cuisine.id">{{ cuisine.name }}</option>
        </select>

        <div class="view-toggle">
          <button 
            class="view-btn" 
            [class.active]="viewMode === 'cards'"
            (click)="setViewMode('cards')"
            title="Card view">
            ⊞
          </button>
          <button 
            class="view-btn" 
            [class.active]="viewMode === 'list'"
            (click)="setViewMode('list')"
            title="List view">
            ☰
          </button>
          <button 
            class="view-btn" 
            [class.active]="viewMode === 'classic'"
            (click)="setViewMode('classic')"
            title="Classic list view">
            ☰☰
          </button>
        </div>
      </div>

      <div class="order-summary" *ngIf="orderItems.length > 0">
        <h2>Your Order</h2>
        <div class="status-buttons">
          <button class="status-btn status-todo" [class.active]="orderStatus === 'TO_DO'" (click)="setStatus('TO_DO')">To Do</button>
          <button class="status-btn status-progress" [class.active]="orderStatus === 'IN_PROGRESS'" (click)="setStatus('IN_PROGRESS')">In Progress</button>
          <button class="status-btn status-done" [class.active]="orderStatus === 'DONE'" (click)="setStatus('DONE')">Done</button>
        </div>
        <div class="order-item" *ngFor="let orderItem of orderItems; let i = index">
          <span>{{ orderItem.menuItem.name }} x {{ orderItem.quantity }}</span>
          <span>{{ orderItem.price * orderItem.quantity | currency }}</span>
          <button (click)="removeFromOrder(i)">Remove</button>
        </div>
        <div class="total">
          <strong>Total: {{ getTotal() | currency }}</strong>
        </div>
        <div class="customer-form">
          <input [(ngModel)]="customerName" placeholder="Your name" />
          <button (click)="submitOrder()">Place Order</button>
        </div>
      </div>

      <div class="menu-items" [class.list-view]="viewMode === 'list'" [class.classic-view]="viewMode === 'classic'" *ngIf="menuItems.length > 0">
        <!-- Card View -->
        <ng-container *ngIf="viewMode === 'cards'">
          <div class="menu-item card-view" *ngFor="let item of menuItems">
            <h3>{{ item.name }}</h3>
            <p class="price">{{ item.price | currency }}</p>
            <p class="type">{{ item.menuItemTypeName }}</p>
            <div class="additions" *ngIf="item.additions && item.additions.length > 0">
              <strong>Additions:</strong>
              <span *ngFor="let add of item.additions">{{ add.name }} (+{{ add.price | currency }})</span>
            </div>
            <button (click)="addToOrder(item)">Add to Order</button>
          </div>
        </ng-container>

        <!-- List View -->
        <ng-container *ngIf="viewMode === 'list'">
          <div class="menu-item list-view" *ngFor="let item of menuItems">
            <div class="list-item-content">
              <div class="list-item-info">
                <h3>{{ item.name }}</h3>
                <p class="type">{{ item.menuItemTypeName }}</p>
                <div class="additions" *ngIf="item.additions && item.additions.length > 0">
                  <strong>Additions:</strong>
                  <span *ngFor="let add of item.additions">{{ add.name }} (+{{ add.price | currency }})</span>
                </div>
              </div>
              <div class="list-item-actions">
                <p class="price">{{ item.price | currency }}</p>
                <button (click)="addToOrder(item)">Add to Order</button>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- Classic List View -->
        <ng-container *ngIf="viewMode === 'classic'">
          <div class="menu-item classic-view" *ngFor="let item of menuItems">
            <div class="classic-item-content">
              <div class="classic-item-info">
                <h3>{{ item.name }}</h3>
                <p class="type">{{ item.menuItemTypeName }}</p>
                <div class="additions" *ngIf="item.additions && item.additions.length > 0">
                  <strong>Additions:</strong>
                  <span *ngFor="let add of item.additions">{{ add.name }} (+{{ add.price | currency }})</span>
                </div>
              </div>
              <div class="classic-item-actions">
                <p class="price">{{ item.price | currency }}</p>
                <button (click)="addToOrder(item)">Add to Order</button>
              </div>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .menu-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      margin-bottom: 1rem;
      color: #333;
    }
    .filters {
      margin-bottom: 2rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .filters select {
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .view-toggle {
      display: flex;
      gap: 0.25rem;
      margin-left: auto;
    }
    .view-btn {
      padding: 0.5rem 0.75rem;
      border: 1px solid #ddd;
      background: white;
      cursor: pointer;
      font-size: 1.2rem;
      transition: all 0.2s;
    }
    .view-btn:first-child {
      border-radius: 4px 0 0 4px;
    }
    .view-btn:last-child {
      border-radius: 0 4px 4px 0;
    }
    .view-btn.active {
      background: #1976d2;
      color: white;
      border-color: #1976d2;
    }
    .view-btn:hover:not(.active) {
      background: #f5f5f5;
    }
    .menu-items {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }
    .menu-items.list-view {
      grid-template-columns: 1fr;
    }
    .menu-items.classic-view {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .menu-item.classic-view {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-left: 4px solid #1976d2;
    }
    .classic-item-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    .classic-item-info {
      flex: 1;
    }
    .classic-item-info h3 {
      margin-bottom: 0.25rem;
    }
    .classic-item-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
    }
    .classic-item-actions .price {
      font-weight: bold;
      color: #1976d2;
      font-size: 1.2rem;
      margin: 0;
    }
    .menu-item {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .menu-item h3 {
      margin-bottom: 0.5rem;
    }
    .price {
      font-weight: bold;
      color: #1976d2;
      font-size: 1.2rem;
    }
    .type {
      color: #666;
      font-size: 0.9rem;
    }
    .additions {
      margin: 0.5rem 0;
      font-size: 0.85rem;
    }
    .additions span {
      display: block;
      color: #888;
    }
    .menu-item button {
      padding: 0.5rem 1rem;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .menu-item button:hover {
      background: #1565c0;
    }
    .list-view .menu-item {
      display: block;
    }
    .list-item-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    .list-item-info {
      flex: 1;
    }
    .list-item-info h3 {
      margin-bottom: 0.25rem;
    }
    .list-item-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
    }
    .list-item-actions .price {
      font-weight: bold;
      color: #1976d2;
      font-size: 1.2rem;
      margin: 0;
    }
    .status-buttons {
      display: flex;
      gap: 0.25rem;
      margin-bottom: 1rem;
    }
    .status-btn {
      padding: 0.25rem 0.5rem;
      border: 1px solid #ddd;
      background: white;
      cursor: pointer;
      font-size: 0.75rem;
      border-radius: 3px;
      transition: all 0.2s;
    }
    .status-btn.active {
      color: white;
      border-color: transparent;
    }
    .status-todo.active {
      background: #ff9800;
    }
    .status-progress.active {
      background: #2196f3;
    }
    .status-done.active {
      background: #4caf50;
    }
    .status-btn:hover:not(.active) {
      background: #f5f5f5;
    }
    .order-summary {
      margin-bottom: 2rem;
      background: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #eee;
    }
    .order-item button {
      padding: 0.25rem 0.5rem;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .total {
      margin-top: 1rem;
      text-align: right;
      font-size: 1.2rem;
    }
    .customer-form {
      margin-top: 1rem;
      display: flex;
      gap: 1rem;
    }
    .customer-form input {
      flex: 1;
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .customer-form button {
      padding: 0.5rem 1rem;
      background: #4caf50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  `]
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