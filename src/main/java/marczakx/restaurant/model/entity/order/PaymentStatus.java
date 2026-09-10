package marczakx.restaurant.model.entity.order;

/**
 * Lifecycle of a payment attached to an order. {@code null} on the
 * order means no payment has been attempted yet.
 */
public enum PaymentStatus {
  PENDING,
  CONFIRMED,
  FAILED
}