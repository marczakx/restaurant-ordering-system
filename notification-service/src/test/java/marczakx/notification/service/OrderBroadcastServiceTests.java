package marczakx.notification.service;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import marczakx.notification.model.Order;
import marczakx.notification.model.OrderStatus;

@ExtendWith(MockitoExtension.class)
public class OrderBroadcastServiceTests {

  private static final String ORDER_TOPIC = "/order";

  @Mock
  SimpMessagingTemplate simpMessagingTemplate;

  @InjectMocks
  OrderBroadcastService orderBroadcastService;

  @Test
  void broadcastOrder_OrderWithAllFields_BroadcastToOrderTopic() {
    // Given
    Order order = Order.builder().id(42L).customer("John").status(OrderStatus.TO_DO).build();

    // When
    orderBroadcastService.broadcastOrder(order);

    // Then
    verify(simpMessagingTemplate).convertAndSend(eq(ORDER_TOPIC), eq(order));
  }

}
