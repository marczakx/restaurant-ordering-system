package marczakx.restaurant.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import marczakx.restaurant.model.entity.Cuisines;

@Repository
public interface CuisinesRepository extends JpaRepository<Cuisines, Long> {

}
