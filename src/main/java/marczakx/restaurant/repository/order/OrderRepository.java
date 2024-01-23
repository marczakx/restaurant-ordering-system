package marczakx.restaurant.repository.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import marczakx.restaurant.model.entity.order.Order;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

}
