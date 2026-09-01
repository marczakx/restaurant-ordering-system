import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, OrderStatus } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = '/api/order';

  constructor(private http: HttpClient) {}

  saveOrder(order: Order): Observable<Order> {
    return this.http.put<Order>(this.apiUrl, order);
  }

  /**
   * Fetches the orders visible to the caller. Users without the
   * {@code order-viewer} role only see their own orders, so the
   * {@code customer} query parameter is sent as the current user's name
   * (or email) and the backend matches it against the order's
   * {@code customer} field. Managers / order viewers pass {@code null}
   * to ask for the full list.
   */
  getAllOrders(customer: string | null): Observable<Order[]> {
    let params = new HttpParams();
    if (customer) {
      params = params.set('customer', customer);
    }
    return this.http.get<Order[]>(this.apiUrl, { params });
  }

  updateItemQuantity(orderId: number, itemId: number, quantity: number): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/${orderId}/items/${itemId}/quantity?quantity=${quantity}`, null);
  }

  updateStatus(orderId: number, status: OrderStatus): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/${orderId}/status`, JSON.stringify(status), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  removeItem(orderId: number, itemId: number): Observable<Order> {
    return this.http.delete<Order>(`${this.apiUrl}/${orderId}/items/${itemId}`);
  }
}