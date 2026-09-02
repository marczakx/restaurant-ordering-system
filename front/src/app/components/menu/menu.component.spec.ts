import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MenuComponent } from './menu.component';
import { MenuService } from '../../services/menu.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { CuisineDto, MenuItemDto, MenuItemTypeDto, Order, OrderItem, OrderStatus } from '../../models/models';

describe('MenuComponent', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;
  let orderServiceSpy: jasmine.SpyObj<OrderService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

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
      'addMenuItem',
      'updateMenuItem'
    ]);
    orderServiceSpy = jasmine.createSpyObj('OrderService', [
      'saveOrder',
      'getAllOrders',
      'updateItemQuantity',
      'updateStatus',
      'removeItem'
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole', 'getRoles', 'getUsername', 'isLoggedIn', 'getUserId']);
    // By default the user has both menu roles so the existing tests cover
    // the full UI; role-specific behaviour is asserted in dedicated tests.
    authServiceSpy.hasRole.and.returnValue(true);
    authServiceSpy.getUserId.and.returnValue(null);

    menuServiceSpy.getCuisines.and.returnValue(of(mockCuisines));
    menuServiceSpy.getMenuItemTypes.and.returnValue(of(mockMenuTypes));
    menuServiceSpy.getAllMenuItems.and.returnValue(of(mockMenuItems));
    menuServiceSpy.getMenuItems.and.returnValue(of(mockMenuItems));
    orderServiceSpy.saveOrder.and.returnValue(of({} as Order));

    await TestBed.configureTestingModule({
      imports: [MenuComponent],
      providers: [
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: OrderService, useValue: orderServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
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

  it('should allow adding and editing for a user with both menu roles', () => {
    authServiceSpy.hasRole.and.callFake((role: string) =>
      role === 'menu-creator' || role === 'menu-editor');

    expect(component.canAddItems()).toBeTrue();
    expect(component.canEditItems()).toBeTrue();
  });

  it('should deny adding and editing for a user without menu roles', () => {
    authServiceSpy.hasRole.and.returnValue(false);

    expect(component.canAddItems()).toBeFalse();
    expect(component.canEditItems()).toBeFalse();
  });

  it('should hide the add button and edit buttons without the menu roles', () => {
    authServiceSpy.hasRole.and.returnValue(false);
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector('.add-item-bar')).toBeNull();

    const editButtons = compiled.querySelectorAll('button.edit-btn');
    expect(editButtons.length).toBe(0);
  });

  it('should show the add button and edit buttons for a user with the menu roles', () => {
    authServiceSpy.hasRole.and.callFake((role: string) =>
      role === 'menu-creator' || role === 'menu-editor');
    fixture.detectChanges();

    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector('.add-item-bar')).not.toBeNull();
    const editButtons = compiled.querySelectorAll('button.edit-btn');
    expect(editButtons.length).toBeGreaterThan(0);
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

  it('should populate edit fields when starting editing', () => {
    component.startEditing(mockMenuItem);
    expect(component.editingItem).toBe(mockMenuItem);
    expect(component.editName).toBe('Pizza');
    expect(component.editPrice).toBe(20);
    expect(component.editTypeName).toBe('Main');
    expect(component.editCuisineIds).toEqual([1]);
  });

  it('should clear edit state when canceling editing', () => {
    component.startEditing(mockMenuItem);
    component.cancelEditing();
    expect(component.editingItem).toBeNull();
    expect(component.editName).toBe('');
    expect(component.editPrice).toBeNull();
    expect(component.editTypeName).toBe('');
    expect(component.editCuisineIds).toEqual([]);
  });

  it('should toggle cuisine id in edit selection', () => {
    component.startEditing(mockMenuItem);
    component.toggleEditCuisine(2);
    expect(component.editCuisineIds).toEqual([1, 2]);
    component.toggleEditCuisine(2);
    expect(component.editCuisineIds).toEqual([1]);
  });

  it('should update menu item and refresh list entry on save', () => {
    const updatedItem: MenuItemDto = { ...mockMenuItem, name: 'Pizza Updated', price: 25 };
    menuServiceSpy.updateMenuItem.and.returnValue(of(updatedItem));

    component.startEditing(mockMenuItem);
    component.editName = 'Pizza Updated';
    component.editPrice = 25;
    component.saveEditing();

    expect(menuServiceSpy.updateMenuItem).toHaveBeenCalledWith(1, jasmine.objectContaining({
      name: 'Pizza Updated',
      price: 25
    }));
    expect(component.menuItems[0].name).toBe('Pizza Updated');
    expect(component.editingItem).toBeNull();
  });

  it('should not call update service when name is empty', () => {
    component.startEditing(mockMenuItem);
    component.editName = '';
    component.saveEditing();
    expect(menuServiceSpy.updateMenuItem).not.toHaveBeenCalled();
  });

  it('should not call update service when item has no id', () => {
    const noIdItem: MenuItemDto = { ...mockMenuItem, id: null };
    component.startEditing(noIdItem);
    component.editName = 'New Name';
    component.saveEditing();
    expect(menuServiceSpy.updateMenuItem).not.toHaveBeenCalled();
  });

  it('should open add form with empty fields when starting adding', () => {
    component.startAdding();
    expect(component.addingItem).toBeTrue();
    expect(component.newName).toBe('');
    expect(component.newPrice).toBeNull();
    expect(component.newTypeName).toBe('');
    expect(component.newCuisineIds).toEqual([]);
  });

  it('should close edit form when starting adding', () => {
    component.startEditing(mockMenuItem);
    component.startAdding();
    expect(component.editingItem).toBeNull();
    expect(component.addingItem).toBeTrue();
  });

  it('should reset add form state when canceling adding', () => {
    component.startAdding();
    component.newName = 'Some Item';
    component.cancelAdding();
    expect(component.addingItem).toBeFalse();
    expect(component.newName).toBe('');
    expect(component.newPrice).toBeNull();
  });

  it('should toggle cuisine id in new item selection', () => {
    component.startAdding();
    component.toggleNewCuisine(1);
    component.toggleNewCuisine(2);
    expect(component.newCuisineIds).toEqual([1, 2]);
    component.toggleNewCuisine(1);
    expect(component.newCuisineIds).toEqual([2]);
  });

  it('should add menu item and append it to the list on save', () => {
    const createdItem: MenuItemDto = {
      id: 99,
      name: 'Brand New Item',
      price: 15,
      additions: [],
      menuItemTypeName: 'Main',
      cuisineIds: [1]
    };
    menuServiceSpy.addMenuItem.and.returnValue(of(createdItem));

    component.startAdding();
    component.newName = 'Brand New Item';
    component.newPrice = 15;
    component.newTypeName = 'Main';
    component.newCuisineIds = [1];
    component.saveNewItem();

    expect(menuServiceSpy.addMenuItem).toHaveBeenCalledWith(jasmine.objectContaining({
      name: 'Brand New Item',
      price: 15,
      menuItemTypeName: 'Main',
      cuisineIds: [1]
    }));
    expect(component.menuItems.length).toBe(2);
    expect(component.menuItems[1].id).toBe(99);
    expect(component.addingItem).toBeFalse();
  });

  it('should not call add service when name is empty', () => {
    component.startAdding();
    component.newName = '';
    component.newPrice = 10;
    component.saveNewItem();
    expect(menuServiceSpy.addMenuItem).not.toHaveBeenCalled();
  });

  it('should not call add service when price is missing', () => {
    component.startAdding();
    component.newName = 'Some Item';
    component.newPrice = null;
    component.saveNewItem();
    expect(menuServiceSpy.addMenuItem).not.toHaveBeenCalled();
  });
});