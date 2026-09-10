package marczakx.restaurant.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import marczakx.restaurant.model.entity.order.Order;
import marczakx.restaurant.model.entity.order.OrderStatus;
import marczakx.restaurant.model.entity.order.PaymentMethod;
import marczakx.restaurant.model.entity.order.PaymentStatus;

@ExtendWith(MockitoExtension.class)
public class PaymentServiceTests {

  @Mock
  OrderService orderService;

  @InjectMocks
  PaymentService paymentService;

  @Test
  void payWithBlik_ValidCode_PaymentConfirmed() {
    // Given
    Order order = Order.builder().id(1L).status(OrderStatus.TO_DO).build();
    when(orderService.getOrderById(1L)).thenReturn(order);
    when(orderService.saveOrder(any())).thenAnswer(i -> i.getArgument(0));

    // When
    Order paidOrder = paymentService.payWithBlik(1L, "123456");

    // Then
    assertEquals(PaymentMethod.BLIK, paidOrder.getPaymentMethod());
    assertEquals(PaymentStatus.CONFIRMED, paidOrder.getPaymentStatus());
    verify(orderService).saveOrder(order);
  }

  @Test
  void payWithBlik_RejectedCode_PaymentFailed() {
    // Given - "000000" is always rejected by the simulated provider
    Order order = Order.builder().id(1L).status(OrderStatus.TO_DO).build();
    when(orderService.getOrderById(1L)).thenReturn(order);
    when(orderService.saveOrder(any())).thenAnswer(i -> i.getArgument(0));

    // When
    Order paidOrder = paymentService.payWithBlik(1L, PaymentService.REJECTED_BLIK_CODE);

    // Then - the attempt is recorded as failed, not confirmed
    assertEquals(PaymentMethod.BLIK, paidOrder.getPaymentMethod());
    assertEquals(PaymentStatus.FAILED, paidOrder.getPaymentStatus());
  }

  @Test
  void payWithBlik_NullCode_ExceptionThrown() {
    // When / Then
    assertThrows(IllegalArgumentException.class, () -> paymentService.payWithBlik(1L, null));
  }

  @Test
  void payWithBlik_TooShortCode_ExceptionThrown() {
    // When / Then
    assertThrows(IllegalArgumentException.class, () -> paymentService.payWithBlik(1L, "12345"));
  }

  @Test
  void payWithBlik_NonNumericCode_ExceptionThrown() {
    // When / Then
    assertThrows(IllegalArgumentException.class, () -> paymentService.payWithBlik(1L, "12a456"));
  }

  @Test
  void payWithBlik_TooLongCode_ExceptionThrown() {
    // When / Then
    assertThrows(IllegalArgumentException.class, () -> paymentService.payWithBlik(1L, "1234567"));
  }

  @Test
  void payWithBlik_MalformedCode_OrderNotTouched() {
    // Given - the code format is validated before the order is even loaded,
    // so a malformed code must not touch the order at all.

    // When / Then
    assertThrows(IllegalArgumentException.class, () -> paymentService.payWithBlik(1L, "abc"));
    verify(orderService, org.mockito.Mockito.never()).getOrderById(any());
    verify(orderService, org.mockito.Mockito.never()).saveOrder(any());
  }

  @Test
  void payWithBlik_AlreadyConfirmedOrder_ExceptionThrown() {
    // Given
    Order paidOrder = Order.builder()
      .id(1L)
      .paymentMethod(PaymentMethod.BLIK)
      .paymentStatus(PaymentStatus.CONFIRMED)
      .build();
    when(orderService.getOrderById(1L)).thenReturn(paidOrder);

    // When / Then - double payment must be rejected
    assertThrows(IllegalStateException.class, () -> paymentService.payWithBlik(1L, "123456"));
  }

  @Test
  void payWithBlik_FailedPayment_CanBeRetried() {
    // Given - an order whose previous BLIK attempt failed
    Order order = Order.builder()
      .id(1L)
      .paymentMethod(PaymentMethod.BLIK)
      .paymentStatus(PaymentStatus.FAILED)
      .build();
    when(orderService.getOrderById(1L)).thenReturn(order);
    when(orderService.saveOrder(any())).thenAnswer(i -> i.getArgument(0));

    // When
    Order retriedOrder = paymentService.payWithBlik(1L, "654321");

    // Then - a retry with a valid code confirms the payment
    assertEquals(PaymentStatus.CONFIRMED, retriedOrder.getPaymentStatus());
  }

  @Test
  void payWithBlik_NewOrder_PaymentFieldsStartNull() {
    // Given - sanity check that a fresh order has no payment attached
    Order order = Order.builder().id(1L).build();

    // Then
    assertNull(order.getPaymentMethod());
    assertNull(order.getPaymentStatus());
  }
}