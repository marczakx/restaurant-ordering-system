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
@Table(name = "menu_item")
public class MenuItem {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String name;

  private Float price;

  @ManyToMany
  @JoinTable(name = "menu_item__cuisine",
    joinColumns = {@JoinColumn(name = "menu_item_id")},
    inverseJoinColumns = {@JoinColumn(name = "cuisine_id")})
  private Set<Cuisines> cuisines = new HashSet<>();

  @ManyToMany
  @JoinTable(name = "menu_item__addition",
    joinColumns = {@JoinColumn(name = "menu_item_id")},
    inverseJoinColumns = {@JoinColumn(name = "addition_id")})
  Set<Addition> additions = new HashSet<>();

}
