package marczakx.restaurant.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import marczakx.restaurant.service.MenuService;
import marczakx.restaurant.model.dto.*;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

  private final MenuService menuService;

  @GetMapping("cuisines")
  public List<CuisineDto> getCuisines() {
    return menuService.getCuisines();
  }

  @GetMapping("types")
  public List<MenuItemTypeDto> getMenuItemType() {
    return menuService.getMenuItemType();
  }

  @GetMapping("items")
  public List<MenuItemDto> getAllMenuItems(@RequestParam(required = false) Long cuisineId) {
    if (cuisineId == null) {
      return menuService.getAllMenuItems();
    }
    return menuService.getAllMenuItemsByCuisineId(cuisineId);
  }

  @GetMapping("items/{menuItemTypeName}")
  public List<MenuItemDto> getMenuItems(@PathVariable String menuItemTypeName,
      @RequestParam(required = false) Long cuisineId) {
    if(cuisineId == null) {
      return menuService.getMenuItemDtoListByTypeName(menuItemTypeName);
    }
    return menuService.getMenuItemsByTypeNameAndByCuisineId(menuItemTypeName, cuisineId);
  }

  @PostMapping("items")
  public ResponseEntity<MenuItemDto> addMenuItem(@RequestBody MenuItemDto menuItemDto) {
    MenuItemDto createdItem = menuService.addMenuItem(menuItemDto);
    return ResponseEntity.status(HttpStatus.CREATED).body(createdItem);
  }

}