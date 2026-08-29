package marczakx.notification.kafka;

import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import marczakx.notification.model.Order;
import marczakx.notification.model.OrderStatus;
import marczakx.notification.service.OrderBroadcastService;

@ExtendWith(MockitoExtension.class)
public class OrderEventConsumerTests {

  @Mock
  OrderBroadcastService orderBroadcastService;

  @InjectMocks
  OrderEventConsumer orderEventConsumer;

  @Test
  void onOrderEvent_OrderReceived_BroadcastToClients() {
    // Given
    Order order = Order.builder().id(7L).customer("Jane").status(OrderStatus.DONE).build();

    // When
    orderEventConsumer.onOrderEvent(order);

    // Then
    verify(orderBroadcastService).broadcastOrder(order);
  }
}