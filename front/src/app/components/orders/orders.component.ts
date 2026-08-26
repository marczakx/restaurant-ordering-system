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
        <button 
          class="view-btn" 
          [class.active]="viewMode === 'table'"
          (click)="setViewMode('table')"
          title="Table view">
          ▦
        </button>
        <button 
          class="view-btn" 
          [class.active]="viewMode === 'board'"
          (click)="setViewMode('board')"
          title="Kanban board view">
          ◫
        </button>
        <button 
          class="view-btn" 
          [class.active]="viewMode === 'compact'"
          (click)="setViewMode('compact')"
          title="Compact view">
          ≡
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

        <!-- Table View -->
        <ng-container *ngIf="viewMode === 'table'">
          <div class="orders-table-wrapper">
            <table class="orders-table">
              <thead>
                <tr>
                  <th>Zamówienie</th>
                  <th>Klient</th>
                  <th>Pozycje</th>
                  <th>Suma</th>
                  <th>Status</th>
                  <th>Zmień status</th>
                </tr>
              </thead>
              <tbody>
                <ng-container *ngFor="let order of orders">
                  <tr class="orders-table-row" (click)="toggleExpanded(order.id)">
                    <td>#{{ order.id }}</td>
                    <td>{{ order.customer }}</td>
                    <td>{{ getItemCount(order) }}</td>
                    <td>{{ getOrderTotal(order) | currency }}</td>
                    <td>
                      <span class="status-badge" [ngClass]="getStatusClass(order.status)">
                        {{ getStatusLabel(order.status) }}
                      </span>
                    </td>
                    <td (click)="$event.stopPropagation()">
                      <div class="status-buttons">
                        <button class="status-btn status-todo" [class.active]="order.status === 'TO_DO'" (click)="updateStatus(order, 'TO_DO')">Do realizacji</button>
                        <button class="status-btn status-progress" [class.active]="order.status === 'IN_PROGRESS'" (click)="updateStatus(order, 'IN_PROGRESS')">W trakcie</button>
                        <button class="status-btn status-done" [class.active]="order.status === 'DONE'" (click)="updateStatus(order, 'DONE')">Gotowe</button>
                      </div>
                    </td>
                  </tr>
                  <tr class="orders-table-details" *ngIf="expandedOrderId === order.id">
                    <td colspan="6">
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
                    </td>
                  </tr>
                </ng-container>
              </tbody>
            </table>
          </div>
        </ng-container>

        <!-- Board View -->
        <ng-container *ngIf="viewMode === 'board'">
          <div class="board">
            <p class="board-hint">Przeciągnij kartę do innej kolumny, aby zmienić status zamówienia</p>
            <div class="board-column" *ngFor="let column of boardColumns">
              <div class="board-column-header" [ngClass]="column.headerClass">
                <span>{{ column.label }}</span>
                <span class="board-column-count">{{ getOrdersByStatus(column.status).length }}</span>
              </div>
              <div class="board-cards"
                   [class.drop-target]="dragOverStatus === column.status && draggingOrderId !== null"
                   (dragover)="onDragOver($event, column.status)"
                   (dragleave)="onDragLeave($event, column.status)"
                   (drop)="onDrop($event, column.status)">
                <div class="board-card"
                     *ngFor="let order of getOrdersByStatus(column.status)"
                     [draggable]="true"
                     [class.dragging]="draggingOrderId === order.id"
                     (dragstart)="onDragStart(order, $event)"
                     (dragend)="onDragEnd()">
                  <div class="board-card-header">
                    <span class="board-order-id">#{{ order.id }}</span>
                    <strong>{{ getOrderTotal(order) | currency }}</strong>
                  </div>
                  <p class="board-customer">{{ order.customer }}</p>
                  <ul class="board-items">
                    <li *ngFor="let item of order.orderItems">{{ item.quantity }}× {{ item.menuItem.name }}</li>
                  </ul>
                  <div class="status-buttons">
                    <button class="status-btn status-todo" [class.active]="order.status === 'TO_DO'" (click)="updateStatus(order, 'TO_DO')">Do realizacji</button>
                    <button class="status-btn status-progress" [class.active]="order.status === 'IN_PROGRESS'" (click)="updateStatus(order, 'IN_PROGRESS')">W trakcie</button>
                    <button class="status-btn status-done" [class.active]="order.status === 'DONE'" (click)="updateStatus(order, 'DONE')">Gotowe</button>
                  </div>
                </div>
                <p class="board-empty" *ngIf="getOrdersByStatus(column.status).length === 0">Brak zamówień</p>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- Compact View -->
        <ng-container *ngIf="viewMode === 'compact'">
          <div class="compact-list">
            <div class="compact-row" *ngFor="let order of orders">
              <div class="compact-summary" (click)="toggleExpanded(order.id)">
                <span class="compact-id">#{{ order.id }}</span>
                <span class="compact-customer">{{ order.customer }}</span>
                <span class="compact-count">{{ getItemCount(order) }} poz.</span>
                <span class="compact-total">{{ getOrderTotal(order) | currency }}</span>
                <span class="status-badge" [ngClass]="getStatusClass(order.status)">
                  {{ getStatusLabel(order.status) }}
                </span>
                <span class="compact-chevron">{{ expandedOrderId === order.id ? '▲' : '▼' }}</span>
              </div>
              <div class="compact-details" *ngIf="expandedOrderId === order.id">
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
                <div class="compact-details-actions">
                  <div class="status-buttons">
                    <button class="status-btn status-todo" [class.active]="order.status === 'TO_DO'" (click)="updateStatus(order, 'TO_DO')">Do realizacji</button>
                    <button class="status-btn status-progress" [class.active]="order.status === 'IN_PROGRESS'" (click)="updateStatus(order, 'IN_PROGRESS')">W trakcie</button>
                    <button class="status-btn status-done" [class.active]="order.status === 'DONE'" (click)="updateStatus(order, 'DONE')">Gotowe</button>
                  </div>
                </div>
              </div>
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
    /* Table view */
    .orders-table-wrapper {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow-x: auto;
    }
    .orders-table {
      width: 100%;
      border-collapse: collapse;
    }
    .orders-table th {
      text-align: left;
      padding: 0.75rem 1rem;
      background: #f5f5f5;
      color: #555;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 2px solid #e0e0e0;
      white-space: nowrap;
    }
    .orders-table td {
      padding: 0.65rem 1rem;
      border-bottom: 1px solid #eee;
      font-size: 0.9rem;
      vertical-align: middle;
    }
    .orders-table-row {
      cursor: pointer;
    }
    .orders-table-row:hover {
      background: #fafafa;
    }
    .orders-table-details td {
      background: #fafafa;
    }

    /* Board view */
    .board {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      align-items: start;
    }
    .board-column {
      background: #f0f2f5;
      border-radius: 8px;
      padding: 0.75rem;
      min-height: 200px;
    }
    .board-column-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      color: white;
      font-weight: bold;
      margin-bottom: 0.75rem;
    }
    .board-column-header.column-todo {
      background: #ff9800;
    }
    .board-column-header.column-progress {
      background: #2196f3;
    }
    .board-column-header.column-done {
      background: #4caf50;
    }
    .board-column-count {
      background: rgba(255,255,255,0.3);
      border-radius: 10px;
      padding: 0 0.5rem;
      font-size: 0.8rem;
    }
    .board-card {
      background: white;
      border-radius: 6px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }
    .board-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }
    .board-order-id {
      color: #1976d2;
      font-weight: bold;
    }
    .board-customer {
      color: #666;
      font-size: 0.85rem;
      margin: 0 0 0.5rem;
    }
    .board-items {
      margin: 0 0 0.5rem;
      padding-left: 1.1rem;
      font-size: 0.85rem;
      color: #444;
    }
    .board-empty {
      color: #999;
      font-size: 0.85rem;
      text-align: center;
      margin: 1rem 0;
    }
    .board-hint {
      grid-column: 1 / -1;
      margin: 0 0 0.25rem;
      color: #777;
      font-size: 0.8rem;
    }
    .board-card[draggable="true"] {
      cursor: grab;
    }
    .board-card.dragging {
      opacity: 0.5;
      border: 2px dashed #1976d2;
    }
    .board-cards.drop-target {
      background: #e3f2fd;
      outline: 2px dashed #1976d2;
      outline-offset: -4px;
      border-radius: 6px;
      min-height: 120px;
    }

    /* Compact view */
    .compact-list {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .compact-row {
      background: white;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .compact-summary {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      cursor: pointer;
    }
    .compact-summary:hover {
      background: #fafafa;
    }
    .compact-id {
      color: #1976d2;
      font-weight: bold;
      min-width: 3rem;
    }
    .compact-customer {
      flex: 1;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .compact-count {
      color: #777;
      font-size: 0.8rem;
      white-space: nowrap;
    }
    .compact-total {
      font-weight: bold;
      white-space: nowrap;
    }
    .compact-chevron {
      color: #999;
      font-size: 0.7rem;
    }
    .compact-details {
      border-top: 1px solid #eee;
      padding: 0.5rem 0.75rem;
    }
    .compact-details-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 0.5rem;
    }

    @media (max-width: 900px) {
      .board {
        grid-template-columns: 1fr;
      }
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
    viewMode: 'cards' | 'list' | 'classic' | 'table' | 'board' | 'compact' = 'cards';
    expandedOrderId: number | null = null;
    draggingOrderId: number | null = null;
    dragOverStatus: OrderStatus | null = null;
    boardColumns: { status: OrderStatus; label: string; headerClass: string }[] = [
      { status: 'TO_DO', label: 'Do realizacji', headerClass: 'column-todo' },
      { status: 'IN_PROGRESS', label: 'W trakcie', headerClass: 'column-progress' },
      { status: 'DONE', label: 'Gotowe', headerClass: 'column-done' }
    ];

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.orderService.getAllOrders().subscribe(orders => {
      this.orders = orders;
    });
  }

  setViewMode(mode: 'cards' | 'list' | 'classic' | 'table' | 'board' | 'compact') {
    this.viewMode = mode;
  }

  toggleExpanded(orderId: number) {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  getItemCount(order: Order): number {
    return order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  getOrdersByStatus(status: OrderStatus): Order[] {
    return this.orders.filter(order => order.status === status);
  }

  onDragStart(order: Order, event: DragEvent) {
    this.draggingOrderId = order.id;
    event.dataTransfer?.setData('text/plain', String(order.id));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragEnd() {
    this.draggingOrderId = null;
    this.dragOverStatus = null;
  }

  onDragOver(event: DragEvent, status: OrderStatus) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOverStatus = status;
  }

  onDragLeave(event: DragEvent, status: OrderStatus) {
    const target = event.currentTarget as HTMLElement;
    const related = event.relatedTarget as Node | null;
    if (!related || !target.contains(related)) {
      if (this.dragOverStatus === status) {
        this.dragOverStatus = null;
      }
    }
  }

  onDrop(event: DragEvent, status: OrderStatus) {
    event.preventDefault();
    const rawId = event.dataTransfer?.getData('text/plain');
    const orderId = rawId ? Number(rawId) : this.draggingOrderId;
    this.draggingOrderId = null;
    this.dragOverStatus = null;
    if (orderId === null || Number.isNaN(orderId)) {
      return;
    }
    const order = this.orders.find(o => o.id === orderId);
    if (order && order.status !== status) {
      this.updateStatus(order, status);
    }
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
