package marczakx.restaurant.service;

import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import marczakx.restaurant.model.entity.order.Order;
import marczakx.restaurant.model.entity.order.PaymentMethod;
import marczakx.restaurant.model.entity.order.PaymentStatus;

/**
 * Handles order payments. BLIK payments are processed by a simulated
 * payment provider: every well-formed 6-digit code is accepted except
 * {@link #REJECTED_BLIK_CODE}, which is rejected so the failure path
 * can be exercised without a real payment operator. Swapping the
 * simulation for a real BLIK acquirer only requires replacing the
 * authorisation step in {@link #payWithBlik(Long, String)}.
 */
@Service
@RequiredArgsConstructor
public class PaymentService {

  /**
   * BLIK code that the simulated provider always rejects. Useful for
   * tests and for demonstrating the failure path end to end.
   */
  static final String REJECTED_BLIK_CODE = "000000";

  private static final Pattern BLIK_CODE_PATTERN = Pattern.compile("\\d{6}");

  private final OrderService orderService;

  /**
   * Pays the given order with BLIK.
   *
   * @param orderId  id of the order to pay for
   * @param blikCode the 6-digit BLIK code entered by the customer
   * @return the updated order with {@code paymentMethod=BLIK} and the
   *         resulting {@code paymentStatus}
   * @throws IllegalArgumentException when the code is not exactly six
   *                                  digits
   * @throws IllegalStateException    when the order is already paid
   */
  @Transactional
  public Order payWithBlik(Long orderId, String blikCode) {
    if (blikCode == null || !BLIK_CODE_PATTERN.matcher(blikCode).matches()) {
      throw new IllegalArgumentException("BLIK code must be exactly 6 digits");
    }
    Order order = orderService.getOrderById(orderId);
    if (order.getPaymentStatus() == PaymentStatus.CONFIRMED) {
      throw new IllegalStateException("Order already paid: " + orderId);
    }
    order.setPaymentMethod(PaymentMethod.BLIK);
    order.setPaymentStatus(REJECTED_BLIK_CODE.equals(blikCode)
        ? PaymentStatus.FAILED
        : PaymentStatus.CONFIRMED);
    return orderService.saveOrder(order);
  }
}