package marczakx.restaurant.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import marczakx.restaurant.model.dto.CuisineDto;
import marczakx.restaurant.model.dto.MenuItemDto;
import marczakx.restaurant.model.entity.Cuisines;
import marczakx.restaurant.model.entity.MenuItem;
import marczakx.restaurant.model.entity.MenuItemType;
import marczakx.restaurant.repository.CuisinesRepository;
import marczakx.restaurant.repository.MenuItemRepository;
import marczakx.restaurant.repository.MenuItemTypeRepository;

@ExtendWith(MockitoExtension.class)
public class MenuServiceTests {

  @Mock
  private CuisinesRepository cuisinesRepository;
  
  @Mock
  private MenuItemTypeRepository menuItemTypeRepository;
  
  @Mock
  private MenuItemRepository menuItemRepository;
  
  @InjectMocks
  private MenuService menuSevice;

  @Test
  void getCuisines_ListOfCuisine_Correct() {

    //Given
    List<Cuisines> givenCuisines = List.of(
      Cuisines.builder().build(),
      Cuisines.builder().build(),
      Cuisines.builder().build()
    );

    //When
    Mockito.when(cuisinesRepository.findAll()).thenReturn(givenCuisines);
    List<CuisineDto> actualCuisines = menuSevice.getCuisines(); 

    //Then
    assertEquals(3, actualCuisines.size());
  }
  
  @Test
  void getMenuItemsByTypeNameAndByCuisineId_MainCourses_MenuItemsWhereCousineIdIsOne() {

    //Given
    Set<MenuItem> givenMenuItems = Set.of(
      MenuItem.builder().name("Item 1").additions(Set.of()).cuisines(Set.of(Cuisines.builder().id(1L).build())).build(),
      MenuItem.builder().name("Item 2").additions(Set.of()).cuisines(Set.of(Cuisines.builder().id(1L).build())).build(),
      MenuItem.builder().name("Item 3").additions(Set.of()).cuisines(Set.of(Cuisines.builder().id(2L).build())).build(),
      MenuItem.builder().name("Item 4").additions(Set.of()).cuisines(Set.of(Cuisines.builder().id(3L).build())).build()
    );
    Optional<MenuItemType> mainCourse = Optional.of(MenuItemType.builder().menuItems(givenMenuItems).build());

    //When
    Mockito.when(menuItemTypeRepository.findByName("Main course")).thenReturn(mainCourse);

    //Then
    List<MenuItemDto> actualMenuitems = menuSevice.getMenuItemsByTypeNameAndByCuisineId("Main course", 1l);
    assertNotNull(actualMenuitems);
    assertThat(actualMenuitems).isNotNull();
    assertEquals(2, actualMenuitems.size());
    assertTrue(actualMenuitems.stream().anyMatch(e -> e.name().equals("Item 1")));
    assertTrue(actualMenuitems.stream().anyMatch(e -> e.name().equals("Item 2")));
  }
  
  
  @Test
  void getMenuItemsByTypeName__MainCourses_MenuItems() {

    //Given
    Set<MenuItem> givenMenuItems = Set.of(
      MenuItem.builder().name("Item 1").additions(Set.of()).cuisines(Set.of(Cuisines.builder().id(1L).build())).build(),
      MenuItem.builder().name("Item 2").additions(Set.of()).cuisines(Set.of(Cuisines.builder().id(1L).build())).build(),
      MenuItem.builder().name("Item 3").additions(Set.of()).cuisines(Set.of(Cuisines.builder().id(2L).build())).build(),
      MenuItem.builder().name("Item 4").additions(Set.of()).cuisines(Set.of(Cuisines.builder().id(3L).build())).build()
    );
    Optional<MenuItemType> mainCourse = Optional.of(MenuItemType.builder().menuItems(givenMenuItems).build());

    //When
    Mockito.when(menuItemTypeRepository.findByName("Main course")).thenReturn(mainCourse);

    //Then
    List<MenuItemDto> actualMenuitems = menuSevice.getMenuItemDtoListByTypeName("Main course");
    assertNotNull(actualMenuitems);
    assertThat(actualMenuitems).isNotNull();
    assertEquals(4, actualMenuitems.size());
    assertTrue(actualMenuitems.stream().anyMatch(e -> e.name().equals("Item 1")));
    assertTrue(actualMenuitems.stream().anyMatch(e -> e.name().equals("Item 2")));
    assertTrue(actualMenuitems.stream().anyMatch(e -> e.name().equals("Item 3")));
    assertTrue(actualMenuitems.stream().anyMatch(e -> e.name().equals("Item 4")));
  }

  @Test
  void addMenuItem_ValidMenuItemDto_ReturnsCreatedItem() {
    // Given
    MenuItemDto inputDto = new MenuItemDto(
      null,
      "New Pizza",
      12.99f,
      new ArrayList<>(),
      "Pizza",
      Set.of(1L, 2L)
    );

    MenuItemType pizzaType = MenuItemType.builder()
      .id(1L)
      .name("Pizza")
      .menuItems(new HashSet<>())
      .build();

    Cuisines cuisine1 = Cuisines.builder().id(1L).name("Italian").build();
    Cuisines cuisine2 = Cuisines.builder().id(2L).name("Mediterranean").build();

    MenuItem savedItem = MenuItem.builder()
      .id(10L)
      .name("New Pizza")
      .price(12.99f)
      .cuisines(Set.of(cuisine1, cuisine2))
      .build();

    Mockito.when(menuItemTypeRepository.findByName("Pizza")).thenReturn(Optional.of(pizzaType));
    Mockito.when(cuisinesRepository.findAllById(Set.of(1L, 2L))).thenReturn(List.of(cuisine1, cuisine2));
    Mockito.when(menuItemRepository.save(Mockito.any(MenuItem.class))).thenReturn(savedItem);

    // When
    MenuItemDto result = menuSevice.addMenuItem(inputDto);

    // Then
    assertNotNull(result);
    assertEquals("New Pizza", result.name());
    assertEquals(12.99f, result.price());
  }

  @Test
  void addMenuItem_InvalidMenuItemType_ThrowsException() {
    // Given
    MenuItemDto inputDto = new MenuItemDto(
      null,
      "New Pizza",
      12.99f,
      new ArrayList<>(),
      "NonExistentType",
      Set.of()
    );

    Mockito.when(menuItemTypeRepository.findByName("NonExistentType")).thenReturn(Optional.empty());

    // When & Then
    assertThrows(IllegalArgumentException.class, () -> menuSevice.addMenuItem(inputDto));
  }

}