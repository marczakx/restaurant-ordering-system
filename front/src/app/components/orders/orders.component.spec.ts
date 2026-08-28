import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { OrdersComponent } from './orders.component';
import { OrderService } from '../../services/order.service';
import { WebsocketService } from '../../services/websocket.service';
import { Order, OrderItem, OrderStatus } from '../../models/models';

describe('OrdersComponent', () => {
  let component: OrdersComponent;
  let fixture: ComponentFixture<OrdersComponent>;
  let orderServiceSpy: jasmine.SpyObj<OrderService>;
  let websocketServiceSpy: jasmine.SpyObj<WebsocketService>;
  let orderUpdatesSubject: Subject<Order>;

  const mockOrderItem: OrderItem = {
    id: 1,
    menuItem: {
      id: 1,
      name: 'Pizza',
      price: 20,
      additions: [],
      menuItemTypeName: 'Main',
      cuisineIds: [1]
    },
    price: 20,
    quantity: 2,
    additionOrderItems: []
  };

  const mockOrder: Order = {
    id: 1,
    orderItems: [mockOrderItem],
    customer: 'John Doe',
    status: 'TO_DO'
  };

  const mockOrders: Order[] = [mockOrder];

  beforeEach(async () => {
    orderUpdatesSubject = new Subject<Order>();

    orderServiceSpy = jasmine.createSpyObj('OrderService', [
      'getAllOrders',
      'updateItemQuantity',
      'updateStatus',
      'removeItem'
    ]);
    orderServiceSpy.getAllOrders.and.returnValue(of(mockOrders));
    orderServiceSpy.updateItemQuantity.and.returnValue(of(mockOrder));
    orderServiceSpy.updateStatus.and.returnValue(of(mockOrder));
    orderServiceSpy.removeItem.and.returnValue(of(mockOrder));

    websocketServiceSpy = jasmine.createSpyObj('WebsocketService', [
      'connect',
      'disconnect',
      'getOrderUpdates'
    ]);
    websocketServiceSpy.getOrderUpdates.and.returnValue(orderUpdatesSubject.asObservable());

    await TestBed.configureTestingModule({
      imports: [OrdersComponent],
      providers: [
        { provide: OrderService, useValue: orderServiceSpy },
        { provide: WebsocketService, useValue: websocketServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersComponent);
    component = fixture.componentInstance;
    // Reset shared mock state mutated by other tests (e.g. optimistic status update)
    mockOrder.status = 'TO_DO';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load orders on init', () => {
    expect(orderServiceSpy.getAllOrders).toHaveBeenCalled();
    expect(component.orders).toEqual(mockOrders);
  });

  it('should connect to websocket on init', () => {
    expect(websocketServiceSpy.connect).toHaveBeenCalled();
  });

  it('should subscribe to order updates on init', () => {
    expect(websocketServiceSpy.getOrderUpdates).toHaveBeenCalled();
  });

  it('should update existing order when websocket update received', () => {
    const updatedOrder: Order = { ...mockOrder, status: 'IN_PROGRESS' };
    orderUpdatesSubject.next(updatedOrder);
    expect(component.orders[0].status).toBe('IN_PROGRESS');
  });

  it('should add new order when websocket update received for unknown id', () => {
    const newOrder: Order = {
      id: 99,
      orderItems: [],
      customer: 'New Customer',
      status: 'TO_DO'
    };
    orderUpdatesSubject.next(newOrder);
    expect(component.orders.length).toBe(2);
    expect(component.orders.find(o => o.id === 99)).toEqual(newOrder);
  });

  it('should disconnect from websocket on destroy', () => {
    component.ngOnDestroy();
    expect(websocketServiceSpy.disconnect).toHaveBeenCalled();
  });

  it('should set view mode', () => {
    component.setViewMode('list');
    expect(component.viewMode).toBe('list');
    component.setViewMode('table');
    expect(component.viewMode).toBe('table');
    component.setViewMode('board');
    expect(component.viewMode).toBe('board');
    component.setViewMode('compact');
    expect(component.viewMode).toBe('compact');
    component.setViewMode('classic');
    expect(component.viewMode).toBe('classic');
    component.setViewMode('cards');
    expect(component.viewMode).toBe('cards');
  });

  it('should toggle expanded order', () => {
    component.toggleExpanded(1);
    expect(component.expandedOrderId).toBe(1);
    component.toggleExpanded(1);
    expect(component.expandedOrderId).toBeNull();
  });

  it('should calculate item count', () => {
    expect(component.getItemCount(mockOrder)).toBe(2);
  });

  it('should filter orders by status', () => {
    const todoOrders = component.getOrdersByStatus('TO_DO');
    expect(todoOrders.length).toBe(1);
    expect(todoOrders[0].id).toBe(1);

    const doneOrders = component.getOrdersByStatus('DONE');
    expect(doneOrders.length).toBe(0);
  });

  it('should calculate order total', () => {
    expect(component.getOrderTotal(mockOrder)).toBe(40);
  });

  it('should return status label', () => {
    expect(component.getStatusLabel('TO_DO')).toBe('Do realizacji');
    expect(component.getStatusLabel('IN_PROGRESS')).toBe('W trakcie');
    expect(component.getStatusLabel('DONE')).toBe('Gotowe');
  });

  it('should return status class', () => {
    expect(component.getStatusClass('TO_DO')).toBe('status-todo');
    expect(component.getStatusClass('IN_PROGRESS')).toBe('status-progress');
    expect(component.getStatusClass('DONE')).toBe('status-done');
  });

  it('should increase quantity', () => {
    component.increaseQuantity(mockOrder, mockOrderItem);
    expect(orderServiceSpy.updateItemQuantity).toHaveBeenCalledWith(1, 1, 3);
  });

  it('should decrease quantity', () => {
    component.decreaseQuantity(mockOrder, mockOrderItem);
    expect(orderServiceSpy.updateItemQuantity).toHaveBeenCalledWith(1, 1, 1);
  });

  it('should remove item when quantity is 1', () => {
    const singleItemOrder: Order = {
      id: 2,
      orderItems: [{ ...mockOrderItem, quantity: 1 }],
      customer: 'Jane',
      status: 'TO_DO'
    };
    component.removeItem = jasmine.createSpy('removeItem');
    component.decreaseQuantity(singleItemOrder, singleItemOrder.orderItems[0]);
    expect(component.removeItem).toHaveBeenCalledWith(singleItemOrder, singleItemOrder.orderItems[0]);
  });

  it('should remove item', () => {
    component.removeItem(mockOrder, mockOrderItem);
    expect(orderServiceSpy.removeItem).toHaveBeenCalledWith(1, 1);
  });

  it('should update status optimistically', () => {
    component.updateStatus(mockOrder, 'DONE');
    expect(mockOrder.status).toBe('DONE');
    expect(orderServiceSpy.updateStatus).toHaveBeenCalledWith(1, 'DONE');
  });

  it('should handle drag start', () => {
    const event = new DragEvent('dragstart', { dataTransfer: new DataTransfer() });
    component.onDragStart(mockOrder, event);
    expect(component.draggingOrderId).toBe(1);
  });

  it('should handle drag end', () => {
    component.draggingOrderId = 1;
    component.dragOverStatus = 'TO_DO';
    component.onDragEnd();
    expect(component.draggingOrderId).toBeNull();
    expect(component.dragOverStatus).toBeNull();
  });

  it('should handle drag over', () => {
    const event = new DragEvent('dragover', { dataTransfer: new DataTransfer() });
    component.onDragOver(event, 'DONE');
    expect(component.dragOverStatus).toBe('DONE');
  });

  it('should handle drop and update status', () => {
    const event = new DragEvent('drop', { dataTransfer: new DataTransfer() });
    event.dataTransfer?.setData('text/plain', '1');
    component.onDrop(event, 'DONE');
    expect(orderServiceSpy.updateStatus).toHaveBeenCalledWith(1, 'DONE');
  });

  it('should have board columns configured', () => {
    expect(component.boardColumns.length).toBe(3);
    expect(component.boardColumns[0].status).toBe('TO_DO');
    expect(component.boardColumns[1].status).toBe('IN_PROGRESS');
    expect(component.boardColumns[2].status).toBe('DONE');
  });
});
