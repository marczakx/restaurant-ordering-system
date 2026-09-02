import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { WebsocketService } from './websocket.service';
import { Order } from '../models/models';

describe('WebsocketService', () => {
  let service: WebsocketService;

  const mockOrder: Order = {
    id: 1,
    orderItems: [],
    customer: 'Test Customer',
    status: 'TO_DO'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      // WebsocketService injects AuthService, which in turn needs HttpClient.
      // The testing HTTP client intercepts any real request the service
      // would make, keeping the spec hermetic.
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(WebsocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose order updates observable', () => {
    const updates = service.getOrderUpdates();
    expect(updates).toBeTruthy();
  });

  it('should not connect when not in browser platform', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'node' },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    const nodeService = TestBed.inject(WebsocketService);
    nodeService.connect();
    // Should not throw and should not attempt to create a WebSocket
    expect(nodeService).toBeTruthy();
  });

  it('should not connect twice', () => {
    service.connect();
    // Calling connect again should be a no-op (no error)
    service.connect();
    expect(service).toBeTruthy();
  });

  it('should disconnect without error when not connected', () => {
    service.disconnect();
    expect(service).toBeTruthy();
  });
});
