package marczakx.restaurant.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.*;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import marczakx.restaurant.model.dto.MenuItemDto;
import marczakx.restaurant.model.entity.*;
import marczakx.restaurant.model.entity.order.*;
import marczakx.restaurant.repository.order.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceTests {

  @Mock
  OrderRepository orderRepository;

  @Mock
  OrderItemRepository orderRepositoryItem;

  @Mock
  AdditionOrderItemRepository additionOrderItemRepository;

  @InjectMocks
  OrderService orderService;

  @Test
  void calculateTotalPrice_CorrectOrder_Price183c38() {

    // Given
    Order order = getCorrectOrderWithTotalPrice183c38();

    // When
    var totalPrice = orderService.calculateTotalPrice(order);

    // Then
    assertEquals(Float.valueOf(183.38f), totalPrice, 0.005f);

  }

  @Test
  void calculateTotalPrice_CorrectOrderWithAddtion_Price30c18() {

    // Given
    Order order = getCorrectOrderWithAddition_Price30c18();

    // When
    var totalPrice = orderService.calculateTotalPrice(order);

    // Then
    assertEquals(Float.valueOf(30.18f), totalPrice, 0.005f);

  }

  @Test
  void calculateTotalPrice_OrderWithNotSetAllPrice_ExceptionThrown() {

    // Given
    Order order = getOrderWithUnsetPrice();

    // When
    // Then
    assertThrows(NullPointerException.class, () -> orderService.calculateTotalPrice(order));

  }

  @Test
  void calculateTotalPrice_OrderIsNullpointer__ExceptionThrown() {

    // Given
    Order order = null;

    // When
    // Then
    assertThrows(NullPointerException.class, () -> orderService.calculateTotalPrice(order));

  }

  @Test
  void updateStatus_ChangeToInProgress_StatusUpdated() {
    // Given
    Order order = getCorrectOrderWithTotalPrice183c38();
    when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
    when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));

    // When
    Order updatedOrder = orderService.updateStatus(order.getId(), OrderStatus.IN_PROGRESS);

    // Then
    assertEquals(OrderStatus.IN_PROGRESS, updatedOrder.getStatus());
  }

  @Test
  void updateStatus_ChangeToDone_StatusUpdated() {
    // Given
    Order order = getCorrectOrderWithTotalPrice183c38();
    when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
    when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));

    // When
    Order updatedOrder = orderService.updateStatus(order.getId(), OrderStatus.DONE);

    // Then
    assertEquals(OrderStatus.DONE, updatedOrder.getStatus());
  }

  @Test
  void addItemToOrder_NewMenuItemWithoutAddition_CorrectlyAdded() {

    // Given
    Order order = getCorrectOrderWithTotalPrice183c38();
    MenuItemDto newMenuItem = MenuItemDto.builder().id(301l).name("New meal").price(33.05f).build();

    // When
    Order actualOrder = orderService.addItemToOrder(order, newMenuItem, null);
    OrderItem newOrderItem = actualOrder
      .getOrderItems()
      .stream()
      .filter(e -> e.getMenuItem().getId().equals(newMenuItem.id()))
      .findAny()
      .orElseThrow();

    // Then
    assertEquals(5, actualOrder.getOrderItems().size());
    assertEquals(33.05f, newOrderItem.getPrice(), 0.005f);
    assertEquals("New meal", newOrderItem.getMenuItem().getName());
    assertEquals(1, newOrderItem.getQuantity());
    assertEquals(0, newOrderItem.getAdditionOrderItems().size());

  }

  @Test
  void updateItemQuantity_IncreaseQuantity_QuantityUpdated() {
    // Given
    Order order = getCorrectOrderWithTotalPrice183c38();
    OrderItem itemToUpdate = order.getOrderItems().stream().findFirst().orElseThrow();
    int originalQuantity = itemToUpdate.getQuantity();
    int newQuantity = originalQuantity + 2;
    when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
    when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));

    // When
    Order updatedOrder = orderService.updateItemQuantity(order.getId(), itemToUpdate.getId(), newQuantity);
    OrderItem updatedItem = updatedOrder.getOrderItems().stream()
      .filter(oi -> oi.getId().equals(itemToUpdate.getId()))
      .findFirst()
      .orElseThrow();

    // Then
    assertEquals(newQuantity, updatedItem.getQuantity());
    assertEquals(4, updatedOrder.getOrderItems().size());
  }

  @Test
  void updateItemQuantity_SetToZero_ItemRemoved() {
    // Given
    Order order = getCorrectOrderWithTotalPrice183c38();
    OrderItem itemToRemove = order.getOrderItems().stream().findFirst().orElseThrow();
    when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
    when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));

    // When
    Order updatedOrder = orderService.updateItemQuantity(order.getId(), itemToRemove.getId(), 0);

    // Then
    assertEquals(3, updatedOrder.getOrderItems().size());
  }

  @Test
  void removeItemFromOrder_ExistingItem_ItemRemoved() {
    // Given
    Order order = getCorrectOrderWithTotalPrice183c38();
    OrderItem itemToRemove = order.getOrderItems().stream().findFirst().orElseThrow();
    when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
    when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));

    // When
    Order updatedOrder = orderService.removeItemFromOrder(order.getId(), itemToRemove.getId());

    // Then
    assertEquals(3, updatedOrder.getOrderItems().size());
  }

  @Test
  void addItemToOrder_NewMenuItemAndAdditions_CorrectlyAdded() {

    // Given
    Order givenOrder = getCorrectOrderWithTotalPrice183c38();
    MenuItemDto newMenuItem = MenuItemDto.builder().id(301l).name("New meal").price(33.05f).build();
    Set<Addition> additions = Set.of(Addition.builder().build(), Addition.builder().build());

    // When
    Order actualOrder = orderService.addItemToOrder(givenOrder, newMenuItem, additions);
    OrderItem newOrderItem = actualOrder
      .getOrderItems()
      .stream()
      .filter(e -> e.getMenuItem().getId().equals(newMenuItem.id()))
      .findAny()
      .orElseThrow();

    // Then
    assertEquals(5, actualOrder.getOrderItems().size());
    assertEquals(33.05f, newOrderItem.getPrice(), 0.005f);
    assertEquals("New meal", newOrderItem.getMenuItem().getName());
    assertEquals(1, newOrderItem.getQuantity());
    assertEquals(2, newOrderItem.getAdditionOrderItems().size());

  }

  @Test
  void findAll_WithOrderViewerRole_ReturnsEveryOrder() {
    // Given
    Order order1 = getCorrectOrderWithTotalPrice183c38();
    Order order2 = getCorrectOrderWithAddition_Price30c18();
    when(orderRepository.findAll()).thenReturn(List.of(order1, order2));

    // When
    List<Order> result = orderService.findAll(true, "manager-sub");

    // Then - the viewer role short-circuits to findAll(), no per-user lookup
    assertEquals(2, result.size());
    verify(orderRepository).findAll();
    verify(orderRepository, never()).findByUserId(any());
  }

  @Test
  void findAll_WithOrderViewerRole_IgnoresUserId() {
    // Given
    when(orderRepository.findAll()).thenReturn(List.of(getCorrectOrderWithTotalPrice183c38()));

    // When - even with a blank user id the viewer still sees everything
    orderService.findAll(true, null);

    // Then
    verify(orderRepository).findAll();
    verify(orderRepository, never()).findByUserId(any());
  }

  @Test
  void findAll_WithoutOrderViewerRole_ReturnsOnlyCallerOrders() {
    // Given
    Order ownOrder = Order.builder().id(1L).customer("alice").userId("alice-sub").build();
    when(orderRepository.findByUserId("alice-sub")).thenReturn(List.of(ownOrder));

    // When
    List<Order> result = orderService.findAll(false, "alice-sub");

    // Then - non-viewers are scoped to their own orders via the stable user id
    assertEquals(1, result.size());
    assertEquals(ownOrder, result.get(0));
    verify(orderRepository).findByUserId("alice-sub");
    verify(orderRepository, never()).findAll();
  }

  @Test
  void findAll_WithoutOrderViewerRole_NoUserId_ReturnsEmptyList() {
    // Given - anonymous caller that cannot view all orders

    // When
    List<Order> result = orderService.findAll(false, null);

    // Then - nothing is leaked to anonymous callers
    assertTrue(result.isEmpty());
    verify(orderRepository, never()).findAll();
    verify(orderRepository, never()).findByUserId(any());
  }

  @Test
  void findAll_WithoutOrderViewerRole_BlankUserId_ReturnsEmptyList() {
    // When / Then
    assertTrue(orderService.findAll(false, "").isEmpty());
    assertTrue(orderService.findAll(false, "   ").isEmpty());
    verify(orderRepository, never()).findByUserId(any());
  }

  private Order getCorrectOrderWithTotalPrice183c38() {
    MenuItem meal1 = MenuItem.builder().id(201L).name("Meal 1").price(10.01f).build();
    MenuItem meal2 = MenuItem.builder().id(202L).name("Meal 2").price(10.02f).build();
    MenuItem meal3 = MenuItem.builder().id(203L).name("Meal 3").price(30f).build();
    MenuItem meal4 = MenuItem.builder().id(203L).name("Meal 4").build();
    Set<OrderItem> orderItems = new HashSet<>(Set.of(
      OrderItem.builder().id(101L).menuItem(meal1).price(10.01f).quantity(1).build(),
      OrderItem.builder().id(102L).menuItem(meal2).price(10.02f).quantity(1).build(),
      OrderItem.builder().id(103L).menuItem(meal3).price(32f).quantity(4).build(),
      OrderItem.builder().id(104L).menuItem(meal4).price(35.35f).quantity(1).build()
    ));
    return Order.builder().id(1l).orderItems(orderItems).status(OrderStatus.TO_DO).build();
  }

  private Order getCorrectOrderWithAddition_Price30c18() {
    MenuItem meal = MenuItem.builder().id(201L).name("Meal 1").price(10.01f).build();
    Set<AdditionOrderItem> additionOrderItems = Set.of(AdditionOrderItem.builder().price(0.05f).build());
    Set<OrderItem> orderItems = new HashSet<>(Set.of(
      OrderItem.builder().id(101L).menuItem(meal).price(10.01f)
        .additionOrderItems(additionOrderItems).quantity(3).build()
    ));
    return Order.builder().id(1l).orderItems(orderItems).status(OrderStatus.TO_DO).build();
  }

  private Order getOrderWithUnsetPrice() {
    MenuItem meal1 = MenuItem.builder().id(201L).name("Meal 1").price(10.01f).build();
    MenuItem meal2 = MenuItem.builder().id(202L).name("Meal 2").price(10.02f).build();
    MenuItem meal3 = MenuItem.builder().id(203L).name("Meal 3").price(30f).build();
    MenuItem meal4 = MenuItem.builder().id(203L).name("Meal 4").build();
    Set<OrderItem> orderItems = Set.of(
      OrderItem.builder().id(101L).menuItem(meal1).price(10.01f).quantity(1).build(),
      OrderItem.builder().id(102L).menuItem(meal2).quantity(1).build(),
      OrderItem.builder().id(103L).menuItem(meal3).price(32f).quantity(4).build(),
      OrderItem.builder().id(104L).menuItem(meal4).price(35.35f).quantity(1).build()
    );
    return Order.builder().id(1l).orderItems(orderItems).status(OrderStatus.TO_DO).build();
  }
}