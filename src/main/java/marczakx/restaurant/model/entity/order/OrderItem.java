package marczakx.restaurant.model.entity.order;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.*;
import lombok.*;
import marczakx.restaurant.model.entity.MenuItem;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "order_item")
public class OrderItem {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne
  MenuItem menuItem;

  Float price;

  int quantity;

  @OneToMany(cascade = CascadeType.MERGE)
  @JoinColumn(name = "order_item_id")
  Set<AdditionOrderItem> additoinOrderItems = new HashSet<>();
}
