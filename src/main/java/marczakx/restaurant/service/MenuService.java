package marczakx.restaurant.service;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import marczakx.restaurant.model.dto.*;
import marczakx.restaurant.model.entity.*;
import marczakx.restaurant.repository.CuisinesRepository;
import marczakx.restaurant.repository.MenuItemRepository;
import marczakx.restaurant.repository.MenuItemTypeRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MenuService {

  private final CuisinesRepository cuisinesRepository;
  private final MenuItemTypeRepository menuItemTypeRepository;
  private final MenuItemRepository menuItemRepository;

  public List<CuisineDto> getCuisines() {
    return cuisinesRepository.findAll().stream().map(e -> new CuisineDto(e.getId(), e.getName())).toList();
  }

  public List<MenuItemTypeDto> getMenuItemType() {
    return menuItemTypeRepository.findAll().stream().map(e -> new MenuItemTypeDto(e.getId(), e.getName())).toList();
  }

  @Transactional
  public List<MenuItemDto> getMenuItemsByTypeNameAndByCuisineId(String menuItemTypeName, Long id) {
    return getMenuItemsByTypeName(menuItemTypeName).stream()
        .filter(menuItem -> menuItem.getCuisines().stream().anyMatch(cuisines -> cuisines.getId().equals(id)))
        .map(e -> mapper(e)).toList();
  }

  @Transactional
  public List<MenuItemDto> getAllMenuItems() {
    return menuItemRepository.findAll().stream().map(e -> mapper(e)).toList();
  }

  @Transactional
  public List<MenuItemDto> getAllMenuItemsByCuisineId(Long cuisineId) {
    return menuItemRepository.findAllByCuisinesId(cuisineId).stream().map(e -> mapper(e)).toList();
  }

  @Transactional
  public List<MenuItemDto> getMenuItemDtoListByTypeName(String menuItemTypeName) {
    return getMenuItemsByTypeName(menuItemTypeName).stream().map(e -> mapper(e)).toList();
  }

  @Transactional
  private List<MenuItem> getMenuItemsByTypeName(String menuItemTypeName) {
    return menuItemTypeRepository.findByName(menuItemTypeName).orElseThrow().getMenuItems().stream().toList();
  }

  private MenuItemDto mapper(MenuItem menuItem) {
    List<Addition> additions = menuItem.getAdditions() != null 
        ? new ArrayList<>(menuItem.getAdditions()) 
        : new ArrayList<>();
    Set<Long> cuisineIds = menuItem.getCuisines() != null 
        ? menuItem.getCuisines().stream().map(Cuisines::getId).collect(Collectors.toSet())
        : new HashSet<>();
    String menuItemTypeName = menuItem.getMenuItemType() != null 
        ? menuItem.getMenuItemType().stream().findFirst().map(MenuItemType::getName).orElse(null)
        : null;
    return new MenuItemDto(menuItem.getId(), menuItem.getName(), menuItem.getPrice(),
      additions, menuItemTypeName, cuisineIds);
  }

  @Transactional
  public MenuItemDto updateMenuItem(Long id, MenuItemDto menuItemDto) {
    MenuItem menuItem = menuItemRepository.findById(id)
        .orElseThrow(() -> new IllegalArgumentException("Menu item not found: " + id));

    menuItem.setName(menuItemDto.name());
    menuItem.setPrice(menuItemDto.price());

    if (menuItemDto.menuItemTypeName() != null) {
      // The owning side of the relation drives the join table update:
      menuItem.getMenuItemType().clear();

      // An empty type name means "no type" – clear the relation instead of
      // looking up a type that cannot exist.
      if (!menuItemDto.menuItemTypeName().isBlank()) {
        MenuItemType menuItemType = menuItemTypeRepository.findByName(menuItemDto.menuItemTypeName())
            .orElseThrow(() -> new IllegalArgumentException("Menu item type not found: " + menuItemDto.menuItemTypeName()));

        menuItem.getMenuItemType().add(menuItemType);

        // Keep the inverse side consistent in memory (same approach as addMenuItem):
        if (menuItemType.getMenuItems() == null || !(menuItemType.getMenuItems() instanceof HashSet)) {
          menuItemType.setMenuItems(new HashSet<>());
        }
        menuItemType.getMenuItems().add(menuItem);
      }
    }

    if (menuItemDto.cuisineIds() != null) {
      Set<Cuisines> cuisines = new HashSet<>(cuisinesRepository.findAllById(menuItemDto.cuisineIds()));
      menuItem.setCuisines(cuisines);
    }

    return mapper(menuItem);
  }

  @Transactional
  public MenuItemDto addMenuItem(MenuItemDto menuItemDto) {
    MenuItemType menuItemType = menuItemTypeRepository.findByName(menuItemDto.menuItemTypeName())
        .orElseThrow(() -> new IllegalArgumentException("Menu item type not found: " + menuItemDto.menuItemTypeName()));

    Set<Cuisines> cuisines = new HashSet<>();
    if (menuItemDto.cuisineIds() != null) {
      cuisines = new HashSet<>(cuisinesRepository.findAllById(menuItemDto.cuisineIds()));
    }

    MenuItem menuItem = MenuItem.builder()
        .name(menuItemDto.name())
        .price(menuItemDto.price())
        .cuisines(cuisines)
        .build();

    MenuItem savedItem = menuItemRepository.save(menuItem);
    
    // Ensure the set is mutable and add the saved item
    if (menuItemType.getMenuItems() == null || !(menuItemType.getMenuItems() instanceof HashSet)) {
      menuItemType.setMenuItems(new HashSet<>());
    }
    menuItemType.getMenuItems().add(savedItem);

    return mapper(savedItem);
  }

}