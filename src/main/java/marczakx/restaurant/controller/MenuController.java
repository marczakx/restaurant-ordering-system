package marczakx.restaurant.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import marczakx.restaurant.service.MenuService;
import marczakx.restaurant.model.dto.MenuItemDto;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {
  
  private final MenuService menuService;
  
  @GetMapping("items/{menuItemTypeName}")
  public List<MenuItemDto> getMenuItems(@PathVariable String menuItemTypeName) {
    return menuService.getMenuItemDtoListByTypeName(menuItemTypeName);
  }

}
