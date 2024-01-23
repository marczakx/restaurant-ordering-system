package marczakx.restaurant.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import marczakx.restaurant.model.dto.MenuItemDto;
import marczakx.restaurant.model.entity.*;
import marczakx.restaurant.model.entity.order.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceTests {

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
    assertEquals(0, newOrderItem.getAdditoinOrderItems().size());

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
    assertEquals(2, newOrderItem.getAdditoinOrderItems().size());

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
    return Order.builder().id(1l).orderItems(orderItems).build();
  }

  private Order getCorrectOrderWithAddition_Price30c18() {
    MenuItem meal = MenuItem.builder().id(201L).name("Meal 1").price(10.01f).build();
    Set<AdditionOrderItem> additionOrderItems = Set.of(AdditionOrderItem.builder().price(0.05f).build());
    Set<OrderItem> orderItems = new HashSet<>(Set.of(
      OrderItem.builder().id(101L).menuItem(meal).price(10.01f)
        .additoinOrderItems(additionOrderItems).quantity(3).build()
    ));
    return Order.builder().id(1l).orderItems(orderItems).build();
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
    return Order.builder().id(1l).orderItems(orderItems).build();
  }
}
