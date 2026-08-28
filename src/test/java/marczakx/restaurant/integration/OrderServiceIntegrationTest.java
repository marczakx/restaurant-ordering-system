package marczakx.restaurant.integration;

import marczakx.restaurant.model.dto.MenuItemDto;
import marczakx.restaurant.repository.MenuItemRepository;
import marczakx.restaurant.service.MenuService;
import org.junit.jupiter.api.Test;

import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.junit.jupiter.TestcontainersExtension;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers
@ExtendWith(TestcontainersExtension.class)
@ActiveProfiles("test")
public class OrderServiceIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("restaurant")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private MenuService menuService;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Test
    void shouldAddMenuItemAndPersistToDatabase() {
        // Given - a new menu item
        MenuItemDto newItem = new MenuItemDto(
            null,
            "Integration Test Pizza",
            18.99f,
            null,
            "Main course",
            java.util.Set.of(1L, 2L) // Polish and Mexican cuisines
        );

        // When - add the menu item
        MenuItemDto result = menuService.addMenuItem(newItem);

        // Then - item should be created and persisted
        assertThat(result).isNotNull();
        assertThat(result.id()).isNotNull();
        assertThat(result.name()).isEqualTo("Integration Test Pizza");
        assertThat(result.price()).isEqualTo(18.99f);

        // Verify it exists in database
        assertThat(menuItemRepository.findById(result.id())).isPresent();
        assertThat(menuItemRepository.findById(result.id()).get().getName()).isEqualTo("Integration Test Pizza");
    }
}