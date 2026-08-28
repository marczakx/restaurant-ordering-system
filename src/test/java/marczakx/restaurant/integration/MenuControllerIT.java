package marczakx.restaurant.integration;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.junit.jupiter.TestcontainersExtension;

import marczakx.restaurant.model.dto.MenuItemDto;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
@ExtendWith(TestcontainersExtension.class)
public class MenuControllerIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void overrideProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", postgres::getDriverClassName);
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void shouldReturnMenu() {
        var response = restTemplate.getForEntity("/api/menu", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);
    }

    @Test
    void shouldAddMenuItem() {
        // Given - a new menu item to add
        MenuItemDto newItem = new MenuItemDto(
            null,
            "Test Pizza",
            15.99f,
            null,
            "Main course",
            null
        );

        // When - POST to /api/menu/items
        var response = restTemplate.postForEntity("/api/menu/items", newItem, MenuItemDto.class);

        // Then - should return CREATED with the created item
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isNotNull();
        assertThat(response.getBody().name()).isEqualTo("Test Pizza");
        assertThat(response.getBody().price()).isEqualTo(15.99f);
    }

    @Test
    void shouldAddMenuItemWithCuisines() {
        // Given - a new menu item with cuisines
        MenuItemDto newItem = new MenuItemDto(
            null,
            "Italian Pasta",
            12.50f,
            null,
            "Main course",
            java.util.Set.of(3L) // Italian cuisine
        );

        // When - POST to /api/menu/items
        var response = restTemplate.postForEntity("/api/menu/items", newItem, MenuItemDto.class);

        // Then - should return CREATED
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isNotNull();
        assertThat(response.getBody().name()).isEqualTo("Italian Pasta");
    }
}