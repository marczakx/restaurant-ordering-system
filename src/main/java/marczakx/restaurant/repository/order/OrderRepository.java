package marczakx.restaurant.repository.order;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import marczakx.restaurant.model.entity.order.Order;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

  /**
   * Returns all orders placed by the user with the given stable id
   * (Keycloak {@code sub} claim). Used to scope the order list to the
   * authenticated user when they do not have the {@code order-viewer}
   * realm role and therefore must not see other people's orders.
   */
  List<Order> findByUserId(String userId);

}
