package marczakx.restaurant.service;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
      .additionOrderItems(mapper(additions))
      .price(item.price())
      .quantity(1)
      .build());
    return order;
  }

  /**
   * Returns all orders in the system. Kept for callers that already know
   * they have the {@code order-viewer} privilege (e.g. background jobs or
   * tests). Web endpoints should use
   * {@link #findAll(boolean, String)} instead so the result is scoped to
   * the caller's own orders when they lack the privilege.
   */
  public List<Order> findAll() {
    return orderRepository.findAll();
  }

  /**
   * Returns the list of orders the caller is allowed to see.
   *
   * <p>Users with the {@code order-viewer} privilege (e.g. managers) get
   * the full list. Everyone else only sees the orders they placed
   * themselves (matched by the {@code customer} field against the
   * supplied {@code username}). When the caller is anonymous
   * ({@code username} is {@code null} or blank) and they cannot see all
   * orders, the result is empty rather than leaking every order in the
   * system.
   *
   * @param canViewAllOrders {@code true} when the caller holds the
   *                          {@code order-viewer} role.
   * @param username         the authenticated principal name, used to
   *                          scope the result when {@code canViewAllOrders}
   *                          is {@code false}.
   */
  public List<Order> findAll(boolean canViewAllOrders, String username) {
    if (canViewAllOrders) {
      return orderRepository.findAll();
    }
    if (username == null || username.isBlank()) {
      return List.of();
    }
    return orderRepository.findByCustomer(username);
  }

  @Transactional
  public Order saveOrder(Order order) {
    // Frontend sends id=0 for new entities - clear IDs so JPA generates them
    if (order.getId() != null && order.getId() == 0L) {
      order.setId(null);
    }
    if (order.getOrderItems() != null) {
      order.getOrderItems().forEach(item -> {
        if (item.getId() != null && item.getId() == 0L) {
          item.setId(null);
        }
        if (item.getAdditionOrderItems() != null) {
          item.getAdditionOrderItems().forEach(add -> {
            if (add.getId() != null && add.getId() == 0L) {
              add.setId(null);
            }
          });
        }
      });
    }
    return orderRepository.save(order);
  }

  public Order getOrderById(Long id) {
    return orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Order not found: " + id));
  }

  @Transactional
  public Order updateItemQuantity(Long orderId, Long itemId, int quantity) {
    Order order = getOrderById(orderId);
    OrderItem item = order.getOrderItems()
      .stream()
      .filter(oi -> oi.getId().equals(itemId))
      .findFirst()
      .orElseThrow(() -> new RuntimeException("Order item not found: " + itemId));
    if (quantity <= 0) {
      order.getOrderItems().remove(item);
      orderRepositoryItem.delete(item);
    } else {
      item.setQuantity(quantity);
      orderRepositoryItem.save(item);
    }
    return orderRepository.save(order);
  }

  @Transactional
  public Order updateStatus(Long orderId, OrderStatus status) {
    Order order = getOrderById(orderId);
    order.setStatus(status);
    return orderRepository.save(order);
  }

  @Transactional
  public Order removeItemFromOrder(Long orderId, Long itemId) {
    Order order = getOrderById(orderId);
    OrderItem item = order.getOrderItems()
      .stream()
      .filter(oi -> oi.getId().equals(itemId))
      .findFirst()
      .orElseThrow(() -> new RuntimeException("Order item not found: " + itemId));
    order.getOrderItems().remove(item);
    orderRepositoryItem.delete(item);
    return orderRepository.save(order);
  }

  public Float calculateTotalPrice(Order order) {
    return order.getOrderItems()
      .stream()
      .map(this::calculateItemPrice)
      .reduce(Float.valueOf(0.0f), (e1, e2) -> e1 + e2);
    }

  public Float calculateItemPrice(OrderItem orderItem) {
    return orderItem.getQuantity() * (orderItem.getPrice() + calculatePriceAdditions(orderItem));
  }

  private Float calculatePriceAdditions(OrderItem orderItem) {
    if(orderItem.getAdditionOrderItems() == null) {
      return 0.0f;
    }
    return orderItem.getAdditionOrderItems()
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
    return AdditionOrderItem.builder().addition(addition).price(addition.getPrice()).build();
  }

}
