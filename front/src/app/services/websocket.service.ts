import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Order } from '../models/models';

/**
 * Service that connects to the backend STOMP/WebSocket endpoint and
 * exposes a stream of order updates.
 *
 * The backend broadcasts the full {@link Order} object to the "/order"
 * topic every time an order is created, updated, or has items changed.
 * This service lets components subscribe to those real-time updates so
 * the UI stays in sync without manual refresh.
 */
@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: WebSocketSubject<any> | null = null;
  private orderUpdates$ = new Subject<Order>();
  private connected = false;
  private platformId = inject(PLATFORM_ID);

  /**
   * Connects to the STOMP endpoint and subscribes to the "/order" topic.
   * Safe to call multiple times – subsequent calls are no-ops when already
   * connected.
   */
  connect(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.connected) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    this.socket = webSocket(wsUrl);
    this.connected = true;

    this.socket.subscribe({
      next: (message: any) => {
        // STOMP messages arrive as JSON strings. The backend sends the
        // full Order object on the "/order" destination.
        if (message && typeof message === 'object' && message.orderItems !== undefined) {
          this.orderUpdates$.next(message as Order);
        }
      },
      error: (err) => {
        console.error('WebSocket error:', err);
        this.connected = false;
        this.socket = null;
      },
      complete: () => {
        this.connected = false;
        this.socket = null;
      }
    });
  }

  /**
   * Returns an Observable that emits every order update received from
   * the backend via WebSocket.
   */
  getOrderUpdates(): Observable<Order> {
    return this.orderUpdates$.asObservable();
  }

  /**
   * Disconnects from the WebSocket and completes the order update stream.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.complete();
      this.socket = null;
    }
    this.connected = false;
    this.orderUpdates$.complete();
    this.orderUpdates$ = new Subject<Order>();
  }
}
