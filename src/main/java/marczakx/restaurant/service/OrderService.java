package marczakx.restaurant.service;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import marczakx.restaurant.model.dto.MenuItemDto;
import marczakx.restaurant.model.entity.*;
import marczakx.restaurant.model.entity.order.*;
import marczakx.restaurant.repository.order.*;

@Service
@RequiredArgsConstructor
public class OrderService {
  private final OrderRepository orderRepository;
  private final OrderItemRepository orderRepositoryItem;
  private final AdditionOrderItemRepository additionOrderItemRepository;

  public Order addItemToOrder(Order order, MenuItemDto item, Set<Addition> additions) {
    order.getOrderItems().add(OrderItem
      .builder()
      .menuItem(MenuItem.builder().id(item.id()).name(item.name()).build())
      .additoinOrderItems(mapper(additions))
      .price(item.price())
      .quantity(1)
      .build());
    return order;
  }

  public List<Order> findAll() {
    return orderRepository.findAll();
  }

  public Order saveOrder(Order order) {
    order.getOrderItems().forEach(e -> additionOrderItemRepository.saveAll(e.getAdditoinOrderItems()));
      orderRepositoryItem.saveAll(order.getOrderItems());
      return orderRepository.save(order);
    }

  public Float calculateTotalPrice(Order order) {
    return order.getOrderItems()
      .stream()
      .map(this::calculateItemPrice)
      .reduce(Float.valueOf(0.0f), (e1, e2) -> e1 + e2);
    }

  public Float calculateItemPrice(OrderItem orderItem) {
    return orderItem.getQuantity() * (orderItem.getPrice() + calculatePriceAdditoins(orderItem));
  }

  private Float calculatePriceAdditoins(OrderItem orderItem) {
    if(orderItem.getAdditoinOrderItems() == null) {
      return 0.0f;
    }
    return orderItem.getAdditoinOrderItems()
      .stream()
      .map(e -> e.getPrice())
      .reduce(Float.valueOf(0.0f), (e1, e2) -> e1 + e2);
  }

  private Set<AdditionOrderItem> mapper(Set<Addition> additions) {
    if(additions == null) {
	  return new HashSet<>();
    }
    return additions.stream().map(e -> mapper(e)).collect(Collectors.toSet());
  }

  private AdditionOrderItem mapper(Addition addition) {
    return AdditionOrderItem.builder().additoin(addition).price(addition.getPrice()).build();
  }

}
