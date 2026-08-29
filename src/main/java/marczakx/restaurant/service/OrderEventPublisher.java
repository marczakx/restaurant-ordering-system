package marczakx.restaurant.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import marczakx.restaurant.model.entity.order.Order;

/**
 * Publishes order events to Kafka. The notification service consumes these
 * events and broadcasts them to the frontend over WebSocket.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderEventPublisher {

  private final KafkaTemplate<String, Order> kafkaTemplate;

  @Value("${spring.kafka.topic.order-events:order-events}")
  private String orderEventsTopic;

  public void publishOrder(Order order) {
    String key = order.getId() != null ? String.valueOf(order.getId()) : null;
    kafkaTemplate.send(orderEventsTopic, key, order);
    log.info("Published order event to Kafka topic '{}' for order id={}, status={}",
        orderEventsTopic, order.getId(), order.getStatus());
  }
}