package marczakx.restaurant.repository.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import marczakx.restaurant.model.entity.order.AdditionOrderItem;

@Repository
public interface AdditionOrderItemRepository extends JpaRepository<AdditionOrderItem, Long> {

}
