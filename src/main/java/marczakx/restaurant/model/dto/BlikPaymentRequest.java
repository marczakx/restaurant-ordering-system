package marczakx.restaurant.model.dto;

/**
 * Request body for the BLIK payment endpoint. The 6-digit BLIK code is
 * validated by {@code PaymentService}; it is never stored - only the
 * resulting payment status is persisted on the order.
 */
public record BlikPaymentRequest(String blikCode) {
}