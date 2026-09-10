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
   * Fetches the orders visible to the caller. Users with the
   * {@code order-viewer} role receive every order; everyone else only
   * sees their own. The Keycloak JWT is not validated server-side
   * yet (see SecurityConfig), so the SPA forwards the role claim
   * ({@code viewer=true}) and the user's stable id ({@code userId=<sub>})
   * explicitly to the backend.
   */
  getAllOrders(userId: string | null, isViewer: boolean): Observable<Order[]> {
    let params = new HttpParams();
    if (userId) {
      params = params.set('userId', userId);
    }
    if (isViewer) {
      params = params.set('viewer', 'true');
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

  /**
   * Pays the given order with BLIK using the 6-digit code from the
   * customer's banking app. The backend runs a simulated payment
   * provider: every well-formed code is accepted except "000000".
   * Returns the order with the resulting payment status.
   */
  payWithBlik(orderId: number, blikCode: string): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/${orderId}/payment/blik`, {
      blikCode: blikCode
    });
  }
}
