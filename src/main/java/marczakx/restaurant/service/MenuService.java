package marczakx.restaurant.service;

import java.util.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import marczakx.restaurant.model.dto.MenuItemDto;
import marczakx.restaurant.model.entity.*;
import marczakx.restaurant.repository.CuisinesRepository;
import marczakx.restaurant.repository.MenuItemTypeRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MenuService {

  private final CuisinesRepository cuisinesRepository;
  private final MenuItemTypeRepository menuItemTypeRepository;

  public List<Cuisines> getCuisines() {
    return cuisinesRepository.findAll();
  }

  @Transactional
  public List<MenuItemDto> getMainSourcesByCuisineId(Long id) {
    return getMenuItemsByTypeName("Main course")
      .stream()
      .filter(menuItem -> menuItem
        .getCuisines()
        .stream()
        .anyMatch(cuisines -> cuisines.getId().equals(id))
      )
      .map(e -> mapper(e)).toList();
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
    return new MenuItemDto(menuItem.getId(), menuItem.getName(), menuItem.getPrice(),
      new HashSet<>(menuItem.getAdditions()));
  }

}
