package marczakx.restaurant.service;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import marczakx.restaurant.model.entity.order.Order;
import marczakx.restaurant.model.entity.order.OrderStatus;

@ExtendWith(MockitoExtension.class)
public class OrderEventPublisherTests {

  private static final String ORDER_EVENTS_TOPIC = "order-events";

  @Mock
  KafkaTemplate<String, Order> kafkaTemplate;

  @InjectMocks
  OrderEventPublisher orderEventPublisher;

  @BeforeEach
  void setUp() {
    // @Value is not resolved by Mockito; set the topic explicitly.
    ReflectionTestUtils.setField(orderEventPublisher, "orderEventsTopic", ORDER_EVENTS_TOPIC);
  }

  @Test
  void publishOrder_OrderWithId_SendsEventToKafkaTopic() {
    // Given
    Order order = Order.builder().id(42L).customer("John").status(OrderStatus.TO_DO).build();

    // When
    orderEventPublisher.publishOrder(order);

    // Then
    verify(kafkaTemplate).send(eq(ORDER_EVENTS_TOPIC), eq("42"), eq(order));
  }

  @Test
  void publishOrder_OrderWithoutId_SendsEventWithoutKey() {
    // Given
    Order order = Order.builder().customer("Anna").status(OrderStatus.IN_PROGRESS).build();

    // When
    orderEventPublisher.publishOrder(order);

    // Then
    verify(kafkaTemplate).send(eq(ORDER_EVENTS_TOPIC), eq((String) null), eq(order));
  }
}