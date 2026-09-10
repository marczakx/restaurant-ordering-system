import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { WebsocketService } from '../../services/websocket.service';
import { AuthService } from '../../services/auth.service';
import { Order, OrderStatus } from '../../models/models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit, OnDestroy {
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

  private wsSubscription: Subscription | null = null;

  constructor(
    private orderService: OrderService,
    private websocketService: WebsocketService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadOrders();
    this.websocketService.connect();
    this.wsSubscription = this.websocketService.getOrderUpdates().subscribe(order => {
      this.updateOrderInList(order);
    });
  }

  ngOnDestroy() {
    this.wsSubscription?.unsubscribe();
    this.websocketService.disconnect();
  }

  /**
   * Updates the local orders list with a real-time order update received
   * via WebSocket. If the order already exists it is replaced in place;
   * otherwise it is appended to the list. Uses an immutable replacement of
   * the matched element so Angular change detection reliably re-renders the
   * affected card.
   */
  updateOrderInList(order: Order) {
    const index = this.orders.findIndex(o => o.id === order.id);
    if (index !== -1) {
      // Replace with a new array reference so *ngFor detects the change
      // and re-renders the card, even when the order was already in the list.
      this.orders = this.orders.map((o, i) => (i === index ? order : o));
    } else {
      this.orders = [...this.orders, order];
    }
  }

  /**
   * Fetches the orders visible to the logged-in user. Users with the
   * {@code order-viewer} role (e.g. managers) see every order; everyone
   * else only sees the orders placed by themselves. The Keycloak JWT
   * is not validated server-side yet, so the SPA forwards both the
   * role claim ({@code viewer=true}) and the stable Keycloak user id
   * ({@code userId=<sub>}) to the backend, which uses them to scope
   * the response. The {@code sub} claim must be used here (not the
   * username) because orders are persisted with the {@code sub} as
   * their {@code userId} - filtering by username would never match
   * and the list would come back empty.
   */
  loadOrders() {
    const isViewer = this.canViewAllOrders();
    const userId = isViewer ? null : this.authService.getUserId();
    this.orderService.getAllOrders(userId, isViewer).subscribe(orders => {
      this.orders = orders;
    });
  }

  /**
   * Whether the logged-in user is allowed to see every order
   * regardless of who placed it.
   */
  canViewAllOrders(): boolean {
    return this.authService.hasRole('order-viewer');
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

  /**
   * Human-readable payment state label used on the payment badge.
   */
  getPaymentLabel(order: Order): string {
    switch (order.paymentStatus) {
      case 'CONFIRMED': return 'Opłacone BLIK';
      case 'PENDING': return 'Płatność w toku';
      case 'FAILED': return 'Płatność nieudana';
      default: return 'Nieopłacone';
    }
  }

  /**
   * CSS class for the payment badge reflecting the payment state.
   */
  getPaymentClass(order: Order): string {
    switch (order.paymentStatus) {
      case 'CONFIRMED': return 'payment-confirmed';
      case 'PENDING': return 'payment-pending';
      case 'FAILED': return 'payment-failed';
      default: return 'payment-none';
    }
  }

  /**
   * Whether the BLIK payment form should be offered for this order:
   * no confirmed payment yet (never attempted, pending or failed).
   */
  canPayWithBlik(order: Order): boolean {
    return order.paymentStatus !== 'CONFIRMED';
  }

  /**
   * Opens the BLIK code prompt and sends the payment request to the
   * backend. On success the order in the list is replaced with the
   * server response (payment confirmed); on failure the user is
   * notified and the order is refreshed from the server.
   */
  payWithBlik(order: Order) {
    const blikCode = prompt('Podaj 6-cyfrowy kod BLIK:');
    if (blikCode === null) {
      return;
    }
    const code = blikCode.trim();
    if (!/^\d{6}$/.test(code)) {
      alert('Kod BLIK musi mieć dokładnie 6 cyfr.');
      return;
    }
    this.orderService.payWithBlik(order.id, code).subscribe({
      next: (paidOrder) => {
        const index = this.orders.indexOf(order);
        if (index !== -1) {
          this.orders[index] = paidOrder;
        }
        alert('Płatność BLIK zaakceptowana!');
      },
      error: (err) => {
        console.error('BLIK payment failed:', err);
        alert('Płatność BLIK odrzucona.');
        this.loadOrders();
      }
    });
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