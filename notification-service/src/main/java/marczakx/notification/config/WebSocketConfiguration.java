package marczakx.notification.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket (STOMP) configuration. The frontend connects to the "/ws"
 * endpoint and subscribes to the "/order" topic. Order events consumed
 * from Kafka are broadcast to that topic.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfiguration implements WebSocketMessageBrokerConfigurer {

  @Override
  public void registerStompEndpoints(StompEndpointRegistry stompEndpointRegistry) {
    stompEndpointRegistry.addEndpoint("ws")
        // Accept the WebSocket handshake from any origin. The SPA is reached
        // through different hosts depending on the environment (localhost:8082
        // in dev, http://frontend:80 inside Docker Compose, the ingress host in
        // Kubernetes), so a fixed allow-list would break the real-time updates.
        .setAllowedOriginPatterns("*");
  }

  @Override
  public void configureMessageBroker(MessageBrokerRegistry registry) {
    registry.enableSimpleBroker("/order");
    registry.setApplicationDestinationPrefixes("/app");
  }
}