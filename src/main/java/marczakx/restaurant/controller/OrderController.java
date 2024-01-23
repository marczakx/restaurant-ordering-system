package marczakx.restaurant.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import marczakx.restaurant.service.OrderService;
import marczakx.restaurant.model.entity.order.Order;

@RestController("order")
@RequiredArgsConstructor
public class OrderController {
  
  private final OrderService orderService;
  
  @PostMapping("name")
  public void add(Order order) {//TODO OrderDto
    orderService.add(order);
  }

}
