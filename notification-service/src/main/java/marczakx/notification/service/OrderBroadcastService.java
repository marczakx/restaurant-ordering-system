package marczakx.notification.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import marczakx.notification.model.Order;

/**
 * Broadcasts order updates to WebSocket clients subscribed to the "/order"
 * topic. This is the intermediary between Kafka (backend events) and the
 * frontend (WebSocket).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderBroadcastService {

  private static final String ORDER_TOPIC = "/order";

  private final SimpMessagingTemplate simpMessagingTemplate;

  public void broadcastOrder(Order order) {
    simpMessagingTemplate.convertAndSend(ORDER_TOPIC, order);
    log.info("Broadcast order id={}, status={} to WebSocket topic '{}'",
        order.getId(), order.getStatus(), ORDER_TOPIC);
  }
}