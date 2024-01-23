package marczakx.restaurant.model.entity;

import java.util.*;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "menu_item_type")
public class MenuItemType {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String name;

  @ManyToMany
  @JoinTable(name = "menu_item__menu_item_type",
    joinColumns = {@JoinColumn(name = "menu_item_type_id")},
    inverseJoinColumns = {@JoinColumn(name = "menu_item_id")})
  private Set<MenuItem> menuItems = new HashSet<>();
	
}