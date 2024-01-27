package marczakx.restaurant.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import marczakx.restaurant.service.OrderService;
import marczakx.restaurant.model.entity.order.Order;

@RestController
@RequestMapping("/api/order")
@RequiredArgsConstructor
public class OrderController {
  
  private final OrderService orderService;
  
  @PutMapping
  public Order save(@RequestBody Order order) {
    return orderService.saveOrder(order);
  }

  @GetMapping
  public List<Order> getAll() {
    return orderService.findAll();
  }

}
