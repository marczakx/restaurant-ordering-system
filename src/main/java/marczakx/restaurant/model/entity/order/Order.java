package marczakx.restaurant.model.entity.order;

import java.util.*;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.*;
import lombok.Setter;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "orders")
public class Order {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
  @JoinColumn(name = "order_id")
  Set<OrderItem> orderItems = new HashSet<>();

  String customer;

  /**
   * Stable identifier of the user that placed the order. Backed by the
   * Keycloak {@code sub} claim so the same person is matched even when
   * their display name (see {@link #customer}) changes. {@code null}
   * for legacy rows that pre-date the column - the repository treats
   * those as "not owned by any known user".
   */
  String userId;

  @Enumerated(EnumType.STRING)
  @Builder.Default
  OrderStatus status = OrderStatus.TO_DO;

}
