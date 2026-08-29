package marczakx.notification.kafka;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import marczakx.notification.model.Order;
import marczakx.notification.service.OrderBroadcastService;

/**
 * Consumes order events from the "order-events" Kafka topic (published by
 * the backend) and broadcasts them to connected WebSocket clients through
 * {@link OrderBroadcastService}.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventConsumer {

  private final OrderBroadcastService orderBroadcastService;

  @KafkaListener(topics = "${spring.kafka.topic.order-events:order-events}")
  public void onOrderEvent(Order order) {
    log.info("Received order event from Kafka: id={}, status={}, customer={}",
        order.getId(), order.getStatus(), order.getCustomer());
    orderBroadcastService.broadcastOrder(order);
  }
}