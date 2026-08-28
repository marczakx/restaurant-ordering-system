package marczakx.restaurant.integration;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
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

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
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
        var response = restTemplate.getForEntity("/api/menu/items", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
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

    @Test
    void shouldUpdateMenuItem() {
        // Given - create an item first
        MenuItemDto newItem = new MenuItemDto(
            null,
            "Pizza To Update",
            10.00f,
            null,
            "Main course",
            null
        );
        var created = restTemplate.postForEntity("/api/menu/items", newItem, MenuItemDto.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Long id = created.getBody().id();

        // When - update the item via PUT
        MenuItemDto updateDto = new MenuItemDto(
            id,
            "Updated Pizza",
            19.99f,
            null,
            "Main course",
            java.util.Set.of(3L)
        );
        var response = restTemplate.exchange("/api/menu/items/" + id, HttpMethod.PUT,
            new HttpEntity<>(updateDto), MenuItemDto.class);

        // Then - should return OK with updated values
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isEqualTo(id);
        assertThat(response.getBody().name()).isEqualTo("Updated Pizza");
        assertThat(response.getBody().price()).isEqualTo(19.99f);

        // And - the change should be persisted
        var fetched = restTemplate.getForEntity("/api/menu/items", MenuItemDto[].class);
        assertThat(fetched.getBody()).anyMatch(item -> item.id().equals(id)
            && "Updated Pizza".equals(item.name()));
    }

    @Test
    void shouldReturnErrorWhenUpdatingNonExistingMenuItem() {
        // Given - an update for an item that does not exist
        MenuItemDto updateDto = new MenuItemDto(
            999999L,
            "Ghost Pizza",
            10.00f,
            null,
            "Main course",
            null
        );

        // When - PUT to /api/menu/items/{id} with non-existing id
        var response = restTemplate.exchange("/api/menu/items/999999", HttpMethod.PUT,
            new HttpEntity<>(updateDto), String.class);

        // Then - should not return OK
        assertThat(response.getStatusCode()).isNotEqualTo(HttpStatus.OK);
    }
}
