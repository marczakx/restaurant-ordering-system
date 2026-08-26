import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MenuComponent } from './menu.component';
import { MenuService } from '../../services/menu.service';
import { OrderService } from '../../services/order.service';
import { CuisineDto, MenuItemDto, MenuItemTypeDto, Order, OrderItem, OrderStatus } from '../../models/models';

describe('MenuComponent', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;
  let orderServiceSpy: jasmine.SpyObj<OrderService>;

  const mockCuisines: CuisineDto[] = [
    { id: 1, name: 'Italian' },
    { id: 2, name: 'Mexican' }
  ];

  const mockMenuTypes: MenuItemTypeDto[] = [
    { id: 1, name: 'Main' },
    { id: 2, name: 'Dessert' }
  ];

  const mockMenuItem: MenuItemDto = {
    id: 1,
    name: 'Pizza',
    price: 20,
    additions: [],
    menuItemTypeName: 'Main',
    cuisineIds: [1]
  };

  const mockMenuItems: MenuItemDto[] = [mockMenuItem];

  const mockOrderItem: OrderItem = {
    id: 0,
    menuItem: mockMenuItem,
    price: 20,
    quantity: 1,
    additionOrderItems: []
  };

  beforeEach(async () => {
    menuServiceSpy = jasmine.createSpyObj('MenuService', [
      'getCuisines',
      'getMenuItemTypes',
      'getMenuItems',
      'getAllMenuItems',
      'addMenuItem'
    ]);
    orderServiceSpy = jasmine.createSpyObj('OrderService', [
      'saveOrder',
      'getAllOrders',
      'updateItemQuantity',
      'updateStatus',
      'removeItem'
    ]);

    menuServiceSpy.getCuisines.and.returnValue(of(mockCuisines));
    menuServiceSpy.getMenuItemTypes.and.returnValue(of(mockMenuTypes));
    menuServiceSpy.getAllMenuItems.and.returnValue(of(mockMenuItems));
    menuServiceSpy.getMenuItems.and.returnValue(of(mockMenuItems));
    orderServiceSpy.saveOrder.and.returnValue(of({} as Order));

    await TestBed.configureTestingModule({
      imports: [MenuComponent],
      providers: [
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: OrderService, useValue: orderServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load cuisines, types, and menu items on init', () => {
    expect(menuServiceSpy.getCuisines).toHaveBeenCalled();
    expect(menuServiceSpy.getMenuItemTypes).toHaveBeenCalled();
    expect(menuServiceSpy.getAllMenuItems).toHaveBeenCalled();
    expect(component.cuisines).toEqual(mockCuisines);
    expect(component.menuTypes).toEqual(mockMenuTypes);
    expect(component.menuItems).toEqual(mockMenuItems);
  });

  it('should set view mode', () => {
    component.setViewMode('list');
    expect(component.viewMode).toBe('list');
    component.setViewMode('classic');
    expect(component.viewMode).toBe('classic');
    component.setViewMode('cards');
    expect(component.viewMode).toBe('cards');
  });

  it('should set order status', () => {
    component.setStatus('IN_PROGRESS');
    expect(component.orderStatus).toBe('IN_PROGRESS');
    component.setStatus('DONE');
    expect(component.orderStatus).toBe('DONE');
    component.setStatus('TO_DO');
    expect(component.orderStatus).toBe('TO_DO');
  });

  it('should add new item to order', () => {
    component.addToOrder(mockMenuItem);
    expect(component.orderItems.length).toBe(1);
    expect(component.orderItems[0].menuItem.id).toBe(1);
    expect(component.orderItems[0].quantity).toBe(1);
  });

  it('should increment quantity when adding existing item', () => {
    component.addToOrder(mockMenuItem);
    component.addToOrder(mockMenuItem);
    expect(component.orderItems.length).toBe(1);
    expect(component.orderItems[0].quantity).toBe(2);
  });

  it('should remove item from order', () => {
    component.addToOrder(mockMenuItem);
    component.removeFromOrder(0);
    expect(component.orderItems.length).toBe(0);
  });

  it('should calculate total', () => {
    component.addToOrder(mockMenuItem);
    component.addToOrder(mockMenuItem);
    expect(component.getTotal()).toBe(40);
  });

  it('should submit order and clear items', () => {
    component.customerName = 'John';
    component.addToOrder(mockMenuItem);
    component.submitOrder();
    expect(orderServiceSpy.saveOrder).toHaveBeenCalled();
    expect(component.orderItems.length).toBe(0);
    expect(component.customerName).toBe('');
  });

  it('should not submit order without customer name', () => {
    component.customerName = '';
    component.addToOrder(mockMenuItem);
    component.submitOrder();
    expect(orderServiceSpy.saveOrder).not.toHaveBeenCalled();
  });

  it('should not submit order without items', () => {
    component.customerName = 'John';
    component.submitOrder();
    expect(orderServiceSpy.saveOrder).not.toHaveBeenCalled();
  });

  it('should reload menu items on type change', () => {
    component.selectedType = 'Main';
    component.onTypeChange();
    expect(menuServiceSpy.getMenuItems).toHaveBeenCalledWith('Main', undefined);
  });

  it('should reload menu items on cuisine change', () => {
    component.selectedCuisine = 1;
    component.onCuisineChange();
    expect(menuServiceSpy.getAllMenuItems).toHaveBeenCalledWith(1);
  });
});