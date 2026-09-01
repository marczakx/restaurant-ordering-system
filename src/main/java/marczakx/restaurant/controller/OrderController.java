package marczakx.restaurant.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
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

  /**
   * Realm role that grants the right to see every order in the system
   * regardless of who placed it. Without this role the caller only sees
   * their own orders.
   */
  static final String ORDER_VIEWER_ROLE = "ROLE_order-viewer";

  private final OrderService orderService;
  private final OrderEventPublisher orderEventPublisher;

  @PutMapping
  public Order save(@RequestBody Order order) {
    Order savedOrder = orderService.saveOrder(order);
    orderEventPublisher.publishOrder(savedOrder);
    return savedOrder;
  }

  /**
   * Lists orders visible to the caller. The visibility decision is
   * driven by two pieces of information:
   * <ul>
   *   <li>The Spring Security authentication - used to detect the
   *       {@code order-viewer} role for users who logged in via the
   *       backend OAuth2 flow (e.g. Google).</li>
   *   <li>The optional {@code viewer}/{@code customer} query
   *       parameters sent by the SPA from the Keycloak JWT. The
   *       Keycloak access token is not validated server-side yet (see
   *       {@link marczakx.restaurant.configuration.SecurityConfig}),
   *       so the SPA is trusted to relay these claims. {@code viewer}
   *       is set when the JWT carries the {@code order-viewer} realm
   *       role; {@code customer} is the Keycloak
   *       {@code preferred_username} used to scope the result for
   *       non-viewers.</li>
   * </ul>
   * When the caller has the viewer privilege (either by a backend
   * OAuth2 role or the SPA's {@code viewer} flag) the full list is
   * returned. Everyone else gets orders whose {@code customer} field
   * matches the resolved username, or nothing when no username is
   * available.
   */
  @GetMapping
  public List<Order> getAll(
      @RequestParam(value = "customer", required = false) String customer,
      @RequestParam(value = "viewer", required = false) Boolean viewer) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    boolean canViewAllOrders = hasRole(authentication, ORDER_VIEWER_ROLE)
        || Boolean.TRUE.equals(viewer);
    String username = resolveUsername(authentication, customer);
    return orderService.findAll(canViewAllOrders, username);
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

  /**
   * Returns {@code true} when the supplied authentication carries the
   * given Spring Security authority (role). Matches by exact authority
   * name; {@code null} or anonymous authentications return {@code false}.
   */
  private static boolean hasRole(Authentication authentication, String authority) {
    if (authentication == null || authentication.getAuthorities() == null) {
      return false;
    }
    for (GrantedAuthority granted : authentication.getAuthorities()) {
      if (authority.equals(granted.getAuthority())) {
        return true;
      }
    }
    return false;
  }

  /**
   * Picks the best username available for filtering. Prefers the value
   * the SPA sent in the {@code customer} query parameter (the Keycloak
   * {@code preferred_username} claim) because Keycloak tokens are not
   * validated server-side yet. Falls back to the Spring Security
   * principal name for backend-OAuth2 logins (e.g. Google). Returns
   * {@code null} when neither is available - the service treats that as
   * "scope to nothing" for callers without the viewer role.
   */
  private static String resolveUsername(Authentication authentication, String customer) {
    if (customer != null && !customer.isBlank()) {
      return customer;
    }
    if (authentication != null && authentication.getName() != null
        && !authentication.getName().isBlank()
        && !"anonymousUser".equals(authentication.getName())) {
      return authentication.getName();
    }
    return null;
  }

}