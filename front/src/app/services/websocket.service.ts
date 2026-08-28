import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { Order } from '../models/models';

/**
 * Service that connects to the backend STOMP/WebSocket endpoint and
 * exposes a stream of order updates.
 *
 * The backend broadcasts the full {@link Order} object to the "/order"
 * topic every time an order is created, updated, or has items changed.
 * This service lets components subscribe to those real-time updates so
 * the UI stays in sync without manual refresh.
 *
 * The backend uses Spring's STOMP message broker, so this service speaks
 * the STOMP protocol directly over a native WebSocket: it sends a CONNECT
 * frame, subscribes to the "/order" destination after the CONNECTED reply,
 * and parses incoming MESSAGE frames into {@link Order} objects.
 */
@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: WebSocket | null = null;
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

    this.socket = new WebSocket(wsUrl);
    this.connected = true;

    this.socket.onopen = () => {
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
      this.connected = false;
      this.socket = null;
    };

    this.socket.onclose = () => {
      this.connected = false;
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
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connected = false;
    this.orderUpdates$.complete();
    this.orderUpdates$ = new Subject<Order>();
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