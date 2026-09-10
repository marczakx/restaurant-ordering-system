package marczakx.restaurant.model.entity.order;

/**
 * Payment method chosen for an order. {@code null} on the order means
 * the order has no payment attached yet (e.g. legacy rows or orders
 * placed before the payment feature).
 */
public enum PaymentMethod {
  BLIK
}