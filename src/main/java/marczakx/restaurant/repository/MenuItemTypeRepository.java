package marczakx.restaurant.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import marczakx.restaurant.model.entity.Cuisines;
import marczakx.restaurant.model.entity.MenuItemType;

@Repository
public interface MenuItemTypeRepository extends JpaRepository<MenuItemType, Long> {

  Optional<MenuItemType> findByName(String name);

}
