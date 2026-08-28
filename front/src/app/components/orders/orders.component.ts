import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { Order, OrderStatus } from '../../models/models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="orders-container">
      <h1>Orders</h1>
      
      <div class="view-toggle" *ngIf="orders.length > 0">
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

      <div class="orders-list" [class.list-view]="viewMode === 'list'" [class.classic-view]="viewMode === 'classic'" *ngIf="orders.length > 0">
        <!-- Card View -->
        <ng-container *ngIf="viewMode === 'cards'">
          <div class="order-card" *ngFor="let order of orders">
            <div class="order-header">
              <h3>Order #{{ order.id }}</h3>
              <div class="order-status-display">
                <span class="status-badge" [ngClass]="getStatusClass(order.status)">
                  {{ getStatusLabel(order.status) }}
                </span>
              </div>
              <div class="status-buttons">
                <button class="status-btn status-todo" [class.active]="order.status === 'TO_DO'" (click)="updateStatus(order, 'TO_DO')">Do realizacji</button>
                <button class="status-btn status-progress" [class.active]="order.status === 'IN_PROGRESS'" (click)="updateStatus(order, 'IN_PROGRESS')">W trakcie</button>
                <button class="status-btn status-done" [class.active]="order.status === 'DONE'" (click)="updateStatus(order, 'DONE')">Gotowe</button>
              </div>
            </div>
            <p class="customer">Customer: {{ order.customer }}</p>
            <div class="order-items">
              <div class="order-item" *ngFor="let item of order.orderItems">
                <div class="order-item-info">
                  <span>{{ item.menuItem.name }}</span>
                  <div class="item-controls">
                    <button class="qty-btn" (click)="decreaseQuantity(order, item)" title="Decrease quantity">−</button>
                    <span class="quantity">{{ item.quantity }}</span>
                    <button class="qty-btn" (click)="increaseQuantity(order, item)" title="Increase quantity">+</button>
                    <button class="remove-btn" (click)="removeItem(order, item)" title="Remove item">✕</button>
                  </div>
                </div>
                <span>{{ item.price * item.quantity | currency }}</span>
              </div>
            </div>
            <div class="order-total">
              <strong>Total: {{ getOrderTotal(order) | currency }}</strong>
            </div>
          </div>
        </ng-container>

        <!-- List View -->
        <ng-container *ngIf="viewMode === 'list'">
          <div class="order-list-item" *ngFor="let order of orders">
            <div class="order-list-content">
              <div class="order-list-info">
                <div class="order-header">
                  <h3>Order #{{ order.id }}</h3>
                  <div class="order-status-display">
                    <span class="status-badge" [ngClass]="getStatusClass(order.status)">
                      {{ getStatusLabel(order.status) }}
                    </span>
                  </div>
                  <div class="status-buttons">
                    <button class="status-btn status-todo" [class.active]="order.status === 'TO_DO'" (click)="updateStatus(order, 'TO_DO')">Do realizacji</button>
                    <button class="status-btn status-progress" [class.active]="order.status === 'IN_PROGRESS'" (click)="updateStatus(order, 'IN_PROGRESS')">W trakcie</button>
                    <button class="status-btn status-done" [class.active]="order.status === 'DONE'" (click)="updateStatus(order, 'DONE')">Gotowe</button>
                  </div>
                </div>
                <p class="customer">Customer: {{ order.customer }}</p>
                <div class="order-items">
                  <div class="order-item" *ngFor="let item of order.orderItems">
                    <div class="order-item-info">
                      <span>{{ item.menuItem.name }}</span>
                      <div class="item-controls">
                        <button class="qty-btn" (click)="decreaseQuantity(order, item)" title="Decrease quantity">−</button>
                        <span class="quantity">{{ item.quantity }}</span>
                        <button class="qty-btn" (click)="increaseQuantity(order, item)" title="Increase quantity">+</button>
                        <button class="remove-btn" (click)="removeItem(order, item)" title="Remove item">✕</button>
                      </div>
                    </div>
                    <span>{{ item.price * item.quantity | currency }}</span>
                  </div>
                </div>
              </div>
              <div class="order-list-actions">
                <div class="order-total">
                  <strong>Total: {{ getOrderTotal(order) | currency }}</strong>
                </div>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- Classic List View -->
        <ng-container *ngIf="viewMode === 'classic'">
          <div class="order-classic-item" *ngFor="let order of orders">
            <div class="order-classic-header">
              <div class="order-header">
                <h3>Order #{{ order.id }}</h3>
                <div class="order-status-display">
                  <span class="status-badge" [ngClass]="getStatusClass(order.status)">
                    {{ getStatusLabel(order.status) }}
                  </span>
                </div>
                <div class="status-buttons">
                  <button class="status-btn status-todo" [class.active]="order.status === 'TO_DO'" (click)="updateStatus(order, 'TO_DO')">Do realizacji</button>
                  <button class="status-btn status-progress" [class.active]="order.status === 'IN_PROGRESS'" (click)="updateStatus(order, 'IN_PROGRESS')">W trakcie</button>
                  <button class="status-btn status-done" [class.active]="order.status === 'DONE'" (click)="updateStatus(order, 'DONE')">Gotowe</button>
                </div>
              </div>
              <p class="customer">Customer: {{ order.customer }}</p>
            </div>
            <div class="order-items">
              <div class="order-item" *ngFor="let item of order.orderItems">
                <div class="order-item-info">
                  <span>{{ item.menuItem.name }}</span>
                  <div class="item-controls">
                    <button class="qty-btn" (click)="decreaseQuantity(order, item)" title="Decrease quantity">−</button>
                    <span class="quantity">{{ item.quantity }}</span>
                    <button class="qty-btn" (click)="increaseQuantity(order, item)" title="Increase quantity">+</button>
                    <button class="remove-btn" (click)="removeItem(order, item)" title="Remove item">✕</button>
                  </div>
                </div>
                <span>{{ item.price * item.quantity | currency }}</span>
              </div>
            </div>
            <div class="order-total">
              <strong>Total: {{ getOrderTotal(order) | currency }}</strong>
            </div>
          </div>
        </ng-container>
      </div>
      
      <div class="no-orders" *ngIf="orders.length === 0">
        <p>No orders yet. Place an order from the menu!</p>
      </div>
    </div>
  `,
  styles: [`
    .orders-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      margin-bottom: 1rem;
      color: #333;
    }
    .view-toggle {
      display: flex;
      gap: 0.25rem;
      margin-bottom: 1rem;
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
    .orders-list.list-view {
      grid-template-columns: 1fr;
    }
    
    .orders-list.classic-view {
      display: block !important;
    }
    .order-classic-item {
      background: white;
      padding: 1rem;
      border-bottom: 1px solid #eee;
    }
    .order-classic-item:last-child {
      border-bottom: none;
    }
    .order-classic-header {
      margin-bottom: 0.5rem;
    }
    .order-classic-header .order-header {
      margin-bottom: 0.25rem;
    }
    .order-classic-header h3 {
      margin: 0;
      color: #1976d2;
    }
    .order-classic-header .customer {
      color: #666;
      margin: 0;
    }
    .order-card {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }
    .order-header h3 {
      color: #1976d2;
      margin: 0;
    }
    .order-status-display {
      flex: 1;
      text-align: center;
    }
    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: bold;
      color: white;
    }
    .status-badge.status-todo {
      background: #ff9800;
    }
    .status-badge.status-progress {
      background: #2196f3;
    }
    .status-badge.status-done {
      background: #4caf50;
    }
    .status-buttons {
      display: flex;
      gap: 0.25rem;
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
    .order-card h3 {
      margin-bottom: 0.5rem;
      color: #1976d2;
    }
    .customer {
      color: #666;
      margin-bottom: 1rem;
    }
    .order-items {
      margin-bottom: 1rem;
    }
    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #eee;
    }
    .order-item-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .item-controls {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .qty-btn {
      width: 24px;
      height: 24px;
      border: 1px solid #ccc;
      background: #f5f5f5;
      border-radius: 3px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      padding: 0;
    }
    .qty-btn:hover {
      background: #e0e0e0;
    }
    .quantity {
      min-width: 20px;
      text-align: center;
      font-weight: bold;
    }
    .remove-btn {
      width: 24px;
      height: 24px;
      border: 1px solid #f44336;
      background: #fff;
      color: #f44336;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      padding: 0;
      margin-left: 4px;
    }
    .remove-btn:hover {
      background: #f44336;
      color: white;
    }
    .order-total {
      text-align: right;
      font-size: 1.1rem;
    }
    .order-list-item {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .order-list-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    .order-list-info {
      flex: 1;
    }
    .order-list-info h3 {
      margin-bottom: 0.25rem;
      color: #1976d2;
    }
    .order-list-info .customer {
      color: #666;
      margin-bottom: 0.5rem;
    }
    .order-list-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
    }
    .no-orders {
      text-align: center;
      padding: 2rem;
      color: #666;
    }
  `]
})
  export class OrdersComponent implements OnInit {
    orders: Order[] = [];
    viewMode: 'cards' | 'list' | 'classic' = 'cards';

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.getAllOrders().subscribe(orders => {
      this.orders = orders;
    });
  }

  setViewMode(mode: 'cards' | 'list' | 'classic') {
    this.viewMode = mode;
  }

  getOrderTotal(order: Order): number {
    return order.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getStatusLabel(status: OrderStatus): string {
    switch(status) {
      case 'TO_DO': return 'Do realizacji';
      case 'IN_PROGRESS': return 'W trakcie';
      case 'DONE': return 'Gotowe';
      default: return status;
    }
  }

  getStatusClass(status: OrderStatus): string {
    switch(status) {
      case 'TO_DO': return 'status-todo';
      case 'IN_PROGRESS': return 'status-progress';
      case 'DONE': return 'status-done';
      default: return '';
    }
  }

  increaseQuantity(order: Order, item: any) {
    const newQuantity = item.quantity + 1;
    this.orderService.updateItemQuantity(order.id, item.id, newQuantity).subscribe(updatedOrder => {
      Object.assign(order, updatedOrder);
    });
  }

  decreaseQuantity(order: Order, item: any) {
    if (item.quantity <= 1) {
      this.removeItem(order, item);
      return;
    }
    const newQuantity = item.quantity - 1;
    this.orderService.updateItemQuantity(order.id, item.id, newQuantity).subscribe(updatedOrder => {
      Object.assign(order, updatedOrder);
    });
  }

  removeItem(order: Order, item: any) {
    this.orderService.removeItem(order.id, item.id).subscribe(updatedOrder => {
      Object.assign(order, updatedOrder);
    });
  }

  updateStatus(order: Order, status: OrderStatus) {
    // Optimistically update the UI first
    order.status = status;

    // Send the update to the server
    this.orderService.updateStatus(order.id, status).subscribe({
      next: (updatedOrder) => {
        // Replace the current order's data with the server response
        const index = this.orders.indexOf(order);
        if (index !== -1) {
          this.orders[index] = updatedOrder;
        }
      },
      error: (err) => {
        console.error('Failed to update order status:', err);
        // Revert optimistic update on error
        this.loadOrders();
      }
    });
  }
}
