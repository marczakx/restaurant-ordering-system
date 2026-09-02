import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { Order } from '../models/models';
import { AuthService } from './auth.service';

/**
 * Service that connects to the notification service STOMP/WebSocket endpoint
 * and exposes a stream of order updates.
 *
 * The backend publishes order events to Kafka. The notification service
 * consumes them and broadcasts the full {@link Order} object to the "/order"
 * STOMP topic. This service lets components subscribe to those real-time
 * updates so the UI stays in sync without manual refresh.
 *
 * The notification service uses Spring's STOMP message broker, so this
 * service speaks the STOMP protocol directly over a native WebSocket: it
 * sends a CONNECT frame, subscribes to the "/order" destination after the
 * CONNECTED reply, and parses incoming MESSAGE frames into {@link Order}
 * objects.
 *
 * Authentication: the WebSocket handshake cannot carry custom HTTP headers
 * from the browser, so the bearer token is appended to the URL as
 * {@code ?access_token=...}. The edge nginx (see front/nginx.conf) reads
 * the query parameter, copies it into the {@code Authorization} header and
 * validates it with the auth-service before proxying the upgrade to the
 * notification-service. Users who logged in via the Google OAuth2 flow
 * (session-based) instead of the Keycloak password flow do not have a
 * token in localStorage; the WebSocket is opened without one and the
 * auth-service will return 401, causing the WebSocket to close.
 */
@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: WebSocket | null = null;
  private orderUpdates$ = new Subject<Order>();
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);

  /**
   * Connects to the STOMP endpoint and subscribes to the "/order" topic.
   * Safe to call multiple times – subsequent calls are no-ops when the
   * underlying WebSocket is already in OPEN/CONNECTING state.
   */
  connect(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    // Don't open a second WebSocket while one is already open or connecting.
    if (this.socket &&
        (this.socket.readyState === WebSocket.OPEN ||
         this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Build WebSocket URL using relative path to ensure it works in Docker Compose
    // and Kubernetes. The bearer token (if any) is passed as ?access_token=
    // because browsers cannot set custom headers on the WebSocket handshake.
    const token = this.authService.getToken();
    const baseUrl = `${window.location.protocol}//${window.location.host}/ws`;
    const wsUrl = token ? `${baseUrl}?access_token=${encodeURIComponent(token)}` : baseUrl;

    try {
      this.socket = new WebSocket(wsUrl);
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      this.socket = null;
      return;
    }

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      // Start the STOMP session. The host header must match the HTTP host
      // the browser used to reach the SPA.
      this.sendFrame('CONNECT', {
        'accept-version': '1.2',
        host: window.location.host
      });
    };

    this.socket.onmessage = (event) => {
      this.handleFrame(event.data);
    };

    this.socket.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    this.socket.onclose = () => {
      console.log('WebSocket closed');
      this.socket = null;
    };
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
   * After calling this, the next {@link #connect()} will create a fresh
   * stream – the existing {@link #getOrderUpdates()} Observable, however,
   * keeps its (now completed) reference, so callers should re-subscribe
   * through a freshly injected service instance.
   */
  disconnect(): void {
    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {
        console.error('Error while closing WebSocket:', e);
      }
      this.socket = null;
    }
  }

  /**
   * Sends a single STOMP frame over the WebSocket.
   *
   * Frame format:
   *   COMMAND
   *   header:value
   *
   *   body\0
   */
  private sendFrame(command: string, headers: Record<string, string>, body?: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    let frame = command + '\n';
    for (const [key, value] of Object.entries(headers)) {
      frame += `${key}:${value}\n`;
    }
    frame += '\n';
    if (body) {
      frame += body;
    }
    frame += '\0';
    this.socket.send(frame);
  }

  /**
   * Parses one or more STOMP frames received from the server. Frames are
   * separated by a null byte; a single WebSocket message may contain
   * several frames.
   */
  private handleFrame(data: any): void {
    const text = typeof data === 'string' ? data : '';
    const frames = text.split('\0');

    for (const frame of frames) {
      if (!frame.trim()) {
        continue;
      }

      const lines = frame.split('\n');
      const command = lines[0].trim();
      const headers: Record<string, string> = {};
      let i = 1;
      while (i < lines.length && lines[i].trim() !== '') {
        const headerLine = lines[i];
        const colonIndex = headerLine.indexOf(':');
        if (colonIndex > 0) {
          headers[headerLine.substring(0, colonIndex).trim()] =
            headerLine.substring(colonIndex + 1).trim();
        }
        i++;
      }

      // The body is everything after the blank line. When the server sends
      // a content-length header, the body is exactly that many characters.
      let body = lines.slice(i + 1).join('\n');
      if (headers['content-length']) {
        const contentLength = parseInt(headers['content-length'], 10);
        body = body.substring(0, contentLength);
      }

      if (command === 'CONNECTED') {
        // The broker accepted the connection – subscribe to the order topic.
        this.sendFrame('SUBSCRIBE', { id: 'sub-0', destination: '/order' });
      } else if (command === 'MESSAGE') {
        try {
          const order = JSON.parse(body) as Order;
          if (order && typeof order === 'object' && order.orderItems !== undefined) {
            this.orderUpdates$.next(order);
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      }
    }
  }
}
