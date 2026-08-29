package marczakx.restaurant.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import marczakx.restaurant.service.OrderEventPublisher;
import marczakx.restaurant.service.OrderService;
import marczakx.restaurant.model.entity.order.Order;
import marczakx.restaurant.model.entity.order.OrderStatus;

@RestController
@RequestMapping("/api/order")
@RequiredArgsConstructor
public class OrderController {
  
  private final OrderService orderService;
  private final OrderEventPublisher orderEventPublisher;

  @PutMapping
  public Order save(@RequestBody Order order) {
    Order savedOrder = orderService.saveOrder(order);
    orderEventPublisher.publishOrder(savedOrder);
    return savedOrder;
  }

  @GetMapping
  public List<Order> getAll() {
    return orderService.findAll();
  }

  @GetMapping("/{orderId}")
  public Order getById(@PathVariable Long orderId) {
    return orderService.getOrderById(orderId);
  }

  @PutMapping("/{orderId}/status")
  public Order updateStatus(@PathVariable Long orderId, @RequestBody OrderStatus status) {
    Order updatedOrder = orderService.updateStatus(orderId, status);
    orderEventPublisher.publishOrder(updatedOrder);
    return updatedOrder;
  }

  @PutMapping("/{orderId}/items/{itemId}/quantity")
  public Order updateItemQuantity(@PathVariable Long orderId, @PathVariable Long itemId, @RequestParam int quantity) {
    Order updatedOrder = orderService.updateItemQuantity(orderId, itemId, quantity);
    orderEventPublisher.publishOrder(updatedOrder);
    return updatedOrder;
  }

  @DeleteMapping("/{orderId}/items/{itemId}")
  public Order removeItem(@PathVariable Long orderId, @PathVariable Long itemId) {
    Order updatedOrder = orderService.removeItemFromOrder(orderId, itemId);
    orderEventPublisher.publishOrder(updatedOrder);
    return updatedOrder;
  }

}